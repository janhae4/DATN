import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { Prisma, Task, TaskStatus } from './generated/prisma';
import { GoogleCalendarService } from './google-calendar.service';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { REDIS_CLIENT } from '@app/contracts/constants';
import { firstValueFrom } from 'rxjs';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@app/contracts/errror';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { UpdateTaskDto } from '@app/contracts/task/update-task.dto';
import { CreateTaskDto } from '@app/contracts/task/create-task.dto';
import { TASK_PATTERNS } from '@app/contracts/task/task.patterns';
import * as celery from 'celery-node'; 

const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
@Injectable()
export class TaskServiceService {
  private task: any;
  constructor(
    private prisma: PrismaService,
    private googleService: GoogleCalendarService,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
  ) {
    console.log('process.env.RMQ_URL', process.env.RMQ_URL);
    console.log('process.env.REDIS_URL', process.env.REDIS_URL);
    const client = celery.createClient(
      "amqp://test:test@localhost:5672/?frameMax=8192",
      "redis://localhost:6379/",
    )
    this.task = client.createTask(TASK_PATTERNS.PROCESS_NLP);
  }

  private async getTaskNer<T>(text: string): Promise<T> {
    return await this.task.applyAsync([], { text }).get();
  }

  async findAll(): Promise<Task[]> {
    return await this.prisma.task.findMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!task) {
      throw new NotFoundException("Task not found");
    }
    return task;
  }

  async findByUserId(userId: string): Promise<Task[]> {
    return await this.prisma.$queryRaw<Task[]>`
            WITH TaskPriority AS (
                SELECT
                    t."taskId",
                    t."userId",
                    t.title,
                    t.description,
                    t.deadline,
                    t.status,
                    t."createdAt",
                    t."updatedAt",
                    t.priority AS "dbPriority",

                    CASE
                        WHEN t.deadline IS NULL THEN NULL
                        ELSE EXTRACT(EPOCH FROM (t.deadline - NOW()))
                    END AS "secondsUntilDeadline",

                    CASE
                        WHEN t.status = 'DONE' THEN COALESCE(t.priority, 1)
                        WHEN t.deadline IS NULL THEN COALESCE(t.priority, 1)
                        
                        WHEN EXTRACT(EPOCH FROM (t.deadline - NOW())) <= 0 THEN 5
                        WHEN EXTRACT(EPOCH FROM (t.deadline - NOW())) < ${6 * SECONDS_IN_HOUR} THEN 5 
                        WHEN EXTRACT(EPOCH FROM (t.deadline - NOW())) < ${2 * SECONDS_IN_DAY} THEN 4
                        WHEN EXTRACT(EPOCH FROM (t.deadline - NOW())) < ${7 * SECONDS_IN_DAY} THEN 3
                        WHEN EXTRACT(EPOCH FROM (t.deadline - NOW())) < ${30 * SECONDS_IN_DAY} THEN 2
                        
                        ELSE COALESCE(t.priority, 1) -- Mặc định là priority trong DB hoặc 1
                    END AS "calculatedPriority" 

                FROM "task" t
                WHERE t."userId" = ${userId}
            )
            -- SELECT cuối cùng: trả về tất cả các cột cần thiết
            SELECT
                "taskId",
                "userId",
                title,
                description,
                deadline,
                status,
                "createdAt",
                "updatedAt",
                "calculatedPriority" AS priority
            FROM TaskPriority
            ORDER BY "calculatedPriority" DESC, deadline ASC
    `;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { userId, text } = createTaskDto;
    const data = await this.getTaskNer(text) as Prisma.TaskCreateInput;
    console.log(data)
    data.userId = userId ?? data.userId;
    data.status = TaskStatus.IN_PROGRESS;
    try {
      return this.prisma.task.create({ data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Task already exists');
      }
      throw new RpcException(error);
    }
  }

  async update(taskId: string, data: UpdateTaskDto): Promise<Task> {
    try {
      return await this.prisma.task.update({
        where: { taskId },
        data,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw new RpcException(error);
    }
  }

  async remove(id: string): Promise<Task> {
    try {
      return await this.prisma.task.delete({
        where: { taskId: id },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException('Task not found');
      }
      throw new RpcException(error);
    }
  }

  private async getGoogleTokens(userId: string) {
    try {
      const jwt = await firstValueFrom<LoginResponseDto>(
        this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, userId),
      );

      if (!jwt) {
        throw new BadRequestException('No Google account linked');
      }

      return {
        accessToken: jwt.accessToken,
        refreshToken: jwt.refreshToken,
        userId,
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token expired');
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid access token');
      }
    }
  }

  async findGoogleEvents(accessToken: string) {
    const jwt = await this.getGoogleTokens(accessToken);
    console.log(jwt);
    if (!jwt?.accessToken || !jwt?.refreshToken || !jwt?.userId) {
      throw new BadRequestException('No Google account linked');
    }
    return this.googleService.findEvents(
      jwt?.userId,
      jwt?.accessToken,
      jwt?.refreshToken,
    );
  }

  async createGoogleEvent(accessToken: string, event: Task) {
    const jwt = await this.getGoogleTokens(accessToken);
    if (!jwt?.accessToken || !jwt?.refreshToken || !jwt?.userId) {
      throw new BadRequestException('No Google account linked');
    }
    return this.googleService.createEvent(
      jwt?.userId,
      jwt?.accessToken,
      jwt?.refreshToken,
      event,
    );
  }

  async updateGoogleEvent(accessToken: string, eventId: string, event: Task) {
    const jwt = await this.getGoogleTokens(accessToken);
    if (!jwt?.accessToken || !jwt?.refreshToken || !jwt?.userId) {
      throw new BadRequestException('No Google account linked');
    }
    return this.googleService.updateEvent(
      jwt?.userId,
      jwt?.accessToken,
      jwt?.refreshToken,
      eventId,
      event,
    );
  }

  async deleteGoogleEvent(accessToken: string, eventId: string) {
    const jwt = await this.getGoogleTokens(accessToken);
    if (!jwt?.accessToken || !jwt?.refreshToken || !jwt?.userId) {
      throw new BadRequestException('No Google account linked');
    }
    return this.googleService.deleteEvent(
      jwt?.userId,
      jwt?.accessToken,
      jwt?.refreshToken,
      eventId,
    );
  }
}
