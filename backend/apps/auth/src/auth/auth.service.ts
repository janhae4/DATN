import { Inject, Injectable } from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, map, catchError, throwError, Observable } from 'rxjs';
import {
  NOTIFICATION_CLIENT,
  REDIS_CLIENT,
  USER_CLIENT,
  GMAIL_CLIENT,
} from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { RefreshTokenDto } from '@app/contracts/auth/jwt.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { randomInt, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { ACCESS_TTL, REFRESH_TTL } from '@app/contracts/auth/jwt.constant';
import {
  BadRequestException,
  Error,
  NotFoundException,
  UnauthorizedException,
} from '@app/contracts/errror';
import { UserDto } from '@app/contracts/user/user.dto';
import { StoredRefreshTokenDto } from '@app/contracts/redis/store-refreshtoken.dto';
import { NOTIFICATION_PATTERN } from '@app/contracts/notification/notification.pattern';
import { NotificationType } from '@app/contracts/notification/notification.enum';
import { AccountDto } from '@app/contracts/user/account.dto';
import { ChangePasswordDto } from '@app/contracts/auth/reset-password.dto';
import { GoogleAccountDto } from '@app/contracts/auth/account-google.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth.dto';
import { ForgotPasswordDto } from '@app/contracts/auth/forgot-password.dto';
import { ConfirmResetPasswordDto } from '@app/contracts/auth/confirm-reset-password.dto';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { SendEmailVerificationDto } from '@app/contracts/gmail/dto/send-email-verification.dto';
import { sendEmailResetPasswordDto } from '@app/contracts/gmail/dto/send-email-reset-password.dto';
import { StringRegexOptions } from 'joi';
import { Account } from 'apps/user/src/user/entity/account.entity';
import { User } from 'apps/user/src/user/entity/user.entity';
import { VerifyForgotTokenDto } from './dto/verify-forgot-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(NOTIFICATION_CLIENT) private readonly notificationClient: ClientProxy,
    @Inject(GMAIL_CLIENT) private readonly gmailClient: ClientProxy,
    private jwtService: JwtService,
  ) { }

  private handleRpc<T>(obs: Observable<T>): Observable<T> {
    return obs.pipe(
      catchError((err) => {
        const e = err as Error;
        const rpcError = new RpcException({
          message: e?.message || 'Internal Server Error',
          statusCode: e?.statusCode || 500,
        });
        return throwError(() => rpcError);
      }),
    );
  }

  async register(createAuthDto: CreateAuthDto) {
    const user = await firstValueFrom<User>(
      this.handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_LOCAL, createAuthDto),
      ),
    );
    const verifiedCode = user.verifiedCode;
    const token = await this.jwtService.signAsync(
      { userId: user.id, verifiedCode },
      { expiresIn: 15 * 60 },
    );
    const verifiedUrl = `${process.env.HOST_URL || 'http://localhost:3000'}/auth/verify/token?token=${token}`

    this.gmailClient.emit(GMAIL_PATTERNS.SEND_EMAIL_REGISTER, user);
    this.gmailClient.emit(GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL, {
      user,
      code: verifiedCode,
      verificationUrl: verifiedUrl
    } as SendEmailVerificationDto)

    return {
      verifiedCode,
      verifiedUrl,
    };
  }

  verifyLocal(userId: string, code: string) {
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_LOCAL, { userId, code }),
    );
  }

  async verifyLocalToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync<VerifyTokenDto>(token);
      if (!payload) throw new UnauthorizedException('Invalid token');
      return this.handleRpc(
        this.userClient.send(USER_PATTERNS.VERIFY_LOCAL, {
          userId: payload.userId,
          code: payload.verifiedCode,
        }),
      );
    } catch (error) {
      if (error instanceof JsonWebTokenError)
        throw new UnauthorizedException('Invalid token');
      throw error;
    }
  }

  async verifyForgotPassword(userId: string, code: string, password: string) {
    return this.handleRpc(this.userClient.send(USER_PATTERNS.VERIFY_FORGET_PASSWORD, {
      userId,
      code,
      password
    }))
  }

  async verifyForgotPasswordToken(token: string, password: string) {
    try {
      const payload = await this.jwtService.verifyAsync<VerifyForgotTokenDto>(token);
      if (!payload) throw new UnauthorizedException('Invalid token');
      return this.handleRpc(
        this.userClient.send(USER_PATTERNS.VERIFY_FORGET_PASSWORD, {
          userId: payload.userId,
          code: payload.resetCode,
          password
        }),
      );
    } catch (error) {
      if (error instanceof JsonWebTokenError)
        throw new UnauthorizedException('Invalid token');
      throw error;
    }
  }

  resetCode(userId: string) {
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.RESET_CODE, { userId, typeCode: 'reset' }),
    );
  }

  resetVerificationCode(userId: string) {
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.RESET_CODE, { userId, typeCode: 'verify' }),
    );
  }

  private async generateTokensAndSession(user: UserDto) {
    const sessionId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id: user.id, role: user.role },
        { expiresIn: ACCESS_TTL },
      ),
      this.jwtService.signAsync(
        { id: user.id, sessionId, role: user.role },
        { expiresIn: REFRESH_TTL },
      ),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    this.redisClient.emit(REDIS_PATTERN.STORE_REFRESH_TOKEN, {
      userId: user.id,
      sessionId,
      hashedRefresh,
      exp: REFRESH_TTL,
    });

    this.userClient.emit(USER_PATTERNS.UPDATE, {
      id: user.id,
      updateUser: {
        isActive: true,
        lastLogin: new Date(),
      },
    });

    this.notificationClient.emit(NOTIFICATION_PATTERN.SEND, {
      userId: user.id,
      title: 'Login Notification',
      message: 'Logged in successfully',
      type: NotificationType.SYSTEM,
    });

    this.gmailClient.emit(GMAIL_PATTERNS.SEND_LOGIN_EMAIL, user);

    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto) {
    const user = await firstValueFrom<UserDto>(
      this.userClient.send(USER_PATTERNS.VALIDATE, loginDto),
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return await this.generateTokensAndSession(user);
  }

  private async handleLinking(data: GoogleAccountDto, account: AccountDto) {
    const {
      accessToken,
      refreshToken,
      provider,
      providerId,
      email,
      name,
      avatar,
      linkedUser,
    } = data;

    const user = await this.verifyToken(linkedUser ?? '');
    if (!user) {
      throw new UnauthorizedException(
        'You must be logged in to link a provider',
      );
    }

    if (account) {
      throw new BadRequestException('Google account already linked');
    }

    const currentUser = await firstValueFrom<UserDto>(
      this.userClient.send(USER_PATTERNS.FIND_ONE, user.id),
    );

    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: user.id,
      accessToken,
      refreshToken,
    });

    await firstValueFrom(
      this.handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_ACCOUNT, {
          providerId,
          provider,
          name,
          avatar,
          email,
          user: currentUser,
        } as Partial<AccountDto>),
      ),
    );

    return { message: 'Google account linked successfully' };
  }

  private async handleLoginGoogle(data: GoogleAccountDto, account: AccountDto) {
    const { accessToken, refreshToken } = data;

    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: account.user.id,
      accessToken,
      refreshToken,
    });

    return await this.generateTokensAndSession(account.user);
  }

  private async handleRegisterGoogle(data: GoogleAccountDto) {
    const {
      accessToken,
      refreshToken,
      provider,
      providerId,
      email,
      name,
      avatar,
    } = data;

    const user = await firstValueFrom<UserDto>(
      this.handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_OAUTH, {
          provider,
          providerId,
          name,
          email,
          avatar,
        } as CreateAuthOAuthDto),
      ),
    );

    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: user.id,
      accessToken,
      refreshToken,
    });

    return await this.generateTokensAndSession(user);
  }

  async handleGoogleCallback(data: GoogleAccountDto) {
    if (!data.email) {
      throw new BadRequestException('Google account missing email');
    }

    const account = await firstValueFrom<AccountDto>(
      this.userClient.send(USER_PATTERNS.FIND_ONE_OAUTH, {
        provider: data.provider,
        providerId: data.providerId,
      }),
    );

    if (data.isLinking && data.linkedUser)
      return await this.handleLinking(data, account);

    if (account) return await this.handleLoginGoogle(data, account);

    return await this.handleRegisterGoogle(data);
  }

  getInfo(id: string) {
    return this.userClient.send(USER_PATTERNS.FIND_ONE, id);
  }

  async refresh(token: string) {
    const payload = await this.verifyToken(token);
    const stored = await firstValueFrom(
      this.redisClient
        .send(REDIS_PATTERN.GET_STORED_REFRESH_TOKEN, {
          userId: payload.id,
          sessionId: payload.sessionId,
        })
        .pipe(map((s) => s as StoredRefreshTokenDto)),
    );
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    const matches = await bcrypt.compare(token, stored.token);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');

    const lockKey = await firstValueFrom(
      this.redisClient
        .send(REDIS_PATTERN.SET_LOCK_KEY, {
          userId: payload.id,
          sessionId: payload.sessionId,
        })
        .pipe(map((l) => l as string)),
    );
    if (!lockKey)
      throw new RpcException({
        status: 429,
        error: 'Too many requests',
        message: 'Refresh in progress',
      });

    const sessionId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id: payload.id, role: payload.role },
        { expiresIn: ACCESS_TTL },
      ),
      this.jwtService.signAsync(
        { id: payload.id, sessionId: sessionId, role: payload.role },
        { expiresIn: REFRESH_TTL },
      ),
    ]);

    this.redisClient.emit(REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
      userId: payload.id,
      sessionId: payload.sessionId,
    });
    this.redisClient.emit(REDIS_PATTERN.STORE_REFRESH_TOKEN, {
      userId: payload.id,
      sessionId: sessionId,
      hashedRefresh: await bcrypt.hash(refreshToken, 10),
      exp: REFRESH_TTL,
    });

    return { accessToken, refreshToken };
  }

  async changePassword(changePasswordDto: ChangePasswordDto) {
    const account = await firstValueFrom<AccountDto>(
      this.userClient.send(
        USER_PATTERNS.FIND_ONE_WITH_PASSWORD,
        changePasswordDto.id,
      ),
    );
    if (!account) throw new NotFoundException('User not found');
    const isMatch = await bcrypt.compare(
      changePasswordDto.oldPassword,
      account.password || '',
    );
    if (!isMatch) throw new UnauthorizedException('Invalid password');
    const isSame = await bcrypt.compare(
      changePasswordDto.newPassword,
      account.password || '',
    );
    if (isSame)
      throw new BadRequestException('New password is the same as old password');
    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);
    return await firstValueFrom<UserDto>(
      this.userClient.send(USER_PATTERNS.UPDATE_PASSWORD, {
        id: account.id,
        password: hashedPassword,
      }),
    );
  }

  async forgetPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const payload = await firstValueFrom<{user: User, resetCode: string, expiredCode: Date}>(
        this.handleRpc(this.userClient.send(USER_PATTERNS.RESET_PASSWORD, forgotPasswordDto.email)),
      )

      if (!payload.user) {
        throw new NotFoundException('Account not found');
      }

      const {user, resetCode, expiredCode } = payload
      const token = await this.jwtService.signAsync(
        { userId: payload.user.id, resetCode, expiredCode },
        { expiresIn: 15 * 60 }
      );

      const resetUrl = `${process.env.HOST_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

      this.gmailClient.send(GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL, {
        user, code: resetCode, resetUrl
      } as sendEmailResetPasswordDto);

      return {
        resetUrl,
        resetCode,
      };
    } catch (error) {
      console.error('Failed to process forgot password:', error);
      throw error;
    }
  }

  logoutAll(userId: string) {
    return this.redisClient.send(REDIS_PATTERN.CLEAR_REFRESH_TOKENS, {
      userId,
    });
  }

  async logout(token: string) {
    const payload: RefreshTokenDto = await this.jwtService.verifyAsync(token);
    const { id: userId, sessionId } = payload;
    this.redisClient.emit(REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
      userId,
      sessionId,
    });
  }

  async verifyToken(token: string): Promise<RefreshTokenDto> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  findUserById(id: string) {
    return this.handleRpc(this.userClient.send(USER_PATTERNS.FIND_ONE, id));
  }
}
