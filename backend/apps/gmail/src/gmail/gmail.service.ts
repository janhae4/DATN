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
  REDIS_CLIENT,
  REDIS_PATTERN,
  LoginResponseDto,
  NotFoundException,
  SendMailDto,
  SendEmailVerificationDto,
  BadRequestException,
  User,
} from '@app/contracts';
import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Inject, Logger } from '@nestjs/common'; // 1. Import Logger
import { ClientProxy } from '@nestjs/microservices';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { firstValueFrom } from 'rxjs';
import { SentMessageInfo } from 'nodemailer';

@Injectable()
export class GmailService {
  private readonly logger = new Logger(GmailService.name);
  private oauth2Client: OAuth2Client = new OAuth2Client();

  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    private readonly gmailService: MailerService,
  ) {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_CALLBACK_URL,
    );
  }

  private async getGoogleTokens(userId: string) {
    this.logger.debug(`Fetching Google tokens from Redis for user: ${userId}`);
    const tokens = await firstValueFrom<LoginResponseDto>(
      this.redisClient.send(REDIS_PATTERN.GET_GOOGLE_TOKEN, { userId }),
    );

    if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
      this.logger.warn(
        `No valid Google tokens found for user: ${userId}. Account may not be linked.`,
      );
      throw new NotFoundException('No Google account linked');
    }
    return tokens;
  }

  async getUnreadEmails(userId: string) {
    this.logger.debug(`Fetching unread emails for user ID: ${userId}`);
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
    const messages = response.data.messages || [];
    this.logger.debug(
      `Found ${messages.length} unread emails for user ${userId}.`,
    );
    return messages;
  }

  async sendEmail(payload: SendMailDto): Promise<{ message: string }> {
    this.logger.log(
      `Sending custom email via Gmail API to ${payload.to} for user ${payload.userId}...`,
    );
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
    this.logger.log(`Successfully sent custom email to ${to}.`);
    return { message: 'Email đã được gửi thành công!' };
  }

  async sendVerificationEmail(
    payload: SendEmailVerificationDto,
  ): Promise<SentMessageInfo> {
    const { user, code, url } = payload;
    const subject = verificationEmailSubject;
    const content = verificationEmailTemplate(user?.name ?? '', url, code, 15);

    try {
      this.logger.log(`Sending verification email to ${user?.email}...`);
      return await this.gmailService.sendMail({
        to: user?.email ?? '',
        subject,
        html: content,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${user?.email}`,
        error,
      );
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
      this.logger.log(`Sending reset password email to ${user.email}...`);
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send reset password email to ${user.email}`,
        error,
      );
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
      this.logger.log(
        `Sending password change notification to ${user.email}...`,
      );
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send change password email to ${user.email}`,
        error,
      );
      throw new BadRequestException('Failed to send change password email');
    }
  }

  async sendRegisterEmail(user: User): Promise<SentMessageInfo> {
    const subject = registerNotificationSubject;
    const content = registerNotificationTemplate(user.name, '');

    try {
      this.logger.log(`Sending registration confirmation to ${user.email}...`);
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      this.logger.error(
        `Failed to send register email to ${user.email}`,
        error,
      );
      throw new BadRequestException('Failed to send register email');
    }
  }

  async sendLoginEmail(user: User, ip: string): Promise<SentMessageInfo> {
    const subject = loginNotificationSubject;
    const content = loginNotificationTemplate(
      user.name,
      new Date().toString(),
      ip,
    );

    try {
      this.logger.log(`Sending login notification to ${user.email}...`);
      return await this.gmailService.sendMail({
        to: user.email,
        subject,
        html: content,
      });
    } catch (error) {
      this.logger.error(`Failed to send login email to ${user.email}`, error);
      throw new BadRequestException('Failed to send login email');
    }
  }
}
