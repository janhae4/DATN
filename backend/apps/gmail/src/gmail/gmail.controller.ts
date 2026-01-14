import { Controller, Logger } from '@nestjs/common';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { GmailService } from './gmail.service';
import {
    GMAIL_PATTERNS,
    SendMailDto,
    GetMailListDto,
    GetMailDetailDto,
    ReplyMailDto,
    User,
    SendEmailVerificationDto,
    EVENTS,
    GMAIL_EXCHANGE,
    EVENTS_EXCHANGE,
} from '@app/contracts';

@Controller()
export class GmailController {
    private readonly logger = new Logger(GmailController.name);

    constructor(private readonly gmailService: GmailService) { }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.GET_UNREAD_MAILS,
        queue: GMAIL_PATTERNS.GET_UNREAD_MAILS,
    })
    async handleGetUnreadMails(payload: { userId: string }) {
        this.logger.log(`Received get unread mails request for user: ${payload.userId}`);
        return this.gmailService.getUnreadEmails(payload.userId);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.GET_MAIL_LIST,
        queue: GMAIL_PATTERNS.GET_MAIL_LIST,
    })
    async handleGetMailList(payload: GetMailListDto) {
        this.logger.log(`Received get mail list request for user: ${payload.userId}`);
        return this.gmailService.getMailList(payload);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.GET_MAIL_DETAIL,
        queue: GMAIL_PATTERNS.GET_MAIL_DETAIL,
    })
    async handleGetMailDetail(payload: GetMailDetailDto) {
        this.logger.log(`Received get mail detail request for message: ${payload.messageId}`);
        return this.gmailService.getMailDetail(payload);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.SEND_MAIL,
        queue: GMAIL_PATTERNS.SEND_MAIL,
    })
    async handleSendMail(payload: SendMailDto) {
        this.logger.log(`Received send mail request for user: ${payload.userId}`);
        return this.gmailService.sendEmail(payload);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.REPLY_MAIL,
        queue: GMAIL_PATTERNS.REPLY_MAIL,
    })
    async handleReplyMail(payload: ReplyMailDto) {
        this.logger.log(`Received reply mail request for thread: ${payload.threadId}`);
        return this.gmailService.replyMail(payload);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: 'gmail_status',
        queue: 'gmail_status',
    })
    async handleStatus() {
        this.logger.log('Received status check request');
        return this.gmailService.getStatus();
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.SEND_LOGIN_EMAIL,
        queue: GMAIL_PATTERNS.SEND_LOGIN_EMAIL,
    })
    async sendEmailLogin(payload: { user: User; ip: string }) {
        return this.gmailService.sendLoginEmail(payload.user, payload.ip);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE,
        queue: GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE,
    })
    async sendEmailPasswordChange(user: User) {
        return this.gmailService.sendChangePasswordEmail(user);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.SEND_EMAIL_REGISTER,
        queue: GMAIL_PATTERNS.SEND_EMAIL_REGISTER,
    })
    async sendEmailRegister(user: User) {
        return this.gmailService.sendRegisterEmail(user);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
        queue: GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
    })
    async sendVerificationEmail(verificationEmail: SendEmailVerificationDto) {
        return this.gmailService.sendVerificationEmail(verificationEmail);
    }

    @RabbitRPC({
        exchange: GMAIL_EXCHANGE,
        routingKey: GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
        queue: GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
    })
    async sendResetPasswordEmail(resetPassword: SendEmailVerificationDto) {
        return this.gmailService.sendResetPasswordEmail(resetPassword);
    }

    @RabbitSubscribe({
        exchange: EVENTS_EXCHANGE,
        routingKey: EVENTS.REGISTER,
        queue: 'events.gmail.register',
    })
    async register(user: User) {
        this.logger.log(`Event: User registered ${user.email}`);
        await this.gmailService.sendRegisterEmail(user);
    }

    @RabbitSubscribe({
        exchange: EVENTS_EXCHANGE,
        routingKey: EVENTS.LOGIN,
        queue: 'events.gmail.login',
    })
    async login(user: User) {
        this.logger.log(`Event: User logged in ${user.email}`);
        await this.gmailService.sendLoginEmail(user, '');
    }
}