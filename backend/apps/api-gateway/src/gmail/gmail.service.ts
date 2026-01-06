import { Injectable, Logger, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
    GMAIL_PATTERNS,
    SendMailDto,
    GetMailListDto,
    GetMailDetailDto,
    ReplyMailDto,
    GMAIL_CLIENT
} from '@app/contracts';

@Injectable()
export class GmailGatewayService {
    private readonly logger = new Logger(GmailGatewayService.name);

    constructor(@Inject(GMAIL_CLIENT) private readonly client: ClientProxy) { }

    async getUnreadEmails(userId: string) {
        this.logger.debug(`[ClientProxy] Requesting unread emails for user: ${userId}`);
        try {
            return await firstValueFrom(
                this.client.send(GMAIL_PATTERNS.GET_UNREAD_MAILS, { userId })
            );
        } catch (error) {
            this.logger.error(`[ClientProxy] Failed to get unread emails`, error);
            throw error;
        }
    }

    async getMailList(payload: GetMailListDto) {
        this.logger.debug(`[ClientProxy] Requesting mail list for user: ${payload.userId}`);
        try {
            return await firstValueFrom(
                this.client.send(GMAIL_PATTERNS.GET_MAIL_LIST, payload)
            );
        } catch (error) {
            this.logger.error(`[ClientProxy] Failed to get mail list`, error);
            throw error;
        }
    }

    async getMailDetail(payload: GetMailDetailDto) {
        this.logger.debug(`[ClientProxy] Requesting mail detail for msg: ${payload.messageId}`);
        try {
            return await firstValueFrom(
                this.client.send(GMAIL_PATTERNS.GET_MAIL_DETAIL, payload)
            );
        } catch (error) {
            this.logger.error(`[ClientProxy] Failed to get mail detail`, error);
            throw error;
        }
    }

    async sendEmail(payload: SendMailDto) {
        this.logger.debug(`[ClientProxy] Sending email for user: ${payload.userId}`);
        try {
            return await firstValueFrom(
                this.client.send(GMAIL_PATTERNS.SEND_MAIL, payload)
            );
        } catch (error) {
            this.logger.error(`[ClientProxy] Failed to send email`, error);
            throw error;
        }
    }

    async replyMail(payload: ReplyMailDto) {
        this.logger.debug(`[ClientProxy] Replying email for user: ${payload.userId}`);
        try {
            return await firstValueFrom(
                this.client.send(GMAIL_PATTERNS.REPLY_MAIL, payload)
            );
        } catch (error) {
            this.logger.error(`[ClientProxy] Failed to reply email`, error);
            throw error;
        }
    }

    async status() {
        this.logger.debug(`[ClientProxy] Checking status`);
        try {
            return await firstValueFrom(
                this.client.send('gmail_status', {})
            );
        } catch (error) {
            this.logger.error(`[ClientProxy] Failed Check status`, error);
            throw error;
        }
    }
}
