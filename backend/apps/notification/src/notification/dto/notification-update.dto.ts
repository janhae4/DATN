import { NotificationType } from '../../generated/prisma';

export class NotificationUpdateDto {
  title: string;
  content: string;
  type: NotificationType;
}
