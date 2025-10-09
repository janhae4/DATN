import { Controller, Get } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { map } from 'rxjs/operators';

@Controller('emails')
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Get('unread')
  fetchUnread() {
    return this.emailsService.fetchUnread().pipe(
      map((emails) => ({ emails })),
    );
  }
}
