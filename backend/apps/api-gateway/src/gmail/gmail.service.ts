import { Injectable, Logger } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import {
    GMAIL_PATTERNS,
    SendMailDto,
    GetMailListDto,
    GetMailDetailDto,
    ReplyMailDto,
    GMAIL_EXCHANGE,
} from '@app/contracts';

@Injectable()
export class GmailGatewayService {
    private readonly logger = new Logger(GmailGatewayService.name);

    constructor(
        private readonly rmqClient: RmqClientService
    ) { }

    async getUnreadEmails(userId: string) {
        this.logger.debug(`[RmqClient] Requesting unread emails for user: ${userId}`);
        return this.rmqClient.request({
            exchange: GMAIL_EXCHANGE,
            routingKey: GMAIL_PATTERNS.GET_UNREAD_MAILS,
            payload: { userId },
        });
    }

    async getMailList(payload: GetMailListDto) {
        this.logger.debug(`[RmqClient] Requesting mail list for user: ${payload.userId}`);
        return this.rmqClient.request({
            exchange: GMAIL_EXCHANGE,
            routingKey: GMAIL_PATTERNS.GET_MAIL_LIST,
            payload: payload,
        });
    }

    async getMailDetail(payload: GetMailDetailDto) {
        this.logger.debug(`[RmqClient] Requesting mail detail for msg: ${payload.messageId}`);
        return this.rmqClient.request({
            exchange: GMAIL_EXCHANGE,
            routingKey: GMAIL_PATTERNS.GET_MAIL_DETAIL,
            payload: payload,
        });
    }

    async sendEmail(payload: SendMailDto) {
        this.logger.debug(`[RmqClient] Sending email for user: ${payload.userId}`);
        return this.rmqClient.request({
            exchange: GMAIL_EXCHANGE,
            routingKey: GMAIL_PATTERNS.SEND_MAIL,
            payload: payload,
        });
    }

    async replyMail(payload: ReplyMailDto) {
        this.logger.debug(`[RmqClient] Replying email for user: ${payload.userId}`);
        return this.rmqClient.request({
            exchange: GMAIL_EXCHANGE,
            routingKey: GMAIL_PATTERNS.REPLY_MAIL,
            payload: payload,
        });
    }

    async status() {
        this.logger.debug(`[RmqClient] Checking status`);
        return this.rmqClient.request({
            exchange: GMAIL_EXCHANGE,
            routingKey: 'gmail_status',
            payload: {},
        });
    }
}