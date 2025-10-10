import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GmailService } from './gmail.service';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';

@Controller()
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @MessagePattern(GMAIL_PATTERNS.GET_UNREAD_MAILS)
  getUnreadEmails(@Payload('userId') userId: string) {
    return this.gmailService.getUnreadEmails(userId);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_MAIL)
  sendEmail(@Payload() payload: SendMailDto) {
    return this.gmailService.sendEmail(payload);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_EMAIL_SYSTEM)
  sendEmailSystem(@Payload() payload: SendMailDto) {
    return this.gmailService.sendEmailSystem(payload);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL)
  sendVerificationEmail(@Payload() payload: { userId: string; email: string; verificationToken: string }) {
    return this.gmailService.sendVerificationEmail(payload);
  }

  @MessagePattern(GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL)
  sendResetPasswordEmail(@Payload() payload: { userId: string; email: string; resetToken: string; name: string }) {
    return this.gmailService.sendResetPasswordEmail(payload);
  }
}