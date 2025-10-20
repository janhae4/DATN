import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { 
  NOTIFICATION_CLIENT,
    NOTIFICATION_PATTERN, 
    NotificationEventDto, 
    NotificationUpdateDto 
} from '@app/contracts';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_CLIENT) private readonly notificationClient: ClientProxy,
  ) {}

  createNotification(createDto: NotificationEventDto) {
    this.notificationClient.emit(NOTIFICATION_PATTERN.CREATE, createDto);
  }

  getNotifications(userId: string) {
    console.log(userId)
    return firstValueFrom(
        this.notificationClient.send(NOTIFICATION_PATTERN.FIND, userId )
    );
  }
  
  updateNotification(id: string, updateDto: NotificationUpdateDto) {
    return firstValueFrom(
        this.notificationClient.send(NOTIFICATION_PATTERN.UPDATE, { id, data: updateDto })
    );
  }
  
  deleteNotification(id: string) {
    this.notificationClient.emit(NOTIFICATION_PATTERN.DELETE, id );
  }

  markAsRead(id: string) {
    this.notificationClient.emit(NOTIFICATION_PATTERN.MARK_AS_READ, id );
  }
  
  markAsUnread(id: string) {
    this.notificationClient.emit(NOTIFICATION_PATTERN.MARK_AS_UNREAD, id );
  }
  
  markAllAsRead(userId: string) {
    this.notificationClient.emit(NOTIFICATION_PATTERN.MARK_ALL_AS_READ, { userId });
  }
}
