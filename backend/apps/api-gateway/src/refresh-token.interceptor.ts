import {
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError, from, firstValueFrom } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { ClientProxy } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { ACCESS_TTL, REFRESH_TTL } from '@app/contracts/auth/jwt.constant';
import { AuthService } from './auth/auth.service';

@Injectable()
export class RefreshTokenInterceptor implements NestInterceptor {
    constructor(private readonly authService: AuthService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const req: Request = context.switchToHttp().getRequest();
        const res: Response = context.switchToHttp().getResponse();
        console.log(req.cookies.refreshToken)

        const setCookies = (accessToken: string, refreshToken: string) => {
            res.cookie('accessToken', accessToken, { httpOnly: true, secure: true, maxAge: ACCESS_TTL });
            res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: true, maxAge: REFRESH_TTL });
        };

        const clearCookies = () => {
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
        };

        return next.handle().pipe(
            catchError((err) => {
                if (err.status === 401 && req.cookies?.refreshToken) {
                    console.log('Refresh token')
                    return from(
                        firstValueFrom(
                            this.authService.refresh(req, res)
                        ).then((newTokens) => {
                            console.log(newTokens)
                            if (!newTokens?.accessToken) {
                                clearCookies();
                                throw new UnauthorizedException('Invalid refresh token');
                            }
                            setCookies(newTokens.accessToken, newTokens.refreshToken);

                            req.cookies.accessToken = newTokens.accessToken;
                            return firstValueFrom(next.handle());
                        })
                    );
                }

                return throwError(() => err);
            })
        );
    }
}
