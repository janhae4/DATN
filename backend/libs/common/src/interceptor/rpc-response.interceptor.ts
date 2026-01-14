import { CallHandler, ExecutionContext, HttpException, HttpStatus, Injectable, NestInterceptor } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class RpcResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => data),

            catchError((err) => {
                const errorPayload = err.getError();
                let status = 500
                let message = 'Internal Server Error';
                if (typeof errorPayload === 'object' && errorPayload !== null) {
                    status = (errorPayload as any).statusCode || status;
                    message = (errorPayload as any).message || message;
                } else {
                    message = errorPayload as string;
                }

                return of({
                    error: true,
                    statusCode: status,
                    message: message,
                    timestamp: new Date().toISOString(),
                });
            }),
        );
    }
}