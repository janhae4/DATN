import { REDIS_CLIENT } from '@app/contracts/constants';
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { google } from 'googleapis';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GmailService {
  private oauth2Client;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );
  }

  private async getGoogleTokens(userId: string) {
    const tokens = await firstValueFrom(
      this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, { userId }),
    );
    if (!tokens || !tokens.accessToken) {
      throw new HttpException('Không tìm thấy Google token cho người dùng.', HttpStatus.NOT_FOUND);
    }
    return tokens;
  }

  async getUnreadEmails(userId: string) {
    console.log("userId trong getUnreadEmails: ", userId);
    const tokens = await this.getGoogleTokens(userId);
    this.oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const response = await gmail.users.messages.list({ userId: 'me', q: 'is:unread' });
    console.log("response", response.data.messages || []);
    return response.data.messages || [];
  }


  async sendEmail(payload: SendMailDto) {
    const { userId, to, subject, messageText } = payload;
    const tokens = await this.getGoogleTokens(userId);
    this.oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const emailContent = [
      `To: ${to}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      '',
      messageText,
    ].join('\n');
    const encodedMessage = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });
    return { message: 'Email đã được gửi thành công!' };
  }
}