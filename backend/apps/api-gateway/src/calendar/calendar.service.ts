import { Injectable } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import {
  CALENDAR_PATTERN,
  CALENDAR_EXCHANGE,
} from '@app/contracts';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventDto } from './dto/get-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    private readonly rmqClient: RmqClientService,
  ) { }

  async listEvents(userId: string, filter: GetEventDto) {
    return this.rmqClient.request({
      exchange: CALENDAR_EXCHANGE,
      routingKey: CALENDAR_PATTERN.GET_EVENTS,
      payload: { userId, ...filter },
    });
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    return this.rmqClient.request({
      exchange: CALENDAR_EXCHANGE,
      routingKey: CALENDAR_PATTERN.CREATE_EVENT,
      payload: { userId, dto },
    });
  }

  async deleteEvent(userId: string, eventId: string) {
    return this.rmqClient.request({
      exchange: CALENDAR_EXCHANGE,
      routingKey: CALENDAR_PATTERN.DELETE_EVENT,
      payload: { userId, eventId },
    });
  }

  async getEvent(userId: string, eventId: string) {
    return this.rmqClient.request({
      exchange: CALENDAR_EXCHANGE,
      routingKey: CALENDAR_PATTERN.GET_EVENT_BY_ID,
      payload: { userId, eventId },
    });
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    return this.rmqClient.request({
      exchange: CALENDAR_EXCHANGE,
      routingKey: CALENDAR_PATTERN.UPDATE_EVENT,
      payload: { userId, eventId, dto },
    });
  }

  async listCalendars(userId: string) {
    return this.rmqClient.request({
      exchange: CALENDAR_EXCHANGE,
      routingKey: CALENDAR_PATTERN.GET_CALENDARS,
      payload: userId, 
    });
  }
}