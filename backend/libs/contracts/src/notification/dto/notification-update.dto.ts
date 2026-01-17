import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationDto } from './notification-event.dto';

export class NotificationUpdateDto extends PartialType(CreateNotificationDto) {
  id: string;
}
