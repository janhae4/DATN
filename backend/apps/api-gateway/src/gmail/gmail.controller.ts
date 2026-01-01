import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoleGuard } from '../common/role/role.guard';
import { CurrentUser } from '../common/role/current-user.decorator';
import { SendMailDto, ReplyMailDto, Role } from '@app/contracts';
import { GmailGatewayService } from './gmail.service';
import { Roles } from '../common/role/role.decorator';

@ApiTags('Gmail')
@Controller('gmail')
@UseGuards(RoleGuard)
@ApiBearerAuth()
export class GmailGatewayController {
    constructor(private readonly gmailService: GmailGatewayService) { }

    @Get('status')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Check Gmail service status' })
    status() {
        console.log('status');
        return this.gmailService.status();
    }

    @Get('unread')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Get unread emails' })
    getUnread(@CurrentUser('id') userId: string) {
        console.log("get unread");
        return this.gmailService.getUnreadEmails(userId);
    }

    @Get('mails')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Get mail list' })
    @ApiQuery({ name: 'q', required: false })
    @ApiQuery({ name: 'pageToken', required: false })
    @ApiQuery({ name: 'maxResults', required: false })
    getMails(
        @CurrentUser('id') userId: string,
        @Query('q') q?: string,
        @Query('pageToken') pageToken?: string,
        @Query('maxResults') maxResults?: number,
    ) {
        return this.gmailService.getMailList({ userId, q, pageToken, maxResults });
    }

    @Get('mails/:messageId')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Get mail detail' })
    getMailDetail(
        @CurrentUser('id') userId: string,
        @Param('messageId') messageId: string,
    ) {
        return this.gmailService.getMailDetail({ userId, messageId });
    }

    @Post('send')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Send email' })
    sendMail(
        @CurrentUser('id') userId: string,
        @Body() dto: Omit<SendMailDto, 'userId'>
    ) {
        return this.gmailService.sendEmail({ ...dto, userId });
    }

    @Post('reply')
    @Roles(Role.ADMIN, Role.USER)
    @ApiOperation({ summary: 'Reply email' })
    replyMail(
        @CurrentUser('id') userId: string,
        @Body() dto: Omit<ReplyMailDto, 'userId'>
    ) {
        return this.gmailService.replyMail({ ...dto, userId });
    }
}
