import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices'; // Cần import cái này
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class RpcResponseInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map((data) => data),
            catchError((err) => {
                console.error('Error caught in RPC Interceptor:', err);

                let status = 500;
                let message = 'Internal Server Error';

                if (err instanceof RpcException) {
                    const errorPayload = err.getError();
                    if (typeof errorPayload === 'object' && errorPayload !== null) {
                        status = (errorPayload as any).statusCode || (errorPayload as any).status || 500;
                        message = (errorPayload as any).message || message;
                    } else {
                        message = errorPayload as string;
                    }
                }
                else if (err instanceof HttpException) {
                    status = err.getStatus();
                    const response = err.getResponse();
                    message = (typeof response === 'object' && (response as any).message)
                        ? (response as any).message
                        : response;
                }

                else if (err instanceof Error) {
                    message = err.message;
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