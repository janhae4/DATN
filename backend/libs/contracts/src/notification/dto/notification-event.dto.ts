import { NotificationType } from "@app/contracts/enums/notification-type.enum";

export class NotificationEventDto {
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
}
