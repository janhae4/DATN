import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { TASK_ERRORS } from '@app/contracts/task/task.errors';
import { Task, TaskStatus } from './generated/prisma';
import { GoogleCalendarService } from './google-calendar.service';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { USER_CLIENT } from '@app/contracts/constants';
import { firstValueFrom } from 'rxjs';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { AccountDto } from '@app/contracts/user/account.dto';
import { BadRequestException, UnauthorizedException } from '@app/contracts/errror';

@Injectable()
export class TaskServiceService {
  constructor(private prisma: PrismaService,
    private googleService: GoogleCalendarService,
    private jwtService: JwtService,
    @Inject(USER_CLIENT) private userClient: ClientProxy
  ) { }

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
      const { id } = await this.jwtService.verifyAsync(accessToken);
      const account = await firstValueFrom<AccountDto>(
        this.userClient.send(USER_PATTERNS.FIND_ONE_GOOGLE, id)
      );
      if (!account) {
        throw new BadRequestException('No Google account linked');
      }
      return account;
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('Access token expired');
      }
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid access token');
      }
    }
  }

  async findGoogleEvents(accessToken: string, refreshToken: string) {
    const account = await this.getGoogleTokens(accessToken);
    return this.googleService.findEvents(account?.accessToken!, account?.refreshToken!);
  }

  async createGoogleEvent(accessToken: string, refreshToken: string, event: Task) {
    const account = await this.getGoogleTokens(accessToken);
    return this.googleService.createEvent(account?.accessToken!, account?.refreshToken!, event);
  }

  async updateGoogleEvent(accessToken: string, refreshToken: string, eventId: string, event: Task) {
    const account = await this.getGoogleTokens(accessToken);
    return this.googleService.updateEvent(account?.accessToken!, account?.refreshToken!, eventId, event);
  }

  async deleteGoogleEvent(accessToken: string, refreshToken: string, eventId: string) {
    const account = await this.getGoogleTokens(accessToken);
    return this.googleService.deleteEvent(account?.accessToken!, account?.refreshToken!, eventId);
  }
}
