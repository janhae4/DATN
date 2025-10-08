import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError, from, firstValueFrom } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { AuthService } from './auth/auth.service';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { Error } from '@app/contracts/errror';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
  constructor(private readonly authService: AuthService) { }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: Request = context.switchToHttp().getRequest();
    const res: Response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      catchError((err: any) => {
        const error = err.error as Error;

        if (error.status === 401 && req.cookies?.refreshToken) {
          return this.authService.refresh(req, res).pipe(
            switchMap((token: LoginResponseDto) => {
              req.cookies.accessToken = token.accessToken;
              req.cookies.refreshToken = token.refreshToken;
              return next.handle();
            }),
            catchError((e) => { console.error(e); return throwError(() => e) }),
          );
        }

        if (error.status && error.message) {
          return throwError(() => new HttpException(error.message, error.status));
        }

        return throwError(() => new BadRequestException('Unexpected error'));
      }),
    );

  }
}
