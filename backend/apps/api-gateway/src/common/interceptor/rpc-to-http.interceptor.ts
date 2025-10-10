import { Error } from '@app/contracts/errror';
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';
@Injectable()
export class RpcToHttpInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err) => {
        const e =
          typeof err === 'object' && err !== null && 'error' in err
            ? (err as { error: Error }).error
            : (err as Error);
        throw new HttpException(
          {
            success: false,
            message: e.message || 'Internal server error',
          },
          e.statusCode || 500,
        );
      }),
    );
  }
}