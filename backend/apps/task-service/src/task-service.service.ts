import { Inject, Injectable, Logger } from '@nestjs/common'; // 1. Import Logger
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { JsonWebTokenError, TokenExpiredError } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { Prisma, Task } from './generated/prisma';
import { GoogleCalendarService } from './google-calendar.service';
import { firstValueFrom } from 'rxjs';
import {
  BadRequestException,
  ConflictException,
  CreateTaskDto,
  LoginResponseDto,
  NotFoundException,
  REDIS_CLIENT,
  REDIS_PATTERN,
  TASK_NER_CLIENT,
  UnauthorizedException,
  UpdateTaskDto,
} from '@app/contracts';

const SECONDS_IN_HOUR = 60 * 60;
const SECONDS_IN_DAY = 24 * SECONDS_IN_HOUR;
@Injectable()
export class TaskServiceService {
  // 2. Instantiate the logger
  private readonly logger = new Logger(TaskServiceService.name);

  constructor(
    private prisma: PrismaService,
    private googleService: GoogleCalendarService,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(TASK_NER_CLIENT) private readonly taskNerClient: ClientProxy,
  ) { }

  private async getTaskNer<T>(text: string): Promise<T> {
    this.logger.debug(`Sending text to NER service for parsing: "${text}"`);
    return await firstValueFrom(this.taskNerClient.send('parse_text', text));
  }

  async findAll(): Promise<Task[]> {
    this.logger.log('Fetching all tasks from the database.');
    return await this.prisma.task.findMany();
  }

  async findOne(id: string): Promise<Task> {
    this.logger.log(`Finding task with ID: ${id}`);
    const task = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!task) {
      this.logger.warn(`Task with ID ${id} not found.`);
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async findByUserId(userId: string): Promise<Task[]> {
    this.logger.log(`Finding and sorting tasks for user ID: ${userId}`);
    // This is a complex query, adding a debug log to show it's being executed.
    this.logger.debug(`Executing raw SQL query for prioritized tasks for user ${userId}.`);
    return await this.prisma.$queryRaw<Task[]>`
            WITH TaskPriority AS (
                SELECT
                    t."taskId",
                    t."userId",
                    t.title,
                    t.person,
                    t.description,
                    t.startTime,
                    t.endTime,
                    t.isDaily,
                    t.status,
                    t."createdAt",
                    t."updatedAt",
                    t.priority AS "dbPriority",

                    CASE
                        WHEN t.endTime IS NULL THEN NULL
                        ELSE EXTRACT(EPOCH FROM (t.endTime - NOW()))
                    END AS "secondsUntilDeadline",

                    CASE
                        WHEN t.status = 'DONE' THEN COALESCE(t.priority, 1)
                        WHEN t.endTime IS NULL THEN COALESCE(t.priority, 1)
                        
                        WHEN EXTRACT(EPOCH FROM (t.endTime - NOW())) <= 0 THEN 5
                        WHEN EXTRACT(EPOCH FROM (t.endTime - NOW())) < ${6 * SECONDS_IN_HOUR} THEN 5 
                        WHEN EXTRACT(EPOCH FROM (t.endTime - NOW())) < ${2 * SECONDS_IN_DAY} THEN 4
                        WHEN EXTRACT(EPOCH FROM (t.endTime - NOW())) < ${7 * SECONDS_IN_DAY} THEN 3
                        WHEN EXTRACT(EPOCH FROM (t.endTime - NOW())) < ${30 * SECONDS_IN_DAY} THEN 2
                        
                        ELSE COALESCE(t.priority, 1)
                    END AS "calculatedPriority" 

                FROM "task" t
                WHERE t."userId" = ${userId}
            )
            SELECT
                "taskId",
                "userId",
                title,
                description,
                person,
                startTime,
                endTime,
                isDaily,
                status,
                "createdAt",
                "updatedAt",
                "calculatedPriority" AS priority
            FROM TaskPriority
            ORDER BY "calculatedPriority" DESC, endTime ASC
    `;
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const { userId, text } = createTaskDto;
    this.logger.log(`Attempting to create task for user ${userId} from text: "${text}"`);

    const taskNer = await this.getTaskNer<{
      task: string;
      person: string;
      startTime: Date;
      endTime: Date;
      isDaily: boolean;
    }>(text);

    const data: Prisma.TaskCreateInput = {
      userId: userId ?? '',
      title: taskNer.task,
      description: text,
      person: taskNer.person,
      startTime: new Date(taskNer.startTime),
      endTime: taskNer.endTime ? new Date(taskNer.endTime) : null,
      isDaily: taskNer.isDaily,
    };

    try {
      const createdTask = await this.prisma.task.create({ data });
      this.logger.log(`Successfully created task ${createdTask.taskId} for user ${userId}.`);
      return createdTask;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(`Conflict error while creating task for user ${userId}. A similar task may already exist.`);
        throw new ConflictException('Task already exists');
      }
      this.logger.error(`Failed to create task for user ${userId}.`, error.stack);
      throw new RpcException(error as Error);
    }
  }

  async update(taskId: string, data: UpdateTaskDto): Promise<Task> {
    this.logger.log(`Attempting to update task with ID: ${taskId}`);
    try {
      const updatedTask = await this.prisma.task.update({
        where: { taskId },
        data,
      });
      this.logger.log(`Successfully updated task ${taskId}.`);
      return updatedTask;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Update failed. Task with ID ${taskId} not found.`);
        throw new NotFoundException('Task not found');
      }
      this.logger.error(`Failed to update task ${taskId}.`, error.stack);
      throw new RpcException(error as Error);
    }
  }

  async remove(id: string): Promise<Task> {
    this.logger.log(`Attempting to remove task with ID: ${id}`);
    try {
      const deletedTask = await this.prisma.task.delete({
        where: { taskId: id },
      });
      this.logger.log(`Successfully removed task ${id}.`);
      return deletedTask;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        this.logger.warn(`Remove failed. Task with ID ${id} not found.`);
        throw new NotFoundException('Task not found');
      }
      this.logger.error(`Failed to remove task ${id}.`, error.stack);
      throw new RpcException(error as Error);
    }
  }

  private async getGoogleTokens(userId: string) {
    this.logger.debug(`Fetching Google tokens from Redis for user: ${userId}`);
    try {
      const jwt = await firstValueFrom<LoginResponseDto>(
        this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, userId),
      );

      if (!jwt) {
        this.logger.warn(`No Google account linked for user: ${userId}. Tokens not found in Redis.`);
        throw new BadRequestException('No Google account linked');
      }

      return {
        accessToken: jwt.accessToken,
        refreshToken: jwt.refreshToken,
        userId,
      };
    } catch (error) {
      this.logger.error(`Error fetching Google tokens for user ${userId}.`, error.stack);
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token expired');
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid access token');
      }
      throw error; // Rethrow original error if it's not a JWT error
    }
  }

  async findGoogleEvents(accessToken: string) {
    this.logger.log(`Finding Google Calendar events for user...`);
    const jwt = await this.getGoogleTokens(accessToken);
    this.logger.debug(`Using tokens for user ${jwt?.userId} to fetch events.`);

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
    this.logger.log(`Creating Google Calendar event for user...`);
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
    this.logger.log(`Updating Google Calendar event ${eventId} for user...`);
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
    this.logger.log(`Deleting Google Calendar event ${eventId} for user...`);
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
