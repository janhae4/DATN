import { JwtAuthGuard } from '@app/contracts/auth/jwt/jwt-auth.guard';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { Controller, Get, Post, Body, Inject, UseGuards, Req } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller('gmail')
export class GmailController {
  constructor(
    @Inject('GMAIL_SERVICE') private readonly gmailClient: ClientProxy,
  ) {}

  @Get('unread')
  @UseGuards(JwtAuthGuard) 
  async getUnreadEmails(@Req() req) {
    const userId = req.user.id; 
    return await firstValueFrom(
      this.gmailClient.send(GMAIL_PATTERNS.GET_UNREAD_MAILS, { userId }),
    );
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendEmail(
    @Req() req,
    @Body() body: Omit<SendMailDto, 'userId'>,
  ) {
    const userId = req.user.id;
    const payload: SendMailDto = { userId, ...body };
    return await firstValueFrom(
      this.gmailClient.send(GMAIL_PATTERNS.SEND_MAIL, payload),
    );
  }
}