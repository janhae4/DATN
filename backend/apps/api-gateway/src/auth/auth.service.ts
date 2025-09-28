import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { ACCESS_TTL, REFRESH_TTL } from '@app/contracts/auth/jwt.constant';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { AUTH_CLIENT, USER_CLIENT } from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { HttpException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { firstValueFrom } from 'rxjs';
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
    private readonly userService: UserService
  ) { }

  findAllUser() {
    this.userService.findAll();
  }

  async register(createAuthDto: CreateAuthDto) {
    try {
      await firstValueFrom(this.authClient.send(AUTH_PATTERN.REGISTER, createAuthDto));
    } catch (error) {
      throw new HttpException(error, error.status);
    }
  }

  async login(loginDto: LoginDto, response: Response) {
    const { accessToken, refreshToken } =
      await firstValueFrom<LoginResponseDto>(
        this.authClient.send(AUTH_PATTERN.LOGIN, { ...loginDto }),
      );
    setCookie(accessToken, refreshToken, response);
    return { accessToken, refreshToken };
  }

  async refresh(request: Request, response: Response) {
    const refreshToken = request.cookies?.refreshToken as string | undefined;
    if (!refreshToken) throw new UnauthorizedException('Invalid refresh token');
    try {
      const token = await firstValueFrom<LoginResponseDto>(
        this.authClient.send(AUTH_PATTERN.REFRESH, refreshToken),
      );
      setCookie(token.accessToken, token.refreshToken, response);
    } catch {
      clearCookie(response);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  logout(request: Request, response: Response) {
    clearCookie(response);
    const refreshToken = request.cookies.refreshToken as string | undefined;
    return this.authClient.send(AUTH_PATTERN.LOGOUT, refreshToken);
  }

  logoutAll(request: Request, response: Response) {
    const refreshToken = request.cookies.refreshToken as string | undefined;
    clearCookie(response);
    return this.authClient.send(AUTH_PATTERN.LOGOUT_ALL, refreshToken);
  }

  validateToken(token: string) {
    return this.authClient.send(AUTH_PATTERN.VALIDATE_TOKEN, token);
  }
}
