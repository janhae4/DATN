import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateNotificationDto,
  NotificationUpdateDto,
} from '@app/contracts';
import { Notification } from './entity/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) { }

  // async handleTeamAddMember(payload: AddMemberEventPayload) {
  //   const { members, teamName, requesterName } = payload;
  //   return await this.notificationRepository.save(members.map((m) => ({
  //     userId: m.id,
  //     title: `You have been added to team ${teamName}`,
  //     message: `${requesterName} added you to team ${teamName}`,
  //     type: NotificationType.PENDING
  //   })))
  // }

  async addNotification(notification: CreateNotificationDto) {
    console.log("Notification: ", notification);
    const newNotification = this.notificationRepository.create({
      ...notification,
    });
    const notificationCreated = await this.notificationRepository.save(newNotification);
    console.log("New notification: ", notificationCreated);
    console.log(await this.notificationRepository.findOne({ where: { id: notificationCreated.id } }));
    this.logger.log(`Notification created: ${notificationCreated.id}`);
    return notificationCreated;
  }

  async updateNotification(where: { id: string }, data: NotificationUpdateDto) {
    console.log("Incoming Data:", data);
    const updatePayload: Partial<Notification> = {};
    if (data && data.type) {
      updatePayload.type = data.type;
    }
    if (Object.keys(updatePayload).length === 0) {
      this.logger.warn(`Nothing to update for ID: ${where.id}`);
      return;
    }
    return await this.notificationRepository.update(where.id, updatePayload);
  }

  async deleteNotification(where: { id: string }) {
    await this.notificationRepository.delete(where.id);
    this.logger.log(`Notification deleted: ${where.id}`);
  }

  async markNotificationAsRead(where: { id: string }) {
    await this.notificationRepository.update(where.id, {
      isRead: true,
    });
    this.logger.log(`Notification marked as read: ${where.id}`);
  }

  async markNotificationAsUnread(where: { id: string }) {
    await this.notificationRepository.update(where.id, {
      isRead: false,
    });
    this.logger.log(`Notification marked as unread: ${where.id}`);
  }

  async markAllNotificationsAsRead(userId: string) {
    await this.notificationRepository.update({ targetId: userId }, {
      isRead: true,
    });
    this.logger.log(`All notifications marked as read: ${userId}`);
  }

  async markAllNotificationsAsUnread(userId: string) {
    await this.notificationRepository.update({ targetId: userId }, {
      isRead: false,
    });
    this.logger.log(`All notifications marked as unread: ${userId}`);
  }

  async getNotifications(userId: string) {
    this.logger.log(`Fetching notifications for user: ${userId}`);
    try {
      const not = await this.notificationRepository.find({
        where: {
          targetId: userId
        },
        order: {
          createdAt: 'DESC',
        },
      });
      return not;
    } catch (e) {
      console.log(e);
    }
  }
}
