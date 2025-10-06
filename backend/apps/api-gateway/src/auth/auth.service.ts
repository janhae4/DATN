import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { ACCESS_TTL, REFRESH_TTL } from '@app/contracts/auth/jwt.constant';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { AUTH_CLIENT } from '@app/contracts/constants';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';
import { UserService } from '../user/user.service';

const setCookie = (
  accessToken: string,
  refreshToken: string,
  response: Response,
) => {
  response.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: true,
    maxAge: ACCESS_TTL,
  });
  response.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    maxAge: REFRESH_TTL,
  });
};

const clearCookie = (response: Response) => {
  response.clearCookie('accessToken');
  response.clearCookie('refreshToken');
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    private readonly userService: UserService,
  ) {}

  findAllUser() {
    this.userService.findAll();
  }

  register(createAuthDto: CreateAuthDto) {
    return this.authClient.send(AUTH_PATTERN.REGISTER, createAuthDto).pipe(
      catchError((error) => {
        const status =
          (error as { status?: number }).status ??
          HttpStatus.INTERNAL_SERVER_ERROR;
        const message = (error as { error?: string }).error ?? 'Unknown error';

        return throwError(() => new HttpException(message, status));
      }),
    );
  }

  login(loginDto: LoginDto, response: Response) {
    this.authClient.send(AUTH_PATTERN.LOGIN, { ...loginDto }).pipe(
      tap((token: LoginResponseDto) => {
        const { accessToken, refreshToken } = token;
        setCookie(token.accessToken, token.refreshToken, response);
        return { accessToken, refreshToken };
      }),
      catchError(() => {
        return throwError(
          () => new UnauthorizedException('Invalid credentials'),
        );
      }),
    );
  }

  refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.refreshToken as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');
    return this.authClient.send(AUTH_PATTERN.REFRESH, refreshToken).pipe(
      tap((token: LoginResponseDto) => {
        setCookie(token.accessToken, token.refreshToken, response);
      }),
      catchError(() => {
        clearCookie(response);
        return throwError(
          () => new UnauthorizedException('Invalid refresh token'),
        );
      }),
    );
  }

  logout(request: Request, response: Response) {
    clearCookie(response);
    const refreshToken = request.cookies.refreshToken as string | undefined;
    this.authClient.emit(AUTH_PATTERN.LOGOUT, refreshToken);
  }

  logoutAll(request: Request, response: Response) {
    const refreshToken = request.cookies.refreshToken as string | undefined;
    clearCookie(response);
    this.authClient.emit(AUTH_PATTERN.LOGOUT_ALL, refreshToken);
  }

  validateToken(token: string) {
    return this.authClient.send(AUTH_PATTERN.VALIDATE_TOKEN, token);
  }

  handleGoogleCallback(request: Request) {
    const user = request.user;
    return this.authClient.send(AUTH_PATTERN.GOOGLE_CALLBACK, user);
  }
}
