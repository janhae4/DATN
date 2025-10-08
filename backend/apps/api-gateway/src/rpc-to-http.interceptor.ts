import { Error } from '@app/contracts/errror';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, catchError } from 'rxjs';

@Injectable()
export class RpcToHttpInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error: Error) => {
        if (error?.status) {
          throw new HttpException(
            { success: false, message: error.message },
            error.status,
          );
        }
        throw new HttpException(
          { success: false, message: 'Internal server error' },
          500,
        );
      }),
    );
  }
}
