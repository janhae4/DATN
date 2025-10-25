import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import {
  NotificationEventDto,
  NotificationUpdateDto,
  NOTIFICATION_PATTERN,
  NOTIFICATION_EXCHANGE,
} from '@app/contracts';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }


  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.CREATE,
    queue: NOTIFICATION_PATTERN.CREATE
  })
  handleNotification(event: NotificationEventDto) {
    this.notificationService.addNotification(event);
  }

  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.UPDATE,
    queue: NOTIFICATION_PATTERN.UPDATE
  })
  handleUpdateNotification(
    id: string,
    data: NotificationUpdateDto,
  ) {
    this.notificationService.updateNotification({ id }, data);
  }

  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.DELETE,
    queue: NOTIFICATION_PATTERN.DELETE
  })
  handleDeleteNotification(id: string) {
    this.notificationService.deleteNotification({ id });
  }

  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.MARK_AS_READ,
    queue: NOTIFICATION_PATTERN.MARK_AS_READ
  })
  handleMarkNotificationAsRead(id: string) {
    this.notificationService.markNotificationAsRead({ id });
  }

  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.MARK_AS_UNREAD,
    queue: NOTIFICATION_PATTERN.MARK_AS_UNREAD
  })
  handleMarkNotificationAsUnread(id: string) {
    this.notificationService.markNotificationAsUnread({ id });
  }

  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.MARK_ALL_AS_READ,
    queue: NOTIFICATION_PATTERN.MARK_ALL_AS_READ
  })
  handleMarkAllNotificationsAsRead(userId: string) {
    this.notificationService.markAllNotificationsAsRead(userId);
  }

  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.MARK_ALL_AS_UNREAD,
    queue: NOTIFICATION_PATTERN.MARK_ALL_AS_UNREAD
  })
  handleMarkAllNotificationsAsUnread(userId: string) {
    this.notificationService.markAllNotificationsAsUnread(userId);
  }

  @RabbitRPC({
    exchange: NOTIFICATION_EXCHANGE,
    routingKey: NOTIFICATION_PATTERN.FIND,
    queue: NOTIFICATION_PATTERN.FIND
  })
  handleGetNotifications(userId: string) {
    return this.notificationService.getNotifications(userId);
  }
}
