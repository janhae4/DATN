import { Controller, Get } from '@nestjs/common';

@Controller('emails')
export class EmailsController {

  @Get('unread')
  fetchUnread() {

  }
}
