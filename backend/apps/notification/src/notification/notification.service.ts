import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateNotificationDto,
  NotificationUpdateDto,
  REDIS_EXCHANGE,
  REDIS_PATTERN,
  NOTIFICATION_EXCHANGE,
  MessageSnapshot,
} from '@app/contracts';
import { Notification } from './entity/notification.entity';
import { RmqClientService } from '@app/common';
import * as webpush from 'web-push';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly amqpConnection: RmqClientService,
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
    const not = await this.notificationRepository.find({
      where: {
        targetId: userId
      },
      order: {
        createdAt: 'DESC',
      },
    });
    return not;
  }

  async processBatchWithChunking(membersToNotify: string[], messageSnapshot: any, discussionId: string, teamId?: string) {
    const BATCH_SIZE = 500;
    const batches = this.chunkArray(membersToNotify, BATCH_SIZE);

    for (const batchIds of batches) {
      await this.amqpConnection.publish(NOTIFICATION_EXCHANGE, 'notification.send_batch', {
        userIds: batchIds,
        messageSnapshot,
        discussionId,
        teamId
      });
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  async processBatch(userIds: string[], messageSnapshot: MessageSnapshot, discussionId: string, teamId?: string) {
    if (!userIds.length) return;

    const onlineUsersArray = await this.amqpConnection.request<string[]>({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.GET_MANY_ONLINE_STATUS,
      payload: { userIds },
    });

    const onlineUsersSet = new Set(onlineUsersArray);

    const offlineUsers = userIds.filter((id) => !onlineUsersSet.has(id));

    if (offlineUsers.length === 0) return;

    const tokensObject = await this.amqpConnection.request<Record<string, string>>({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.GET_MANY_PUSH_TOKENS,
      payload: { userIds: offlineUsers },
    });

    const notifications = offlineUsers.map(async (userId) => {
      const tokenString = tokensObject[userId];

      if (!tokenString) return;

      try {
        const pushSubscription = JSON.parse(tokenString);

        const payload = JSON.stringify({
          title: messageSnapshot.sender.name,
          msg: messageSnapshot.content,
          icon: messageSnapshot.sender.avatar || '',
          data: {
            url: `${process.env.FRONTEND_URL || 'http://localhost:5000'}/${teamId || ''}/chat/${discussionId}`,
          }
        });

        await webpush.sendNotification(pushSubscription, payload);

      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          this.logger.warn(`Token expired for user ${userId}`);
        } else {
          this.logger.error(`Push failed for ${userId}: ${err.message}`);
        }
      }
    });

    // 4. Bắn song song (Parallel)
    await Promise.all(notifications);

    this.logger.log(`Processed batch: Sent ${notifications.length} pushes to offline users.`);
  }
}
