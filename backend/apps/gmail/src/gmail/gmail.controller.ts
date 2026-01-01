import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, EventPattern } from '@nestjs/microservices';
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
} from '@app/contracts';

@Controller()
export class GmailController {
    private readonly logger = new Logger(GmailController.name);

    constructor(private readonly gmailService: GmailService) { }

    @MessagePattern(GMAIL_PATTERNS.GET_UNREAD_MAILS)
    async handleGetUnreadMails(@Payload() payload: { userId: string }) {
        this.logger.log(`Received get unread mails request for user: ${payload.userId}`);
        try {
            return await this.gmailService.getUnreadEmails(payload.userId);
        } catch (error) {
            this.logger.error('Error handling get unread mails', error);
            throw error;
        }
    }

    @MessagePattern(GMAIL_PATTERNS.GET_MAIL_LIST)
    async handleGetMailList(@Payload() payload: GetMailListDto) {
        this.logger.log(`Received get mail list request for user: ${payload.userId}`);
        return await this.gmailService.getMailList(payload);
    }

    @MessagePattern(GMAIL_PATTERNS.GET_MAIL_DETAIL)
    async handleGetMailDetail(@Payload() payload: GetMailDetailDto) {
        this.logger.log(`Received get mail detail request for message: ${payload.messageId}`);
        return await this.gmailService.getMailDetail(payload);
    }

    @MessagePattern(GMAIL_PATTERNS.SEND_MAIL)
    async handleSendMail(@Payload() payload: SendMailDto) {
        this.logger.log(`Received send mail request for user: ${payload.userId}`);
        return await this.gmailService.sendEmail(payload);
    }

    @MessagePattern(GMAIL_PATTERNS.REPLY_MAIL)
    async handleReplyMail(@Payload() payload: ReplyMailDto) {
        this.logger.log(`Received reply mail request for thread: ${payload.threadId}`);
        return await this.gmailService.replyMail(payload);
    }

    @MessagePattern('gmail_status')
    async handleStatus() {
        this.logger.log('Received status check request');
        return await this.gmailService.getStatus();
    }

    @EventPattern(EVENTS.REGISTER)
    async register(@Payload() user: User) {
        return this.gmailService.sendRegisterEmail(user);
    }

    @EventPattern(EVENTS.LOGIN)
    async login(@Payload() user: User) {
        return this.gmailService.sendLoginEmail(user, '');
    }

    @MessagePattern(GMAIL_PATTERNS.SEND_LOGIN_EMAIL)
    async sendEmailLogin(@Payload() payload: { user: User; ip: string }) {
        return this.gmailService.sendLoginEmail(payload.user, payload.ip);
    }

    @MessagePattern(GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE)
    async sendEmailPasswordChange(@Payload() user: User) {
        return this.gmailService.sendChangePasswordEmail(user);
    }

    @MessagePattern(GMAIL_PATTERNS.SEND_EMAIL_REGISTER)
    async sendEmailRegister(@Payload() user: User) {
        return this.gmailService.sendRegisterEmail(user);
    }

    @MessagePattern(GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL)
    async sendVerificationEmail(@Payload() verificationEmail: SendEmailVerificationDto) {
        return this.gmailService.sendVerificationEmail(verificationEmail);
    }

    @MessagePattern(GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL)
    async sendResetPasswordEmail(@Payload() resetPassword: SendEmailVerificationDto) {
        return this.gmailService.sendResetPasswordEmail(resetPassword);
    }
}
