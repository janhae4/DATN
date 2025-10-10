import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EMAIL_PATTERNS } from '@app/contracts/email/email.patterns';

@Injectable()
export class EmailsService {
  constructor(@Inject('EMAIL_SERVICE') private readonly client: ClientProxy) {}

  fetchUnread() {
    return this.client.send(EMAIL_PATTERNS.FETCH_UNREAD, {});
  }
}
