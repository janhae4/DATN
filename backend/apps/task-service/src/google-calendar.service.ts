import { Injectable, Logger } from '@nestjs/common';
import { calendar_v3, google } from 'googleapis';
import { Task } from './generated/prisma';

@Injectable()
export class GoogleCalendarService {
    private readonly logger = new Logger(GoogleCalendarService.name);

    private getCalendarClient(accessToken: string, refreshToken: string) {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URL,
        );

        oAuth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        return google.calendar({ version: 'v3', auth: oAuth2Client });
    }

    private toGoogleEvent(task: Task): calendar_v3.Schema$Event {
        return {
            summary: task.title,
            description: task.description || '',
            start: task.deadline
                ? {
                    dateTime: new Date(task.deadline).toISOString(),
                    timeZone: 'Asia/Ho_Chi_Minh',
                }
                : undefined,
            end: task.deadline
                ? {
                    dateTime: new Date(
                        new Date(task.deadline).getTime() + 60 * 60 * 1000,
                    ).toISOString(), // +1h default
                    timeZone: 'Asia/Ho_Chi_Minh',
                }
                : undefined,
        };
    }

    async createEvent(accessToken: string, refreshToken: string, task: Task) {
        const calendar = this.getCalendarClient(accessToken, refreshToken);
        const event = this.toGoogleEvent(task);

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
        });

        this.logger.log(`Event created: ${task.title}`);
        return response.data;
    }

    async updateEvent(
        accessToken: string,
        refreshToken: string,
        eventId: string,
        task: Task,
    ) {
        const calendar = this.getCalendarClient(accessToken, refreshToken);
        const event = this.toGoogleEvent(task);

        const response = await calendar.events.patch({
            calendarId: 'primary',
            eventId,
            requestBody: event,
        });

        this.logger.log(`Event updated: ${eventId}`);
        return response.data;
    }

    async deleteEvent(accessToken: string, refreshToken: string, eventId: string) {
        const calendar = this.getCalendarClient(accessToken, refreshToken);
        await calendar.events.delete({
            calendarId: 'primary',
            eventId,
        });
        this.logger.log(`Event deleted: ${eventId}`);
    }

    async findEvents(accessToken: string, refreshToken: string) {
        const calendar = this.getCalendarClient(accessToken, refreshToken);
        const response = await calendar.events.list({
            calendarId: 'primary',
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return response.data.items || [];
    }
}
