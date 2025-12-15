import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { google, calendar_v3 } from 'googleapis';
import { AUTH_EXCHANGE, AUTH_PATTERN } from '@app/contracts';
import { CreateEventDto } from 'apps/api-gateway/src/calendar/dto/create-event.dto';
import { UpdateEventDto } from 'apps/api-gateway/src/calendar/dto/update-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    private readonly amqp: AmqpConnection, // Dùng cái này gọi Auth Service
  ) { }

  private async getCalendarClient(userId: string): Promise<calendar_v3.Calendar> {
    try {
      // Gọi Auth Service (RPC golevelup)
      const tokens = await this.amqp.request<any>({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.GET_GOOGLE_TOKEN,
        payload: userId,
      });

      if (!tokens || !tokens.accessToken) {
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
    
    const timeMin = filter.startTime 
      ? new Date(filter.startTime).toISOString() 
      : new Date().toISOString();
      
    const calendarId = filter.calendarId || 'primary';

    try {
      const params: any = {
        calendarId: calendarId,
        timeMin: timeMin,
        maxResults: 250, // Tăng lên xíu để lấy nhiều
        singleEvents: true,
        orderBy: 'startTime',
      };

      // Nếu có chọn ngày kết thúc thì thêm vào (Google API gọi là timeMax)
      if (filter.endTime) {
        params.timeMax = new Date(filter.endTime).toISOString();
      }

      const res = await calendar.events.list(params);
      
      return res.data.items?.map(event => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        link: event.htmlLink,
        // Trả thêm màu sắc nếu muốn Frontend hiển thị đẹp
        colorId: event.colorId 
      }));
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to fetch events');
    }
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

  async deleteEvent(userId: string, eventId: string) {
    const calendar = await this.getCalendarClient(userId);
    try {
      await calendar.events.delete({ calendarId: 'primary', eventId });
      return { success: true };
    } catch (error) {
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
    try {
      // Map DTO sang Google Event Resource
      const patchBody: any = {};
      if (dto.summary) patchBody.summary = dto.summary;
      if (dto.description) patchBody.description = dto.description;
      if (dto.startTime) patchBody.start = { dateTime: dto.startTime };
      if (dto.endTime) patchBody.end = { dateTime: dto.endTime };

      // Gọi API Patch (chỉ update những trường thay đổi)
      const res = await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: patchBody,
      });
      console.log("updated calendar: ", res.data);
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