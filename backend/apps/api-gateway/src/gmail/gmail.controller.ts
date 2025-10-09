import { JwtAuthGuard } from '@app/contracts/auth/jwt/jwt-auth.guard';
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(
    private readonly gmailService: GmailService,
  ) { }

  @Get('unread')
  @UseGuards(JwtAuthGuard)
  async getUnreadEmails(@Req() req) {
    return this.gmailService.getUnreadEmails(req.user.id);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendEmail(
    @Req() req,
    @Body() body: Omit<SendMailDto, 'userId'>,
  ) {
    const userId = req.user.id;
    return await firstValueFrom(
      this.gmailService.sendEmail(userId, body.to, body.subject, body.messageText),
    );
  }
}