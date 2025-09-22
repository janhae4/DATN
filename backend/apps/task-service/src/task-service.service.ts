import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Task, TaskStatus } from '@app/prisma';
import { UpdateTaskDto } from './dto/update-task.dto';
import { RpcException } from '@nestjs/microservices';
import { TASK_ERRORS } from '@app/contracts/task/task.errors';

@Injectable()
export class TaskServiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Task[]> {
    return this.prisma.task.findMany();
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({
      where: { taskId: id },
    });
    if (!task) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND(id));
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

  async update(id: number, data: UpdateTaskDto): Promise<Task> {
    const existing = await this.prisma.task.findUnique({ where: { taskId: id } });
    if (!existing) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND(id));
    }
    return this.prisma.task.update({
      where: { taskId: id },
      data,
    });
  }

  async remove(id: number): Promise<Task> {
    const existing = await this.prisma.task.findUnique({ where: { taskId: id } });
    if (!existing) {
      throw new RpcException(TASK_ERRORS.NOT_FOUND(id));
    }
    return this.prisma.task.delete({
      where: { taskId: id },
    });
  }
}
