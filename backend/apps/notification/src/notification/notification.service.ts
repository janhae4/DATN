import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma';
import { PrismaService } from './prisma.service';
import { NotificationEventDto, NotificationUpdateDto } from '@app/contracts';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(private readonly prisma: PrismaService) {}

  async addNotification(notification: NotificationEventDto) {
    const notificationCreated = await this.prisma.notification.create({
      data: {
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
      },
    });
    this.logger.log(`Notification created: ${notificationCreated.id}`);
    return notificationCreated;
  }

  async updateNotification(
    where: Prisma.NotificationWhereUniqueInput,
    data: NotificationUpdateDto,
  ) {
    const notificationUpdated = await this.prisma.notification.update({
      where,
      data,
    });
    this.logger.log(`Notification updated: ${where.id}`);
    return notificationUpdated;
  }

  async deleteNotification(where: Prisma.NotificationWhereUniqueInput) {
    await this.prisma.notification.delete({
      where,
    });
    this.logger.log(`Notification deleted: ${where.id}`);
  }

  async markNotificationAsRead(where: Prisma.NotificationWhereUniqueInput) {
    await this.prisma.notification.update({
      where,
      data: {
        isRead: true,
      },
    });
    this.logger.log(`Notification marked as read: ${where.id}`);
  }

  async markNotificationAsUnread(where: Prisma.NotificationWhereUniqueInput) {
    await this.prisma.notification.update({
      where,
      data: {
        isRead: false,
      },
    });
    this.logger.log(`Notification marked as unread: ${where.id}`);
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
    this.logger.log(`All notifications marked as read: ${userId}`);
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
    this.logger.log(`All notifications marked as unread: ${userId}`);
  }

  async getNotifications(userId: string) {
    this.logger.log(`Fetching notifications for user: ${userId}`);
    return await this.prisma.notification.findMany({
      where: {
        userId,
      },
    });
  }
}
