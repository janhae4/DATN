import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NotificationEventDto,
  NotificationUpdateDto,
  AddMemberEventPayload,
  GMAIL_EXCHANGE,
  GMAIL_PATTERNS
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Notification } from './entity/notification.entity';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly amqp: AmqpConnection
  ) { }

  async handleTeamAddMember(payload: AddMemberEventPayload) {
    const { members, teamName, requesterName } = payload;
    for (const member of members) {
      if (member.email) {
        this.logger.log(`Sending team invitation email to ${member.email}`);
        try {
          await this.amqp.request({
            exchange: GMAIL_EXCHANGE,
            routingKey: GMAIL_PATTERNS.SEND_MAIL,
            payload: {
              to: member.email,
              subject: `You have been added to team ${teamName}`,
              content: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                  <h2>Team Invitation</h2>
                  <p>Hello <strong>${member.name}</strong>,</p>
                  <p><strong>${requesterName}</strong> has added you to the team <strong>${teamName}</strong>.</p>
                  <p>Login to the application to check it out.</p>
                </div>
              `,
            },
            timeout: 10000
          });
        } catch (error) {
          this.logger.error(`Failed to send email to ${member.email}`, error);
        }
      }

      // Also create notification in DB
      try {
        await this.addNotification({
          userId: member.id,
          title: "New Team Invitation",
          message: `${requesterName} added you to team ${teamName}`,
          type: 'INFO'
        } as any);
      } catch (e) {
        this.logger.error(`Failed to create notification for ${member.id}`, e);
      }
    }
  }

  async addNotification(notification: NotificationEventDto) {
    const newNotification = this.notificationRepository.create({
      userId: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type as any,
    });
    const notificationCreated = await this.notificationRepository.save(newNotification);
    this.logger.log(`Notification created: ${notificationCreated.id}`);
    return notificationCreated;
  }

  async updateNotification(
    where: { id: string },
    data: NotificationUpdateDto,
  ) {
    const notificationUpdated = await this.notificationRepository.update(where.id, data as any);
    this.logger.log(`Notification updated: ${where.id}`);
    return notificationUpdated;
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
    await this.notificationRepository.update({ userId }, {
      isRead: true,
    });
    this.logger.log(`All notifications marked as read: ${userId}`);
  }

  async markAllNotificationsAsUnread(userId: string) {
    await this.notificationRepository.update({ userId }, {
      isRead: false,
    });
    this.logger.log(`All notifications marked as unread: ${userId}`);
  }

  async getNotifications(userId: string) {
    this.logger.log(`Fetching notifications for user: ${userId}`);
    return await this.notificationRepository.find({
      where: {
        userId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }
}
