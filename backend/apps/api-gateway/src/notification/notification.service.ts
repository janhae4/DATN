import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  NOTIFICATION_CLIENT,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PATTERN,
  NotificationEventDto,
  NotificationUpdateDto,
} from '@app/contracts';
import { firstValueFrom } from 'rxjs';
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
    console.log(userId);
    const notifications = await this.amqp.request({
      exchange: NOTIFICATION_EXCHANGE,
      routingKey: NOTIFICATION_PATTERN.FIND,
      payload: userId
    })
    console.log(notifications);
    return notifications
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
