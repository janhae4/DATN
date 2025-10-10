import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { AUTH_CLIENT, REDIS_CLIENT } from '@app/contracts/constants';
import { NotFoundException } from '@app/contracts/errror';
import { loginNotificationSubject, loginNotificationTemplate, passwordChangeNotificationSubject, passwordChangeNotificationTemplate, registerNotificationSubject, registerNotificationTemplate, resetPasswordNotificationSubject, resetPasswordNotificationTemplate } from '@app/contracts/gmail/email-subject.constant';
import { EmailSystemType, SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { UserDto } from '@app/contracts/user/user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { use } from 'passport';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    private readonly gmailService: MailerService
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
      throw new NotFoundException('No Google account linked');
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

  async sendEmailSystem(payload: SendMailDto) {
    let { userId, subject, content, type } = payload;

    const user = await firstValueFrom(
      this.authClient.send(AUTH_PATTERN.INFO, userId),
    ) as UserDto;

    if (!user) {
      throw new NotFoundException('User not found');
    }
    payload.to = user.email;


    if (type === EmailSystemType.LOGIN) {
      subject = loginNotificationSubject; // nếu là hàm trả string
      content = loginNotificationTemplate(user.name, new Date().toString(), '1.2.3.4');
    }

    if (type === EmailSystemType.REGISTER) {
      subject = registerNotificationSubject;
      content = registerNotificationTemplate(user.name, "");
    }

    if (type === EmailSystemType.PASSWORD_CHANGE) {
      subject = passwordChangeNotificationSubject;
      content = passwordChangeNotificationTemplate(user.name, new Date().toString());
    }

    if (type === EmailSystemType.RESET_PASSWORD) {
      subject = resetPasswordNotificationSubject;
      content = resetPasswordNotificationTemplate(user.name);
    }

    return this.gmailService.sendMail({
      to: payload.to,
      subject,
      html: content,
    });
  }

}