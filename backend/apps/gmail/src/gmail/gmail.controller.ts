import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GmailService } from './gmail.service';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { UserDto } from '@app/contracts/user/user.dto';
import { SendEmailVerificationDto } from '@app/contracts/gmail/dto/send-email.dto';

@Controller()
export class GmailController {
  constructor(private readonly gmailService: GmailService) { }

  @MessagePattern(GMAIL_PATTERNS.GET_UNREAD_MAILS)
  getUnreadEmails(@Payload('userId') userId: string) {
    return this.gmailService.getUnreadEmails(userId);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_MAIL)
  sendEmail(@Payload() payload: SendMailDto) {
    return this.gmailService.sendEmail(payload);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_LOGIN_EMAIL)
  sendEmailLogin(@Payload() user: UserDto) {
    return this.gmailService.sendEmailLogin(user);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE)
  sendEmailPasswordChange(@Payload() user: UserDto) {
    return this.gmailService.sendEmailPasswordChange(user);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_EMAIL_REGISTER)
  sendEmailRegister(@Payload() user: UserDto) {
    return this.gmailService.sendEmailRegister(user);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL)
  sendVerificationEmail(
    @Payload()
    verificationEmail: SendEmailVerificationDto
  ) {
    return this.gmailService.sendVerificationEmail(verificationEmail);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL)
  sendResetPasswordEmail(
    @Payload()
    resetPassword: SendEmailVerificationDto
  ) {
    return this.gmailService.sendResetPasswordEmail(resetPassword);
  }
}
