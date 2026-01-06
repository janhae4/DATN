import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { GetEventDto } from './dto/get-event.dto';
@Injectable()
export class CalendarService {
  constructor(
    @Inject('CALENDAR_SERVICE') private readonly calendarClient: ClientProxy,
  ) { }

async listEvents(userId: string, filter: GetEventDto) {
    return await firstValueFrom(
      this.calendarClient.send('calendar.listEvents', { userId, ...filter })
    );
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    return await firstValueFrom(
      this.calendarClient.send('calendar.createEvent', { userId, dto })
    );
  }

  async deleteEvent(userId: string, eventId: string) {
    return await firstValueFrom(
      this.calendarClient.send('calendar.deleteEvent', { userId, eventId })
    );
  }
  async getEvent(userId: string, eventId: string) {
    return await firstValueFrom(
      this.calendarClient.send('calendar.getEvent', { userId, eventId })
    );
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    return await firstValueFrom(
      this.calendarClient.send('calendar.updateEvent', { userId, eventId, dto })
    );
  }
async listCalendars(userId: string) {
    return await firstValueFrom(
      this.calendarClient.send('calendar.listCalendars', userId)
    );
  }
}