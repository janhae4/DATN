import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { google, calendar_v3 } from 'googleapis';
import { AUTH_EXCHANGE, AUTH_PATTERN } from '@app/contracts';
import { CreateEventDto } from 'apps/api-gateway/src/calendar/dto/create-event.dto';
import { UpdateEventDto } from 'apps/api-gateway/src/calendar/dto/update-event.dto';
import { RmqClientService } from '@app/common';

@Injectable()
export class CalendarService {
  constructor(
    private readonly amqp: RmqClientService,
  ) { }

  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
    try {
      const tokens = await this.amqp.request<any>({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.GET_GOOGLE_TOKEN,
        payload: userId,
      });

      if (!tokens || (!tokens.accessToken && !tokens.refreshToken)) {
        throw new UnauthorizedException('User has not linked Google Calendar');
      }

      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );

      oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      });

      return google.calendar({ version: 'v3', auth: oauth2Client });
    } catch (error) {
      console.error('Calendar Auth Error:', error);
      throw new UnauthorizedException('Failed to connect to Google Calendar');
    }
  }

  async listEvents(userId: string, filter: { startTime?: string; endTime?: string; calendarId?: string }) {
    const calendar = await this.getCalendarClient(userId);

    const params: any = {
      timeMin: filter.startTime ? new Date(filter.startTime).toISOString() : new Date().toISOString(),
      timeMax: filter.endTime ? new Date(filter.endTime).toISOString() : undefined,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 250,
    };

    try {
      // CASE 1: Lấy 1 lịch cụ thể
      if (filter.calendarId) {
        const res = await calendar.events.list({
          ...params,
          calendarId: filter.calendarId,
        });
        return this.mapEvents(res.data.items || [], filter.calendarId);
      }

      // CASE 2: Lấy tất cả
      const calendarListRes = await calendar.calendarList.list({ minAccessRole: 'reader' });
      const calendars = calendarListRes.data.items || [];

      const allEventsPromises = calendars.map(async (cal) => {
        // --- FIX Ở ĐÂY: Check xem có ID không rồi mới làm tiếp ---
        if (!cal.id) return [];

        try {
          const res = await calendar.events.list({
            ...params,
            calendarId: cal.id, // Bây giờ TypeScript biết cal.id là string chắc chắn
          });

          // cal.backgroundColor có thể null/undefined, nhưng tham số defaultColor là optional (?) nên ok
          return this.mapEvents(
            res.data.items || [],
            cal.id,
            cal.backgroundColor || undefined // Convert null sang undefined cho chắc
          );
        } catch (err) {
          console.warn(`Skipping calendar ${cal.summary}: ${err.message}`);
          return [];
        }
      });

      const results = await Promise.all(allEventsPromises);
      return results.flat();

    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch events');
    }
  }

  private mapEvents(items: calendar_v3.Schema$Event[], calendarId: string, defaultColor?: string) {
    return items.map(event => ({
      id: event.id,
      title: event.summary || '(No Title)',
      description: event.description,
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      link: event.htmlLink,
      calendarId: calendarId,
      colorId: event.colorId || defaultColor || '#3b82f6'
    }));
  }

  async createEvent(userId: string, dto: CreateEventDto) {
    const calendar = await this.getCalendarClient(userId);
    const calendarId = dto.calendarId || 'primary';
    try {
      const res = await calendar.events.insert({
        calendarId: calendarId,
        requestBody: {
          summary: dto.summary,
          description: dto.description,
          start: { dateTime: dto.startTime },
          end: { dateTime: dto.endTime },
        },
      });
      return res.data;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to create event');
    }
  }

  async deleteEvent(userId: string, eventId: string, calendarId: string = 'primary') {
    const calendar = await this.getCalendarClient(userId);
    try {
      await calendar.events.delete({
        calendarId: calendarId, // <--- QUAN TRỌNG: Dùng ID động
        eventId
      });
      return { success: true };
    } catch (error) {
      // Log lỗi rõ ràng hơn để debug
      console.error(`Failed to delete event ${eventId} on calendar ${calendarId}:`, error);
      throw new InternalServerErrorException('Failed to delete event');
    }
  }

  async getEvent(userId: string, eventId: string) {
    const calendar = await this.getCalendarClient(userId);
    try {
      const res = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });
      return res.data;
    } catch (error) {
      throw new InternalServerErrorException('Event not found or failed to fetch');
    }
  }

  async updateEvent(userId: string, eventId: string, dto: UpdateEventDto) {
    const calendar = await this.getCalendarClient(userId);
    const calendarId = dto.calendarId || 'primary';

    try {
      const patchBody: any = {};
      if (dto.summary) patchBody.summary = dto.summary;
      if (dto.description) patchBody.description = dto.description;
      if (dto.startTime) patchBody.start = { dateTime: dto.startTime };
      if (dto.endTime) patchBody.end = { dateTime: dto.endTime };

      const res = await calendar.events.patch({
        calendarId: calendarId,
        eventId: eventId,
        requestBody: patchBody,
      });
      return res.data;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to update event');
    }
  }

  async listCalendars(userId: string) {
    const calendar = await this.getCalendarClient(userId);
    try {
      const res = await calendar.calendarList.list();

      // Map data cho gọn
      return res.data.items?.map(cal => ({
        id: cal.id,
        summary: cal.summary,
        description: cal.description,
        backgroundColor: cal.backgroundColor,
        primary: cal.primary || false,
      }));
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch calendar list');
    }
  }
}