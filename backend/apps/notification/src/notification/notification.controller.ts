import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import * as contracts from '@app/contracts';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
@Controller('notification')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) { }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.CREATE,
    queue: contracts.NOTIFICATION_PATTERN.CREATE
  })
  handleNotification(event: contracts.CreateNotificationDto) {
    this.notificationService.addNotification(event);
  }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.UPDATE,
    queue: contracts.NOTIFICATION_PATTERN.UPDATE
  })
  handleUpdateNotification(
    payload: { notificationId: string; data: contracts.NotificationUpdateDto },
  ) {
    this.notificationService.updateNotification({ id: payload.notificationId }, payload.data);
  }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.DELETE,
    queue: contracts.NOTIFICATION_PATTERN.DELETE
  })
  handleDeleteNotification(id: string) {
    this.notificationService.deleteNotification({ id });
  }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.MARK_AS_READ,
    queue: contracts.NOTIFICATION_PATTERN.MARK_AS_READ
  })
  handleMarkNotificationAsRead(id: string) {
    this.notificationService.markNotificationAsRead({ id });
  }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.MARK_AS_UNREAD,
    queue: contracts.NOTIFICATION_PATTERN.MARK_AS_UNREAD
  })
  handleMarkNotificationAsUnread(id: string) {
    this.notificationService.markNotificationAsUnread({ id });
  }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.MARK_ALL_AS_READ,
    queue: contracts.NOTIFICATION_PATTERN.MARK_ALL_AS_READ
  })
  handleMarkAllNotificationsAsRead(userId: string) {
    this.notificationService.markAllNotificationsAsRead(userId);
  }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.MARK_ALL_AS_UNREAD,
    queue: contracts.NOTIFICATION_PATTERN.MARK_ALL_AS_UNREAD
  })
  handleMarkAllNotificationsAsUnread(userId: string) {
    this.notificationService.markAllNotificationsAsUnread(userId);
  }

  @RabbitRPC({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: contracts.NOTIFICATION_PATTERN.FIND,
    queue: contracts.NOTIFICATION_PATTERN.FIND
  })
  handleGetNotifications(userId: string) {
    return this.notificationService.getNotifications(userId);
  }



  @RabbitRPC({
    exchange: contracts.EVENTS_EXCHANGE,
    routingKey: contracts.EVENTS.NEW_MESSAGE,
    queue: 'notification_new_message_queue',
  })
  async handleNewMessage(payload: contracts.SendMessageEventPayload) {
    const { messageSnapshot, membersToNotify, discussionId } = payload;

    for (const userId of membersToNotify || []) {
        const notificationDto = {
            title: messageSnapshot.sender.name, 
            message: messageSnapshot.content,   
            targetId: userId,                   
            actorId: messageSnapshot.sender._id,
            targetType: contracts.NotificationTargetType.USER,
            type: contracts.NotificationType.INFO,
            resourceId: discussionId,
            resourceType: contracts.NotificationResource.DISCUSSION
        };
        await this.notificationService.addNotification(notificationDto);
    }
  }

  @RabbitSubscribe({
    exchange: contracts.EVENTS_EXCHANGE,
    routingKey: contracts.EVENTS.NEW_MESSAGE,
    queue: 'notification_dispatcher_queue',
  })
  async handleNewMessageDispatch(payload: contracts.SendMessageEventPayload) {
    const { membersToNotify, messageSnapshot, discussionId, teamSnapshot } = payload;
    const teamId = teamSnapshot?.id;
    
    if (!membersToNotify || membersToNotify.length === 0) return;
    
    await this.notificationService.processBatchWithChunking(membersToNotify, messageSnapshot, discussionId, teamId);
  }

  @RabbitSubscribe({
    exchange: contracts.NOTIFICATION_EXCHANGE,
    routingKey: 'notification.send_batch',
    queue: 'notification_worker_queue',
    queueOptions: {
        durable: true,
        arguments: { 'x-max-priority': 10 }
    }
  })
  async handleBatchNotification(payload: { userIds: string[], messageSnapshot: contracts.MessageSnapshot, discussionId: string, teamId?: string }) {
    await this.notificationService.processBatch(payload.userIds, payload.messageSnapshot, payload.discussionId, payload.teamId);
  }

}
