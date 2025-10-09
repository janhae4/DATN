import { GMAIL_CLIENT } from '@app/contracts/constants';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';

@Injectable()
export class GmailService {
    constructor(
        @Inject(GMAIL_CLIENT) private readonly gmailClient: ClientProxy,
    ) { }

    getUnreadEmails(userId: string) {
        return this.gmailClient.send(GMAIL_PATTERNS.GET_UNREAD_MAILS, { userId });
    }

    sendEmail(userId: string, email: string, subject: string, messageText: string) {
        return this.gmailClient.send(GMAIL_PATTERNS.SEND_MAIL, { userId, email, subject, messageText });
    }

}
