import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { ACCESS_TTL, REFRESH_TTL } from '@app/contracts/auth/jwt.constant';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { AUTH_CLIENT } from '@app/contracts/constants';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { catchError, firstValueFrom, tap, throwError } from 'rxjs';
import { UserService } from '../user/user.service';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { Provider } from '@app/contracts/user/user.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    private readonly userService: UserService,
  ) {}

  private setCookies(
    accessToken: string,
    refreshToken: string,
    response: Response,
  ) {
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
  }

  private clearCookies(response: Response) {
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');
  }

  findAllUser() {
    this.userService.findAll();
  }

  register(createAuthDto: CreateAuthDto) {
    return this.authClient.send(AUTH_PATTERN.REGISTER, createAuthDto);
  }

  async login(loginDto: LoginDto, response: Response) {
    try {
      const token = await firstValueFrom<LoginResponseDto>(
        this.authClient.send(AUTH_PATTERN.LOGIN, loginDto),
      );

      const { accessToken, refreshToken } = token;

      console.log(accessToken, refreshToken);
      this.setCookies(accessToken, refreshToken, response);

      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Login failed:', error);
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.refreshToken as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');
    return this.authClient.send(AUTH_PATTERN.REFRESH, refreshToken).pipe(
      tap((token: LoginResponseDto) => {
        this.setCookies(token.accessToken, token.refreshToken, response);
      }),
      catchError(() => {
        this.clearCookies(response);
        return throwError(
          () => new UnauthorizedException('Invalid refresh token'),
        );
      }),
    );
  }

  logout(request: Request, response: Response) {
    this.clearCookies(response);
    const refreshToken = request.cookies.refreshToken as string | undefined;
    this.authClient.emit(AUTH_PATTERN.LOGOUT, refreshToken);
  }

  logoutAll(request: Request, response: Response) {
    const refreshToken = request.cookies.refreshToken as string | undefined;
    this.clearCookies(response);
    this.authClient.emit(AUTH_PATTERN.LOGOUT_ALL, refreshToken);
  }

  validateToken(token: string) {
    return this.authClient.send(AUTH_PATTERN.VALIDATE_TOKEN, token);
  }

  handleGoogleCallback(request: Request) {
    const userCreate: CreateAuthOAuthDto = {
      ...request.user,
      provider: Provider.GOOGLE,
    }
    return this.authClient.send(AUTH_PATTERN.GOOGLE_CALLBACK, userCreate);
  }
}
