import { GMAIL_CLIENT, GMAIL_PATTERNS, SendMailDto } from '@app/contracts';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

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
