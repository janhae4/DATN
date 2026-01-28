import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientConfigService, REDIS_EXCHANGE, REDIS_PATTERN, GMAIL_EXCHANGE, GMAIL_QUEUE, EVENTS_EXCHANGE, EVENTS } from '@app/contracts';
import * as amqplib from 'amqplib';
import { MailerService } from '@nestjs-modules/mailer';
import { google, gmail_v1 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { SendMailDto, ReplyMailDto, GetMailListDto, GetMailDetailDto, User, SendEmailVerificationDto } from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RmqClientService } from '@app/common';
import { AuthCacheService } from '@app/redis-service';

@Injectable()
export class GmailService {
    private readonly logger = new Logger(GmailService.name);
    private readonly oauth2Client: OAuth2Client;

    constructor(
        private readonly configService: ClientConfigService,
        private readonly authCache: AuthCacheService,
        private readonly mailerService: MailerService,
    ) {
        this.oauth2Client = new google.auth.OAuth2(
            this.configService.getGoogleClientId(),
            this.configService.getGoogleClientSecret(),
            this.configService.getGoogleRedirectUri(),
        );
    }

    /**
     * Get Gmail client instance for a specific user
     */
    private async getGmailClient(userId: string): Promise<gmail_v1.Gmail> {
        try {
            const tokens = await this.authCache.getGoogleToken(userId);

            this.oauth2Client.setCredentials({
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken,
            });

            return google.gmail({ version: 'v1', auth: this.oauth2Client });
        } catch (error) {
            this.logger.error(`Failed to get Gmail client for user ${userId}`, error);
            throw new Error('Failed to authenticate with Gmail. Please link your Google account first.');
        }
    }

    /**
     * Get unread emails for a user
     */
    async getUnreadEmails(userId: string) {
        this.logger.log(`Getting unread emails for user: ${userId}`);

        try {
            const gmail = await this.getGmailClient(userId);

            const response = await gmail.users.messages.list({
                userId: 'me',
                q: 'is:unread',
                maxResults: 20,
            });

            const messages = response.data.messages || [];
            this.logger.log(`Found ${messages.length} unread emails`);

            const emailDetails = await Promise.all(
                messages.map(async (message) => {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: message.id!,
                        format: 'metadata',
                        metadataHeaders: ['From', 'Subject', 'Date'],
                    });

                    const headers = detail.data.payload?.headers || [];
                    return {
                        id: message.id,
                        threadId: message.threadId,
                        from: headers.find(h => h.name === 'From')?.value,
                        subject: headers.find(h => h.name === 'Subject')?.value,
                        date: headers.find(h => h.name === 'Date')?.value,
                    };
                })
            );

