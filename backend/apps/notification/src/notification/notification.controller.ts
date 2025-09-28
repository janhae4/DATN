import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationEvent } from './dto/notification.event';
import { NotificationUpdateDto } from './dto/notification-update.dto';
import { NOTIFICATION_PATTERN } from '@app/contracts/notification/notification.pattern';

@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern(NOTIFICATION_PATTERN.SEND)
  handleSendNotification(@Payload() event: NotificationEvent) {
    this.notificationService.sendNotification(event);
  }

  @EventPattern(NOTIFICATION_PATTERN.CREATE)
  handleNotification(@Payload() event: NotificationEvent) {
    this.notificationService.addNotification(event);
  }

  @EventPattern(NOTIFICATION_PATTERN.UPDATE)
  handleUpdateNotification(
    @Payload() id: string,
    @Payload() data: NotificationUpdateDto,
  ) {
    this.notificationService.updateNotification({ id }, data);
  }

  @EventPattern(NOTIFICATION_PATTERN.DELETE)
  handleDeleteNotification(@Payload() id: string) {
    this.notificationService.deleteNotification({ id });
  }

  @EventPattern(NOTIFICATION_PATTERN.MARK_AS_READ)
  handleMarkNotificationAsRead(@Payload() id: string) {
    this.notificationService.markNotificationAsRead({ id });
  }

  @EventPattern(NOTIFICATION_PATTERN.MARK_AS_UNREAD)
  handleMarkNotificationAsUnread(@Payload() id: string) {
    this.notificationService.markNotificationAsUnread({ id });
  }

  @EventPattern(NOTIFICATION_PATTERN.MARK_ALL_AS_READ)
  handleMarkAllNotificationsAsRead(userId: string) {
    this.notificationService.markAllNotificationsAsRead(userId);
  }

  @EventPattern(NOTIFICATION_PATTERN.MARK_ALL_AS_UNREAD)
  handleMarkAllNotificationsAsUnread(userId: string) {
    this.notificationService.markAllNotificationsAsUnread(userId);
  }

  @EventPattern(NOTIFICATION_PATTERN.FIND)
  handleGetNotifications(userId: string) {
    return this.notificationService.getNotifications(userId);
  }
}
