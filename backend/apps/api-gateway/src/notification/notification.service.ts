import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PATTERN,
  NotificationEventDto,
  NotificationUpdateDto,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class NotificationService {
  constructor(
    private readonly amqp: AmqpConnection,
  ) { }

  createNotification(createDto: NotificationEventDto) {
    this.amqp.publish(NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN.CREATE, createDto);
  }

  async getNotifications(userId: string) {
      return await this.amqp.request<Notification[]>({
      exchange: NOTIFICATION_EXCHANGE,
      routingKey: NOTIFICATION_PATTERN.FIND,
      payload: userId
    })
  }

  async updateNotification(id: string, updateDto: NotificationUpdateDto) {
    return await this.amqp.request<Notification>({
      exchange: NOTIFICATION_EXCHANGE,
      routingKey: NOTIFICATION_PATTERN.UPDATE,
      payload: {
        ...updateDto,
        id,
      },
    })
  }

  deleteNotification(id: string) {
    this.amqp.publish(NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN.DELETE, id);
  }

  markAsRead(id: string) {
    this.amqp.publish(NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN.MARK_AS_READ, id);
  }

  markAsUnread(id: string) {
    this.amqp.publish(NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN.MARK_AS_UNREAD, id);
  }

  markAllAsRead(userId: string) {
    this.amqp.publish(NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN.MARK_ALL_AS_READ, {
      userId,
    });
  }
}
