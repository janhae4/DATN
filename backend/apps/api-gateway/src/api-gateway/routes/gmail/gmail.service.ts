import { GMAIL_CLIENT } from '@app/contracts/constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { firstValueFrom } from 'rxjs';
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';

@Injectable()
export class GmailService {
  constructor(
    @Inject(GMAIL_CLIENT) private readonly gmailClient: ClientProxy,
  ) {}

  async getUnreadEmails(userId: string): Promise<any> {
    return await firstValueFrom(
      this.gmailClient.send(GMAIL_PATTERNS.GET_UNREAD_MAILS, { userId }),
    );
  }

  async sendEmail(payload: SendMailDto): Promise<any> {
    return await firstValueFrom(
      this.gmailClient.send(GMAIL_PATTERNS.SEND_MAIL, payload),
    );
  }
}
