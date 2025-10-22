import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  NotificationEventDto,
  NotificationUpdateDto,
  NOTIFICATION_PATTERN,
} from '@app/contracts';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(NOTIFICATION_PATTERN.CREATE)
  handleCreateNotification(@Payload() event: NotificationEventDto) {
    this.notificationService.addNotification(event);
  }

  @MessagePattern(NOTIFICATION_PATTERN.CREATE)
  handleNotification(@Payload() event: NotificationEventDto) {
    this.notificationService.addNotification(event);
  }

  @MessagePattern(NOTIFICATION_PATTERN.UPDATE)
  handleUpdateNotification(
    @Payload() id: string,
    @Payload() data: NotificationUpdateDto,
  ) {
    this.notificationService.updateNotification({ id }, data);
  }

  @MessagePattern(NOTIFICATION_PATTERN.DELETE)
  handleDeleteNotification(@Payload() id: string) {
    this.notificationService.deleteNotification({ id });
  }

  @MessagePattern(NOTIFICATION_PATTERN.MARK_AS_READ)
  handleMarkNotificationAsRead(@Payload() id: string) {
    this.notificationService.markNotificationAsRead({ id });
  }

  @MessagePattern(NOTIFICATION_PATTERN.MARK_AS_UNREAD)
  handleMarkNotificationAsUnread(@Payload() id: string) {
    this.notificationService.markNotificationAsUnread({ id });
  }

  @MessagePattern(NOTIFICATION_PATTERN.MARK_ALL_AS_READ)
  handleMarkAllNotificationsAsRead(userId: string) {
    this.notificationService.markAllNotificationsAsRead(userId);
  }

  @MessagePattern(NOTIFICATION_PATTERN.MARK_ALL_AS_UNREAD)
  handleMarkAllNotificationsAsUnread(userId: string) {
    this.notificationService.markAllNotificationsAsUnread(userId);
  }

  @MessagePattern(NOTIFICATION_PATTERN.FIND)
  handleGetNotifications(userId: string) {
    return this.notificationService.getNotifications(userId);
  }
}
