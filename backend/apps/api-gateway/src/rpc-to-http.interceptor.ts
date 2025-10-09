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
        // Kiểm tra xem lỗi có cấu trúc chuẩn của NestJS HttpException không
        if (err.status && err.message) {
          return throwError(() => new HttpException(err.message, err.status));
        }
        
        // Kiểm tra xem lỗi có cấu trúc `{ response: { statusCode, message } }` không
        if (err.response && err.response.statusCode) {
          return throwError(
            () => new HttpException(err.response.message, err.response.statusCode),
          );
        }

        // Nếu là một lỗi không xác định, trả về lỗi 500 Internal Server Error
        return throwError(
          () =>
            new HttpException(
              err.message || 'Internal server error',
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
        );
        // ===============================================================
      }),
    );
  }
}