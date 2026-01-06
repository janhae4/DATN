// types/notification.interface.ts
import { NotificationType } from "../common/enums";

export interface Notification {
  id: string; // uuid
  userId: string; // uuid
  message: string;
  title: string;
  isRead: boolean;
  link?: string;
  type: NotificationType;
  createdAt: string; // timestamp
  readAt?: string; // timestamp
}