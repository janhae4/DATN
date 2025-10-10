import { JwtAuthGuard } from '@app/contracts/auth/jwt/jwt-auth.guard';
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { Controller, Get, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(
    private readonly gmailService: GmailService,
  ) { }

  @Get('unread/:id')
  // @UseGuards(JwtAuthGuard)
  async getUnreadEmails(@Param('id') id: string) {
    return await this.gmailService.getUnreadEmails(id);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendEmail(
    @Req() req,
    @Body() body: Omit<SendMailDto, 'userId'>,
  ) {
    const userId = req.user.id;
    return await this.gmailService.sendEmail(userId, body.to ?? "", body.subject, body.messageText);
  }
}