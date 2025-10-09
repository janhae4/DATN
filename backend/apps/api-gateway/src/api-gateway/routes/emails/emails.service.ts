import { GatewayTimeoutException, Inject, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EMAIL_PATTERNS } from '@app/contracts/email/email.patterns';
import { catchError, timeout } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class EmailsService {
  constructor(
    @Inject('EMAIL_SERVICE') private readonly client: ClientProxy,
  ) {}

  fetchUnread() {
    return this.client
      .send(EMAIL_PATTERNS.FETCH_UNREAD, {})
      .pipe(
        timeout(8000),
        catchError((err) => {
          if (err?.name === 'TimeoutError') {
            return throwError(() => new GatewayTimeoutException('Email service timeout'));
          }
          return throwError(() => new ServiceUnavailableException('Email service unavailable'));
        }),
      );
  }
}
