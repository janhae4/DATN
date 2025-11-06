import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { AUTH_CLIENT, REDIS_CLIENT } from '@app/contracts/constants';
import { NotFoundException } from '@app/contracts/errror';
import {
  loginNotificationSubject,
  loginNotificationTemplate,
  passwordChangeNotificationSubject,
  passwordChangeNotificationTemplate,
  registerNotificationSubject,
  registerNotificationTemplate,
  resetPasswordNotificationSubject,
  resetPasswordNotificationTemplate,
  verificationEmailSubject,
  verificationEmailTemplate,
} from '@app/contracts/gmail/email-subject.constant';
import {
  EmailSystemType,
  SendMailDto,
} from '@app/contracts/gmail/send-mail.dto';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { UserDto } from '@app/contracts/user/user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OAuth2Client } from 'google-auth-library';
import { gmail_v1, google } from 'googleapis';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GmailService {
  private oauth2Client: OAuth2Client;

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    private readonly gmailService: MailerService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );
  }

  private async getGoogleTokens(userId: string) {
    const tokens = await firstValueFrom(
      this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, userId),
    );

    console.log('GmailService getGoogleTokens - tokens received:', tokens);
    if (tokens) {
      console.log(
        'GmailService getGoogleTokens - accessToken exists:',
        tokens.accessToken,
      );
      console.log(
        'GmailService getGoogleTokens - refreshToken exists:',
        tokens.refreshToken,
      );
    }

    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
      console.log('No valid Google tokens found for user:', userId);
      throw new NotFoundException('No Google account linked');
    }
    return {
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    };
  }

  async getUnreadEmails(userId: string) {
    console.log('userId trong getUnreadEmails: ', userId);

    // Giữ nguyên phần lấy token và khởi tạo gmail client
    const tokens = await this.getGoogleTokens(userId);
    this.oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

    // 1. Lấy danh sách ID của các email chưa đọc
    const listResponse = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
    });
    const messages = listResponse.data.messages || [];

    if (messages.length === 0) {
      console.log('Không tìm thấy email chưa đọc.');
      return [];
    }

    const emailDetailsPromises = messages
      .filter((message) => !!message.id)
      .map((message) => {
        return gmail.users.messages
          .get({
            userId: 'me',
            id: message.id!,
            format: 'full',
          })
          .then((response) => {
            const message = response.data;
            const { payload, snippet, id, threadId } = message;
            console.log('message trong getUnreadEmails: ', message);
            const headers = payload?.headers;

            const subject = headers?.find(
              (header) => header.name === 'Subject',
            )?.value;
            const from = headers?.find(
              (header) => header.name === 'From',
            )?.value;
            const date = headers?.find(
              (header) => header.name === 'Date',
            )?.value;

            let body = '';
            if (payload?.parts) {
              const part =
                payload.parts.find((p) => p.mimeType === 'text/plain') ||
                payload.parts.find((p) => p.mimeType === 'text/html');
              if (part && part.body && part.body.data) {
                body = Buffer.from(part.body.data, 'base64').toString('utf8');
              }
            } else if (payload?.body && payload.body.data) {
              body = Buffer.from(payload.body.data, 'base64').toString('utf8');
            }

            return {
              id,
              threadId,
              snippet,
              subject,
              from,
              date,
              body,
            };
          });
      });

    const fullEmails = await Promise.all(emailDetailsPromises);
    console.log(`Đã lấy nội dung của ${fullEmails.length} email.`);
    return fullEmails;
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
    const encodedMessage = Buffer.from(emailContent)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
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
    );

    if (!user) {
      throw new NotFoundException('User not found');
    }
    payload.to = user.email;

    if (type === EmailSystemType.LOGIN) {
      subject = loginNotificationSubject;
      content = loginNotificationTemplate(
        user.name,
        new Date().toString(),
        '1.2.3.4',
      );
    }

    if (type === EmailSystemType.REGISTER) {
      subject = registerNotificationSubject;
      content = registerNotificationTemplate(user.name, '');
    }

    if (type === EmailSystemType.PASSWORD_CHANGE) {
      subject = passwordChangeNotificationSubject;
      content = passwordChangeNotificationTemplate(
        user.name,
        new Date().toString(),
      );
    }

    if (type === EmailSystemType.RESET_PASSWORD) {
      subject = resetPasswordNotificationSubject;
      content = resetPasswordNotificationTemplate(user.name);
    }
  }

  async sendVerificationEmail(payload: {
    userId: string;
    email: string;
    verificationToken: string;
  }) {
    const { userId, email, verificationToken } = payload;

    try {
      // Tạo verification URL (cần cập nhật domain thực tế)
      const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

      const subject = verificationEmailSubject;
      const content = verificationEmailTemplate(
        email.split('@')[0], // Lấy phần trước @ làm tên
        verificationUrl,
        24, // 24 giờ
        process.env.APP_NAME || 'My App',
        process.env.SUPPORT_EMAIL || 'support@example.com',
      );

      return await this.gmailService.sendMail({
        to: email,
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new HttpException(
        'Failed to send verification email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async sendResetPasswordEmail(payload: {
    userId: string;
    email: string;
    resetToken: string;
    name: string;
  }) {
    const { userId, email, resetToken, name } = payload;

    try {
      // Tạo reset URL (cần cập nhật domain thực tế)
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      const subject = resetPasswordNotificationSubject;
      const content = resetPasswordNotificationTemplate(
        name,
        15, // 15 phút
        resetUrl,
        resetToken,
        process.env.APP_NAME || 'My App',
        process.env.SUPPORT_EMAIL || 'support@example.com',
      );

      return await this.gmailService.sendMail({
        to: email,
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      throw new HttpException(
        'Failed to send reset password email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