            return {
                count: messages.length,
                emails: emailDetails,
            };
        } catch (error) {
            this.logger.error(`Error getting unread emails for user ${userId}`, error);
            throw error;
        }
    }

    /**
     * Get list of emails with query and pagination
     */
    async getMailList(payload: GetMailListDto) {
        this.logger.log(`Getting mail list for user: ${payload.userId}`);

        try {
            const gmail = await this.getGmailClient(payload.userId);

            const response = await gmail.users.messages.list({
                userId: 'me',
                q: payload.q || 'in:inbox',
                maxResults: payload.maxResults || 50,
                pageToken: payload.pageToken,
            });

            const messages = response.data.messages || [];

            // Fetch metadata for each message
            const emailList = await Promise.all(
                messages.map(async (message) => {
                    const detail = await gmail.users.messages.get({
                        userId: 'me',
                        id: message.id!,
                        format: 'metadata',
                        metadataHeaders: ['From', 'To', 'Subject', 'Date'],
                    });

                    const headers = detail.data.payload?.headers || [];
                    const labels = detail.data.labelIds || [];

                    return {
                        id: message.id,
                        threadId: message.threadId,
                        from: headers.find(h => h.name === 'From')?.value,
                        to: headers.find(h => h.name === 'To')?.value,
                        subject: headers.find(h => h.name === 'Subject')?.value,
                        date: headers.find(h => h.name === 'Date')?.value,
                        snippet: detail.data.snippet,
                        labels,
                    };
                })
            );

            return {
                emails: emailList,
                nextPageToken: response.data.nextPageToken,
                resultSizeEstimate: response.data.resultSizeEstimate,
            };
        } catch (error) {
            this.logger.error(`Error getting mail list for user ${payload.userId}`, error);
            throw error;
        }
    }

    /**
     * Get detailed information about a specific email
     */
    async getMailDetail(payload: GetMailDetailDto) {
        this.logger.log(`Getting mail detail for message: ${payload.messageId}`);

        try {
            const gmail = await this.getGmailClient(payload.userId);

            const response = await gmail.users.messages.get({
                userId: 'me',
                id: payload.messageId,
                format: 'full',
            });

            const message = response.data;
            const headers = message.payload?.headers || [];

            // Extract email body
            const body = this.getEmailBody(message.payload);

            return {
                id: message.id,
                threadId: message.threadId,
                from: headers.find(h => h.name === 'From')?.value,
                to: headers.find(h => h.name === 'To')?.value,
                subject: headers.find(h => h.name === 'Subject')?.value,
                date: headers.find(h => h.name === 'Date')?.value,
                body,
                snippet: message.snippet,
                labels: message.labelIds || [],
            };
        } catch (error) {
            this.logger.error(`Error getting mail detail for message ${payload.messageId}`, error);
            throw error;
        }
    }

    /**
     * Recursively extract email body from payload
     * Prioritizes text/html, then text/plain, then recurses into multiparts
     */
    private getEmailBody(payload: any): string {
        if (!payload) return '';

        // If direct body exists and data is present
        if (payload.body && payload.body.data) {
            return Buffer.from(payload.body.data, 'base64').toString('utf-8');
        }

        if (payload.parts && payload.parts.length > 0) {
            const htmlPart = payload.parts.find((part: any) => part.mimeType === 'text/html');
            if (htmlPart) {
                return this.getEmailBody(htmlPart);
            }

            const alternativePart = payload.parts.find((part: any) => part.mimeType === 'multipart/alternative');
            if (alternativePart) {
                return this.getEmailBody(alternativePart);
            }

            const textPart = payload.parts.find((part: any) => part.mimeType === 'text/plain');
            if (textPart) {
                return this.getEmailBody(textPart);
            }

            const otherMultipart = payload.parts.find((part: any) => part.mimeType.startsWith('multipart/'));
            if (otherMultipart) {
                return this.getEmailBody(otherMultipart);
            }
        }

        return '';
    }

    /**
     * Send an email
     */
    async sendEmail(payload: SendMailDto) {
        this.logger.log(`Sending email to ${payload.to} for user ${payload.userId}`);

        try {
            const gmail = await this.getGmailClient(payload.userId);

            // Create email message
            const email = this.createEmailMessage(payload);

            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: email,
                },
            });

            this.logger.log(`Email sent successfully with ID: ${response.data.id}`);

            return {
                message: 'Email sent successfully',
                messageId: response.data.id,
                threadId: response.data.threadId,
            };
        } catch (error) {
            this.logger.error(`Error sending email for user ${payload.userId}`, error);
            throw error;
        }
    }

    /**
     * Reply to an email
     */
    async replyMail(payload: ReplyMailDto) {
        this.logger.log(`Replying to thread: ${payload.threadId}`);

        try {
            const gmail = await this.getGmailClient(payload.userId);

            const original = await gmail.users.messages.get({
                userId: 'me',
                id: payload.messageId,
                format: 'metadata',
                metadataHeaders: ['Message-ID', 'References', 'In-Reply-To'],
            });

            const headers = original.data.payload?.headers || [];
            const messageId = headers.find(h => h.name === 'Message-ID')?.value || undefined;
            const references = headers.find(h => h.name === 'References')?.value || undefined;

            // Create reply message
            const email = this.createReplyMessage(payload, messageId, references);

            const response = await gmail.users.messages.send({
                userId: 'me',
                requestBody: {
                    raw: email,
                    threadId: payload.threadId,
                },
            });

            this.logger.log(`Reply sent successfully with ID: ${response.data.id}`);

            return {
                message: 'Reply sent successfully',
                messageId: response.data.id,
                threadId: response.data.threadId,
            };
        } catch (error) {
            this.logger.error(`Error replying to thread ${payload.threadId}`, error);
            throw error;
        }
    }

    /**
     * Create base64 encoded email message
     */
    private createEmailMessage(payload: SendMailDto): string {
        const lines: string[] = [];

        lines.push(`To: ${payload.to}`);
        if (payload.cc) {
            const cc = Array.isArray(payload.cc) ? payload.cc.join(', ') : payload.cc;
            lines.push(`Cc: ${cc}`);
        }
        if (payload.bcc) {
            const bcc = Array.isArray(payload.bcc) ? payload.bcc.join(', ') : payload.bcc;
            lines.push(`Bcc: ${bcc}`);
        }
        lines.push(`Subject: ${payload.subject}`);
        lines.push('MIME-Version: 1.0');
        lines.push('Content-Type: text/html; charset=utf-8');
        lines.push('');
        lines.push(payload.content || payload.messageText);

        const email = lines.join('\r\n');
        return Buffer.from(email).toString('base64url');
    }

    /**
     * Create base64 encoded reply message
     */
    private createReplyMessage(
        payload: ReplyMailDto,
        originalMessageId?: string,
        originalReferences?: string,
    ): string {
        const lines: string[] = [];

        lines.push(`To: ${payload.to}`);
        lines.push(`Subject: Re: ${payload.subject}`);

        if (originalMessageId) {
            lines.push(`In-Reply-To: ${originalMessageId}`);
            const refs = originalReferences
                ? `${originalReferences} ${originalMessageId}`
                : originalMessageId;
            lines.push(`References: ${refs}`);
        }

        lines.push('MIME-Version: 1.0');
        lines.push('Content-Type: text/html; charset=utf-8');
        lines.push('');
        lines.push(payload.content);

        const email = lines.join('\r\n');
        return Buffer.from(email).toString('base64url');
    }

    /**
     * Health check
     */
    async getStatus() {
        return {
            status: 'ok',
            service: 'gmail',
            timestamp: new Date().toISOString(),
        };
    }
    async sendRegisterEmail(user: User) {
        this.logger.log(`Sending register email to ${user.email}`);
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Welcome to Our App',
            template: 'register',
            context: {
                name: user.name || 'User',
            },
        });
        return { success: true, message: 'Register email sent' };
    }

    async sendLoginEmail(user: User, ip: string) {
        this.logger.log(`Sending login email to ${user.email} from IP ${ip}`);
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'New Login Detected',
            template: 'login',
            context: {
                name: user.name || 'User',
                ip: ip,
            },
        });
        return { success: true, message: 'Login email sent' };
    }

    async sendChangePasswordEmail(user: User) {
        this.logger.log(`Sending change password email to ${user.email}`);
        await this.mailerService.sendMail({
            to: user.email,
            subject: 'Password Changed Successfully',
            template: 'change-password',
            context: {
                name: user.name || 'User',
            },
        });
        return { success: true, message: 'Change password email sent' };
    }

    async sendVerificationEmail(payload: SendEmailVerificationDto) {
        this.logger.log(`Sending verification email to ${payload.user.email}`);
        await this.mailerService.sendMail({
            to: payload.user.email,
            subject: 'Verify Your Account',
            template: 'verification',
            context: {
                user: payload.user,
                code: payload.code,
                url: payload.url,
            },
        });
        return { success: true, message: 'Verification email sent' };
    }

    async sendResetPasswordEmail(payload: SendEmailVerificationDto) {
        this.logger.log(`Sending reset password email to ${payload.user.email}`);
        await this.mailerService.sendMail({
            to: payload.user.email,
            subject: 'Reset Your Password',
            template: 'verification',
            context: {
                user: payload.user,
                code: payload.code,
                url: payload.url,
            },
        });
        return { success: true, message: 'Reset password email sent' };
    }
}
