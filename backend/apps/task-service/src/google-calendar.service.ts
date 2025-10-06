import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';

@Injectable()
export class GoogleCalendarService {
    constructor() {
        
    }
    async createEvent(accessToken: string, refreshToken: string) {
        const oAuth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URL,
        );

        oAuth2Client.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

        return calendar.events.context;
        // const event = {
        //   summary: 'Test Event',
        //   description: 'This is a sample calendar event.',
        //   start: {
        //     dateTime: '2025-01-15T10:00:00',
        //     timeZone: 'Asia/Ho_Chi_Minh',
        //   },
        //   end: {
        //     dateTime: '2025-01-15T11:00:00',
        //     timeZone: 'Asia/Ho_Chi_Minh',
        //   },
        // };

        // const response = await calendar.events.insert({
        //   calendarId: 'primary',
        //   requestBody: event,
        // });

        // return response.data;
    }
}
