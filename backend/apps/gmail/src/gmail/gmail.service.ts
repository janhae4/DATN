import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { REDIS_CLIENT } from '@app/contracts/constants';
import { NotFoundException } from '@app/contracts/errror';
import { SendEmailVerificationDto } from '@app/contracts/gmail/dto/send-email.dto';
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
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { UserDto } from '@app/contracts/user/user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { OAuth2Client } from 'google-auth-library';
import { google, gmail_v1 } from 'googleapis';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GmailService {
  private oauth2Client: OAuth2Client = new OAuth2Client();
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    private readonly gmailService: MailerService,
  ) {}

  private async getGoogleTokens(userId: string) {
    const tokens = await firstValueFrom<LoginResponseDto | null>(
      this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, { userId }),
    );

    console.log('GmailService getGoogleTokens - tokens received:', !!tokens);

    if (
      !tokens ||
      typeof tokens.accessToken !== 'string' ||
      typeof tokens.refreshToken !== 'string'
    ) {
      console.log('No valid Google tokens found for user:', userId);
      throw new NotFoundException('No Google account linked');
    }

    console.log(
      'GmailService getGoogleTokens - accessToken exists:',
      !!tokens.accessToken,
    );
    console.log(
      'GmailService getGoogleTokens - refreshToken exists:',
      !!tokens.refreshToken,
    );

    return tokens;
  }

  async getUnreadEmails(
    userId: string,
  ): Promise<gmail_v1.Schema$Message[] | undefined> {
    console.log('userId trong getUnreadEmails: ', userId);
    const tokens: LoginResponseDto = await this.getGoogleTokens(userId);
    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'is:unread',
    });
    console.log('response', response.data.messages || []);
    return response.data.messages || [];
  }

  async sendEmail(payload: SendMailDto): Promise<{ message: string }> {
    const { userId, to, subject, messageText } = payload;
    const tokens: LoginResponseDto = await this.getGoogleTokens(userId);
    this.oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
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

  async sendEmailLogin(user: UserDto): Promise<void> {
    const subject = loginNotificationSubject;
    const content = loginNotificationTemplate(
      user.name,
      new Date().toISOString(),
      '',
    );

    await this.gmailService.sendMail({
      to: user.email,
      subject,
      text: content,
    });
  }

  async sendEmailRegister(user: UserDto): Promise<void> {
    const subject = registerNotificationSubject;
    const content = registerNotificationTemplate(user.name);
    console.log('SEND EMAIL REGISTER TO', user.email);
    await this.gmailService.sendMail({
      to: user.email,
      subject,
      html: content,
    });
  }

  async sendEmailPasswordChange(user: UserDto): Promise<void> {
    const subject = passwordChangeNotificationSubject;
    const content = passwordChangeNotificationTemplate(
      user.name,
      new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }),
    );
    await this.gmailService.sendMail({
      to: user.email,
      subject,
      html: content,
    });
  }

  async sendVerificationEmail(verificationEmail: SendEmailVerificationDto) {
    try {
      const { url, user, code } = verificationEmail;
      const subject = verificationEmailSubject;
      const content = verificationEmailTemplate(
        user?.name ?? '',
        url,
        code,
        15,
      );

      await this.gmailService.sendMail({
        to: user?.email ?? '',
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new RpcException({
        message: 'Failed to send verification email',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }

  async sendResetPasswordEmail(resetPassword: SendEmailVerificationDto) {
    try {
      const { url, user, code } = resetPassword;
      const subject = resetPasswordNotificationSubject;
      const content = resetPasswordNotificationTemplate(
        user?.name ?? '',
        15,
        url,
        code,
      );

      await this.gmailService.sendMail({
        to: user?.email ?? '',
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      throw new RpcException({
        message: 'Failed to send reset password email',
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      });
    }
  }
}
