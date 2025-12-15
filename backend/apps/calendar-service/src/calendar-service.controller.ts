import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CalendarService } from './calendar-service.service';
import { CreateEventDto } from 'apps/api-gateway/src/calendar/dto/create-event.dto';
import { UpdateEventDto } from 'apps/api-gateway/src/calendar/dto/update-event.dto';


@Controller()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) { }

@MessagePattern('calendar.listEvents') 
  async listEvents(@Payload() data: { userId: string; startTime?: string; endTime?: string; calendarId?: string }) {
    return this.calendarService.listEvents(data.userId, data);
  }
  @MessagePattern('calendar.createEvent')
  async createEvent(@Payload() data: { userId: string; dto: CreateEventDto }) {
    return this.calendarService.createEvent(data.userId, data.dto);
  }

  @MessagePattern('calendar.deleteEvent')
  async deleteEvent(@Payload() data: { userId: string; eventId: string }) {
    return this.calendarService.deleteEvent(data.userId, data.eventId);
  }

  @MessagePattern('calendar.getEvent')
  async getEvent(@Payload() data: { userId: string; eventId: string }) {
    return this.calendarService.getEvent(data.userId, data.eventId);
  }

  @MessagePattern('calendar.updateEvent')
  async updateEvent(@Payload() data: { userId: string; eventId: string; dto: UpdateEventDto }) {
    return this.calendarService.updateEvent(data.userId, data.eventId, data.dto);
  }

  @MessagePattern('calendar.listCalendars')
  async listCalendars(@Payload() userId: string) {
    return this.calendarService.listCalendars(userId);
  }
}