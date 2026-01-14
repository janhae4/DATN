import { Controller } from '@nestjs/common';
import { CalendarService } from './calendar-service.service';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { CALENDAR_EXCHANGE, CALENDAR_PATTERN } from '@app/contracts';
import { customErrorHandler } from '@app/common';

@Controller()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) { }

  @RabbitRPC({
    exchange: CALENDAR_EXCHANGE,
    routingKey: CALENDAR_PATTERN.GET_EVENTS,
    queue: CALENDAR_PATTERN.GET_EVENTS,
    errorHandler: customErrorHandler
  })
  listEvents(data: {
    userId: string;
    startTime?: string;
    endTime?: string;
    calendarId?: string
  }) {
    return this.calendarService.listEvents(data.userId, data);
  }

  @RabbitRPC({
    exchange: CALENDAR_EXCHANGE,
    routingKey: CALENDAR_PATTERN.CREATE_EVENT,
    queue: CALENDAR_PATTERN.CREATE_EVENT,
    errorHandler: customErrorHandler
  })
  createEvent(data: {
    userId: string;
    summary: string;
    description: string;
    startTime: string;
    endTime: string;
  }) {
    return this.calendarService.createEvent(data.userId, {
      summary: data.summary,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime
    });
  }

  @RabbitRPC({
    exchange: CALENDAR_EXCHANGE,
    routingKey: CALENDAR_PATTERN.DELETE_EVENT,
    queue: CALENDAR_PATTERN.DELETE_EVENT,
    errorHandler: customErrorHandler
  })
  deleteEvent(data: { userId: string; eventId: string }) {
    return this.calendarService.deleteEvent(data.userId, data.eventId);
  }

  @RabbitRPC({
    exchange: CALENDAR_EXCHANGE,
    routingKey: CALENDAR_PATTERN.GET_EVENT_BY_ID,
    queue: CALENDAR_PATTERN.GET_EVENT_BY_ID,
    errorHandler: customErrorHandler
  })
  getEvent(data: { userId: string; eventId: string }) {
    return this.calendarService.getEvent(data.userId, data.eventId);
  }

  @RabbitRPC({
    exchange: CALENDAR_EXCHANGE,
    routingKey: CALENDAR_PATTERN.UPDATE_EVENT,
    queue: CALENDAR_PATTERN.UPDATE_EVENT,
    errorHandler: customErrorHandler
  })
  updateEvent(data: {
    userId: string;
    eventId: string;
    summary: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    calendarId?: string
  }) {
    return this.calendarService.updateEvent(data.userId, data.eventId, {
      summary: data.summary,
      description: data.description,
      startTime: data.startTime,
      endTime: data.endTime
    });
  }

  @RabbitRPC({
    exchange: CALENDAR_EXCHANGE,
    routingKey: CALENDAR_PATTERN.GET_CALENDARS,
    queue: CALENDAR_PATTERN.GET_CALENDARS,
    errorHandler: customErrorHandler
  })
  listCalendars(userId: string) {
    return this.calendarService.listCalendars(userId);
  }
}