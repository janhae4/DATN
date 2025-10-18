import { NotificationType } from '../notification.enum';

export class NotificationEventDto {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
}
