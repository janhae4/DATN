import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { AUTH_CLIENT, REDIS_CLIENT } from '@app/contracts/constants';
import { BadRequestException, NotFoundException } from '@app/contracts/errror';
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
import { User } from '@app/contracts/user/entity/user.entity';
import { UserDto } from '@app/contracts/user/user.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { firstValueFrom } from 'rxjs';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class GmailService {
  private oauth2Client: OAuth2Client = new OAuth2Client();
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
    const tokens = await firstValueFrom<LoginResponseDto>(
      this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, { userId }),
    );

    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
      console.log('No valid Google tokens found for user:', userId);
      throw new NotFoundException('No Google account linked');
    }
    return tokens;
  }

  async getUnreadEmails(userId: string) {
    console.log('userId trong getUnreadEmails: ', userId);
    const tokens = await this.getGoogleTokens(userId);
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

  async sendVerificationEmail(
    payload: SendEmailVerificationDto,
  ): Promise<SentMessageInfo> {
    const { user, code, url } = payload;

    const subject = verificationEmailSubject;
    const content = verificationEmailTemplate(user?.name ?? '', url, code, 15);

    try {
      await this.gmailService.sendMail({
        to: user?.email ?? '',
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new BadRequestException('Failed to send verification email');
    }
  }

  async sendResetPasswordEmail(
    payload: SendEmailVerificationDto,
  ): Promise<SentMessageInfo> {
    const { user, code, url } = payload;

    const subject = resetPasswordNotificationSubject;
    const content = resetPasswordNotificationTemplate(
      user?.name ?? '',
      15,
      url,
      code,
    );

    try {
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send reset password email:', error);
      throw new BadRequestException('Failed to send reset password email');
    }
  }

  async sendChangePasswordEmail(user: User): Promise<SentMessageInfo> {
    const subject = passwordChangeNotificationSubject;
    const content = passwordChangeNotificationTemplate(
      user.name,
      new Date().toString(),
    );

    try {
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send change password email:', error);
      throw new BadRequestException('Failed to send change password email');
    }
  }

  async sendRegisterEmail(user: User): Promise<SentMessageInfo> {
    const subject = registerNotificationSubject;
    const content = registerNotificationTemplate(user.name, '');

    try {
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send register email:', error);
      throw new BadRequestException('Failed to send register email');
    }
  }

  async sendLoginEmail(user: UserDto, ip: string): Promise<SentMessageInfo> {
    const subject = loginNotificationSubject;
    const content = loginNotificationTemplate(
      user.name,
      new Date().toString(),
      ip,
    );

    try {
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      console.error('Failed to send login email:', error);
      throw new BadRequestException('Failed to send login email');
    }
  }
}
