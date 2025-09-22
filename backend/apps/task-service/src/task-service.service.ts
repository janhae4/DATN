import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Task, TaskStatus } from '@app/prisma';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskServiceService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Task[]> {
    return this.prisma.task.findMany();
  }

  async findOne(id: number): Promise<Task | null> {
    return this.prisma.task.findUnique({
      where: { taskId: id },
    });
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
    return this.prisma.task.update({
      where: { taskId: id },
      data,
    });
  }

  async remove(id: number): Promise<Task> {
    return this.prisma.task.delete({
      where: { taskId: id },
    });
  }
}
