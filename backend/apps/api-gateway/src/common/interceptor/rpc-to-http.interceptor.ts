import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class RpcToHttpInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((rpcError) => {
        // Kiểm tra xem lỗi có cấu trúc từ RpcException của NestJS hay không
        const isRpcException =
          typeof rpcError === 'object' && rpcError !== null && 'message' in rpcError;

        const errorMessage = isRpcException
          ? rpcError.message
          : 'An unexpected error occurred';
        
        const statusCode =
          isRpcException && typeof rpcError.status === 'number'
            ? rpcError.status
            : HttpStatus.INTERNAL_SERVER_ERROR;

        // Tạo và ném ra một HttpException chuẩn của HTTP
        return throwError(
          () =>
            new HttpException(
              {
                success: false,
                message: errorMessage,
              },
              statusCode,
            ),
        );
      }),
    );
  }
}