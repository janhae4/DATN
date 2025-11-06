import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from '@contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { ClientProxy } from '@nestjs/microservices';
import { NotificationPatterns } from '@contracts/notification';

@Injectable()
export class TasksService implements OnModuleInit {
  constructor(
    private prisma: PrismaService,
    @Inject('NOTIFICATION_SERVICE_CLIENT')
    private notificationClient: ClientProxy,
  ) {}

  async onModuleInit() {
    await this.notificationClient.connect();
  }

  async create(createTaskDto: CreateTaskDto, userId: string) {
    const { labelIds, ...rest } = createTaskDto;

    const task = await this.prisma.task.create({
      data: {
        ...rest,
        labels: labelIds
          ? {
              connect: labelIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: { labels: true }, // Return task with labels
    });

    // Send notification if task is assigned
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      this.notificationClient.emit(NotificationPatterns.taskAssigned, {
        taskId: task.id,
        taskTitle: task.title,
        assigneeIds: task.assigneeIds,
        assignedById: userId,
      });
    }

    return task;
  }

  findAllByProject(projectId: string) {
    return this.prisma.task.findMany({
      where: { projectId },
      include: {
        labels: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(taskId: string) {
    return this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        labels: true,
      },
    });
  }

  async update(taskId: string, updateTaskDto: UpdateTaskDto, userId: string) {
    const { labelIds, ...rest } = updateTaskDto;

    const oldTask = await this.prisma.task.findUnique({
      where: { id: taskId },
      select: { assigneeIds: true },
    });

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...rest,
        labels: labelIds
          ? {
              set: labelIds.map((id) => ({ id })),
            }
          : undefined,
      },
      include: { labels: true },
    });

    const newAssignees = updatedTask.assigneeIds.filter(
      (id) => !oldTask.assigneeIds.includes(id),
    );

    if (newAssignees.length > 0) {
      this.notificationClient.emit(NotificationPatterns.taskAssigned, {
        taskId: updatedTask.id,
        taskTitle: updatedTask.title,
        assigneeIds: newAssignees,
        assignedById: userId,
      });
    }

    return updatedTask;
  }

  remove(taskId: string) {
    return this.prisma.task.delete({
      where: { id: taskId },
    });
  }
