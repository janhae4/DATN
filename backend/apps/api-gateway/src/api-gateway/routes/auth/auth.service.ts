import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { ACCESS_TTL, REFRESH_TTL } from '@app/contracts/auth/jwt.constant';
import { LoginResponseDto } from '@app/contracts/auth/login-reponse.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { AUTH_CLIENT, USER_CLIENT } from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import type { Request, Response } from 'express';
import { catchError, tap, throwError } from 'rxjs';
import { UserService } from '../user/user.service';
import { ChangePasswordDto } from '@app/contracts/auth/reset-password.dto';
import { GoogleAccountDto } from '@app/contracts/auth/account-google.dto';
import { ForgotPasswordDto } from '@app/contracts/auth/forgot-password.dto';
import { ConfirmResetPasswordDto } from '@app/contracts/auth/confirm-reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    private readonly userService: UserService,
  ) { }

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

  verifyLocal(userId: string, code: string) {
    return this.authClient.send(AUTH_PATTERN.VERIFY_LOCAL, { userId, code });
  }

  verifyForgetPasswordCode(userId: string, code: string, password: string) {
    return this.authClient.send(AUTH_PATTERN.VERIFY_FORGOT_PASSWORD, {
      userId,
      code,
      password
    });
  }

  verifyForgetPasswordToken(token: string, password: string) {
    return this.authClient.send(AUTH_PATTERN.VERIFY_FORGOT_PASSWORD_TOKEN, {token, password});
  }

  verifyToken(token: string) {
    return this.authClient.send(AUTH_PATTERN.VERIFY_LOCAL_TOKEN, token);
  }

  resetCode(userId: string) {
    return this.authClient.send(AUTH_PATTERN.RESET_CODE, userId);
  }

  resetVerificationCode(userId: string) {
    return this.authClient.send(AUTH_PATTERN.RESET_VERIFICATION_CODE, userId);
  }

  changePassword(changePasswordDto: ChangePasswordDto) {
    return this.authClient.send(AUTH_PATTERN.CHANGE_PASSWORD, changePasswordDto);
  }

  login(loginDto: LoginDto, response: Response) {
    return this.authClient.send(AUTH_PATTERN.LOGIN, loginDto).pipe(
      tap((token: LoginResponseDto) => {
        this.setCookies(token.accessToken, token.refreshToken, response);
        return {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        };
      }),
      catchError(() => {
        return throwError(
          () => new UnauthorizedException('Invalid credentials'),
        );
      }),
    );
  }

  getInfo(id: string) {
    return this.userService.findOne(id);
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

  handleGoogleCallback(user: GoogleAccountDto) {
    return this.authClient.send(AUTH_PATTERN.GOOGLE_CALLBACK, user);
  }

  forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    return this.authClient.send(
      AUTH_PATTERN.FORGET_PASSWORD,
      forgotPasswordDto,
    );
  }

  forgotPasswordConfirm(confirmResetPasswordDto: ConfirmResetPasswordDto) {
    return this.authClient.send(
      AUTH_PATTERN.RESET_PASSWORD_CONFIRM,
      confirmResetPasswordDto,
    );
  }

  verifyEmail(token: string) {
    return this.userClient.send(USER_PATTERNS.VERIFY_EMAIL, token);
  }
}
