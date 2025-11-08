import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(

      map((data) => {
        if (data?.error) {
          throw new HttpException(data.message || 'Unknown Error', data.statusCode || 500);
        }
        return data
      }),

      catchError((err) => {
        return throwError(() => err);
      })

    );
  }
}
