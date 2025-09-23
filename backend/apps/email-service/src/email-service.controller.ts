import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { EmailServiceService } from './email-service.service';
import { EMAIL_PATTERNS } from '@app/contracts/email/email.patterns';

@Controller()
export class EmailServiceController {
  constructor(private readonly emailServiceService: EmailServiceService) {}

  @MessagePattern(EMAIL_PATTERNS.FETCH_UNREAD)
  async fetchUnread() {
    return this.emailServiceService.fetchUnreadMails();
  }
}
