import { SendMailDto } from '@app/contracts/gmail/send-mail.dto';
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { GmailService } from './gmail.service';

@Controller('gmail')
export class GmailController {
  constructor(private readonly gmailService: GmailService) {}

  @Get('unread/:id')
  async getUnreadEmails(@Param('id') id: string): Promise<any> {
    return await this.gmailService.getUnreadEmails(id);
  }

  @Post('send/:id')
  async sendEmail(
    @Param('id') userId: string,
    @Body() body: Omit<SendMailDto, 'userId'>,
  ): Promise<any> {
    const payload: SendMailDto = {
      userId: userId,
      to: body.to,
      subject: body.subject,
      messageText: body.messageText,
    };

    return this.gmailService.sendEmail(payload);
  }
}
