import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable()
export class RpcToHttpInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Nếu là RPC error
        if (error?.status) {
          console.log('RPC Error intercepted:', error);
          throw new HttpException(
            { success: false, message: error.message },
            error.status,
          );
        }
        // fallback cho lỗi khác
        throw new HttpException(
          { success: false, message: 'Internal server error' },
          500,
        );
      }),
    );
  }
}
