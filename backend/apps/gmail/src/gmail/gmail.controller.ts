import { Controller } from '@nestjs/common';
import { GmailService } from './gmail.service';
import {
  EVENTS,
  EVENTS_EXCHANGE,
  EVENTS_GMAIL_QUEUE,
  GMAIL_EXCHANGE,
  GMAIL_PATTERNS,
  SendEmailVerificationDto,
  SendMailDto,
  User,
} from '@app/contracts';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { RabbitPayload } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.decorators';

@Controller()
export class GmailController {
  constructor(private readonly gmailService: GmailService) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REGISTER,
    queue: EVENTS_GMAIL_QUEUE,
  })
  register(@RabbitPayload() user: User) {
    this.gmailService.sendRegisterEmail(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LOGIN,
    queue: EVENTS_GMAIL_QUEUE,
  })
  login(@RabbitPayload() user: User) {
    this.gmailService.sendLoginEmail(user, '');
  }

  @RabbitRPC({
    exchange: GMAIL_EXCHANGE,
    routingKey: GMAIL_PATTERNS.GET_UNREAD_MAILS,
    queue: GMAIL_PATTERNS.GET_UNREAD_MAILS,
  })
  getUnreadEmails(@RabbitPayload('userId') userId: string) {
    return this.gmailService.getUnreadEmails(userId);
  }

  @RabbitRPC({
    exchange: GMAIL_EXCHANGE,
    routingKey: GMAIL_PATTERNS.SEND_MAIL,
    queue: GMAIL_PATTERNS.SEND_MAIL,
  })
  sendEmail(@RabbitPayload() payload: SendMailDto) {
    return this.gmailService.sendEmail(payload);
  }

  @RabbitRPC({
    exchange: GMAIL_EXCHANGE,
    routingKey: GMAIL_PATTERNS.SEND_LOGIN_EMAIL,
    queue: GMAIL_PATTERNS.SEND_LOGIN_EMAIL,
  })
  sendEmailLogin(@RabbitPayload() payload: { user: User; ip: string }) {
    return this.gmailService.sendLoginEmail(payload.user, payload.ip);
  }

  @RabbitRPC({
    exchange: GMAIL_EXCHANGE,
    routingKey: GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE,
    queue: GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE,
  })
  sendEmailPasswordChange(@RabbitPayload() user: User) {
    return this.gmailService.sendChangePasswordEmail(user);
  }

  @RabbitRPC({
    exchange: GMAIL_EXCHANGE,
    routingKey: GMAIL_PATTERNS.SEND_EMAIL_REGISTER,
    queue: GMAIL_PATTERNS.SEND_EMAIL_REGISTER,
  })
  sendEmailRegister(@RabbitPayload() user: User) {
    return this.gmailService.sendRegisterEmail(user);
  }

  @RabbitRPC({
    exchange: GMAIL_EXCHANGE,
    routingKey: GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
    queue: GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
  })
  sendVerificationEmail(
    @RabbitPayload()
    verificationEmail: SendEmailVerificationDto,
  ) {
    return this.gmailService.sendVerificationEmail(verificationEmail);
  }

  @RabbitRPC({
    exchange: GMAIL_EXCHANGE,
    routingKey: GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
    queue: GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
  })
  sendResetPasswordEmail(
    @RabbitPayload()
    resetPassword: SendEmailVerificationDto,
  ) {
    return this.gmailService.sendResetPasswordEmail(resetPassword);
  }
}