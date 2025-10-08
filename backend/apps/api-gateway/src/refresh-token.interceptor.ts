import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError, from, firstValueFrom } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuthService } from './auth/auth.service';
import { Error } from '@app/contracts/errror';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((err: Error) => {
        if (err.status === 401 && req.cookies?.refreshToken) {
          return from(
            firstValueFrom(this.authService.refresh(req, res)).then(() => {
              return firstValueFrom(next.handle());
            }),
          );
        }

        return throwError(() => new UnauthorizedException('Unauthorized'));
      }),
    );
  }
}
