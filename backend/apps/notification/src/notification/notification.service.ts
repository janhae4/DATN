import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Prisma } from '../generated/prisma';
import { PrismaService } from './prisma.service';
import { NotificationEvent } from './dto/notification.event';
import { NotificationUpdateDto } from './dto/notification-update.dto';

@Injectable()
export class NotificationService {
  private server: Server;

  constructor(private readonly prisma: PrismaService) {}

  setServer(server: Server) {
    this.server = server;
  }

  subscribeUser(userId: string, client: Socket) {
    client.join(userId);
  }

  async sendNotification(event: NotificationEvent) {
    if (!this.server) return;
    await this.addNotification(event);
    this.server.to(event.userId).emit('notification', {
      title: event.title,
      message: event.message,
      type: event.type,
    });
  }

  async addNotification(notification: NotificationEvent) {
    await this.prisma.notification.create({
      data: {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
      },
    });
  }

  async updateNotification(
    where: Prisma.NotificationWhereUniqueInput,
    data: NotificationUpdateDto,
  ) {
    await this.prisma.notification.update({
      where,
      data,
    });
  }

  async deleteNotification(where: Prisma.NotificationWhereUniqueInput) {
    await this.prisma.notification.delete({
      where,
    });
  }

  async markNotificationAsRead(where: Prisma.NotificationWhereUniqueInput) {
    await this.prisma.notification.update({
      where,
      data: {
        isRead: true,
      },
    });
  }

  async markNotificationAsUnread(where: Prisma.NotificationWhereUniqueInput) {
    await this.prisma.notification.update({
      where,
      data: {
        isRead: false,
      },
    });
  }

  async markAllNotificationsAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllNotificationsAsUnread(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
      },
      data: {
        isRead: false,
      },
    });
  }

  async getNotifications(userId: string) {
    return await this.prisma.notification.findMany({
      where: {
        userId,
      },
    });
  }
}
