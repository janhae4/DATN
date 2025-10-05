import { NotificationType } from '@app/contracts/notification/notification.enum';

export class NotificationEvent {
  constructor(
    public readonly userId: string,
    public readonly title: string,
    public readonly message: string,
    public readonly type: NotificationType,
  ) {}
}
