import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { TASK_ERRORS } from '@app/contracts/task/task.errors';
import { Task, TaskStatus } from './generated/prisma';
import { GoogleCalendarService } from './google-calendar.service';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { REDIS_CLIENT } from '@app/contracts/constants';
import { firstValueFrom } from 'rxjs';
import {
  BadRequestException,
  UnauthorizedException,
} from '@app/contracts/errror';
import { JwtDto } from '@app/contracts/auth/jwt.dto';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';

@Injectable()
export class TaskServiceService {
  constructor(
    private prisma: PrismaService,
    private googleService: GoogleCalendarService,
    private jwtService: JwtService,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  async findAll(): Promise<Task[]> {
    return await this.prisma.task.findMany();
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!task) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND());
    }
    return task;
  }

  async create(data: {
    title: string;
    description?: string;
    deadline?: Date;
    priority?: number;
    status?: TaskStatus;
  }): Promise<Task> {
    return this.prisma.task.create({
      data,
    });
  }

  async update(id: string, data: UpdateTaskDto): Promise<Task> {
    const existing = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!existing) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND());
    }
    return this.prisma.task.update({
      where: { taskId: id },
      data,
    });
  }

  async remove(id: string): Promise<Task> {
    const existing = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!existing) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND());
    }
    return this.prisma.task.delete({
      where: { taskId: id },
    });
  }

  private async getGoogleTokens(accessToken: string) {
    try {
      const jwtPayload = await this.jwtService.verifyAsync<JwtDto>(accessToken);

      const jwt = await firstValueFrom<LoginResponseDto>(
        this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, jwtPayload.id),
      );

      if (!jwt) {
        throw new BadRequestException('No Google account linked');
      }

      return {
        accessToken: jwt.accessToken,
        refreshToken: jwt.refreshToken,
        userId: jwtPayload.id,
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
