import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { GmailService } from './gmail.service';
import {
  EVENTS,
  GMAIL_PATTERNS,
  SendEmailVerificationDto,
  SendMailDto,
  User,
} from '@app/contracts';

@Controller()
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @EventPattern(EVENTS.REGISTER)
  register(@Payload() user: User) {
    this.gmailService.sendRegisterEmail(user);
  }

  @EventPattern(EVENTS.LOGIN)
  login(@Payload() user: User) {
    this.gmailService.sendLoginEmail(user, '');
  }

  @MessagePattern(GMAIL_PATTERNS.GET_UNREAD_MAILS)
  getUnreadEmails(@Payload('userId') userId: string) {
    return this.gmailService.getUnreadEmails(userId);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_MAIL)
  sendEmail(@Payload() payload: SendMailDto) {
    return this.gmailService.sendEmail(payload);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_LOGIN_EMAIL)
  sendEmailLogin(@Payload() payload: { user: User; ip: string }) {
    return this.gmailService.sendLoginEmail(payload.user, payload.ip);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE)
  sendEmailPasswordChange(@Payload() user: User) {
    return this.gmailService.sendChangePasswordEmail(user);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_EMAIL_REGISTER)
  sendEmailRegister(@Payload() user: User) {
    return this.gmailService.sendRegisterEmail(user);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL)
  sendVerificationEmail(
    @Payload()
    verificationEmail: SendEmailVerificationDto,
  ) {
    return this.gmailService.sendVerificationEmail(verificationEmail);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL)
  sendResetPasswordEmail(
    @Payload()
    resetPassword: SendEmailVerificationDto,
  ) {
    return this.gmailService.sendResetPasswordEmail(resetPassword);
  }
}
