import { Inject, Injectable, Logger } from '@nestjs/common';
import { calendar_v3, google } from 'googleapis';
import { ClientProxy } from '@nestjs/microservices';
import { REDIS_CLIENT, REDIS_EXCHANGE, REDIS_PATTERN } from '@app/contracts';
import { Task } from '@app/contracts/task/entity/task.entity';
import { RmqClientService } from '@app/common';
@Injectable()
export class GoogleCalendarService {
  private readonly logger = new Logger(GoogleCalendarService.name);

  constructor(
    private readonly amqp: RmqClientService
  ) { }

  private async getCalendarClient(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URL,
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (
      !oAuth2Client.credentials.expiry_date ||
      Date.now() > oAuth2Client.credentials.expiry_date
    ) {
      const { credentials } = await oAuth2Client.refreshAccessToken();

      this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
        userId,
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token,
      });
    }

    return google.calendar({ version: 'v3', auth: oAuth2Client });
  }

  private toGoogleEvent(task: Task): calendar_v3.Schema$Event {
    return {
      summary: task.title,
      description: task.description || '',
      start: task.startDate
        ? {
          dateTime: new Date(task.startDate).toISOString(),
          timeZone: 'Asia/Ho_Chi_Minh',
        }
        : undefined,
      end: task.dueDate
        ? {
          dateTime: new Date(
            new Date(task.dueDate).getTime() + 60 * 60 * 1000,
          ).toISOString(),
          timeZone: 'Asia/Ho_Chi_Minh',
        }
        : undefined,
    };
  }

  async createEvent(
    userId: string,
    accessToken: string,
    refreshToken: string,
    task: Task,
  ) {
    const calendar = await this.getCalendarClient(
      userId,
      accessToken,
      refreshToken,
    );
    const event = this.toGoogleEvent(task);

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    this.logger.log(`Event created: ${task.title}`);
    return response.data;
  }

  async updateEvent(
    userId: string,
    accessToken: string,
    refreshToken: string,
    eventId: string,
    task: Task,
  ) {
    const calendar = await this.getCalendarClient(
      userId,
      accessToken,
      refreshToken,
    );
    const event = this.toGoogleEvent(task);

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });

    this.logger.log(`Event updated: ${eventId}`);
    return response.data;
  }

  async deleteEvent(
    userId: string,
    accessToken: string,
    refreshToken: string,
    eventId: string,
  ) {
    const calendar = await this.getCalendarClient(
      userId,
      accessToken,
      refreshToken,
    );
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    this.logger.log(`Event deleted: ${eventId}`);
  }

  async findEvents(userId: string, accessToken: string, refreshToken: string) {
    const calendar = await this.getCalendarClient(
      userId,
      accessToken,
      refreshToken,
    );
    const response = await calendar.events.list({
      calendarId: 'primary',
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.data.items || [];
  }
}
