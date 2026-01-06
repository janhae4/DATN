import { PartialType } from '@nestjs/mapped-types';
import { NotificationEventDto } from './notification-event.dto';

export class NotificationUpdateDto extends PartialType(NotificationEventDto) {
  id: string;
}
