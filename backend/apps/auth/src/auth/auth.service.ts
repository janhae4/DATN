import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JsonWebTokenError, JwtOptionsFactory, JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, map, catchError, throwError, Observable, tap } from 'rxjs';
import {
  NOTIFICATION_CLIENT,
  REDIS_CLIENT,
  USER_CLIENT,
  GMAIL_CLIENT,
} from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { JwtDto, RefreshTokenDto } from '@app/contracts/auth/jwt.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { randomInt, randomUUID, Verify } from 'crypto';
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
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { User } from 'apps/user/src/user/entity/user.entity';
import { ResetCodeDto } from './dto/reset-code.dto';
import { SendEmailVerificationDto } from '@app/contracts/gmail/dto/send-email.dto';
import { Account } from 'apps/user/src/user/entity/account.entity';

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
      catchError((err: any) => {
        const rpcError = new RpcException({
          message: err?.message || 'Internal Server Error',
          statusCode: err?.statusCode || HttpStatus.INTERNAL_SERVER_ERROR,
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
    this.gmailClient.emit(GMAIL_PATTERNS.SEND_EMAIL_REGISTER, user);
    const { code, url } = await this.generateAndSendCode(
      user.verifiedCode ?? "",
      user.expiredCode ?? new Date(),
      'verify',
      GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
      user
    );
    return {
      verifiedCode: code,
      verifiedUrl: url,
    };
  }

  verifyLocal(userId: string, code: string) {
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_LOCAL, { userId, code }),
    );
  }

  async verifyLocalToken(token: string) {
    const payload = await this.verifyToken<VerifyTokenDto>(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    const { userId, code } = payload
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_LOCAL, { userId, code }),
    );
  }

  async verifyForgotPassword(userId: string, code: string, password: string) {
    return this.handleRpc(this.userClient.send(USER_PATTERNS.VERIFY_FORGET_PASSWORD, {
      userId,
      code,
      password
    }))
  }

  async verifyForgotPasswordToken(token: string, password: string) {
    const payload = await this.verifyToken<VerifyTokenDto>(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_FORGET_PASSWORD, {
        userId: payload.userId,
        code: payload.code,
        password
      }),
    );
  }

  private async generateAndSendCode(
    code: string,
    expiredCode: Date,
    typeCode: 'verify' | 'reset',
    pattern: string,
    user: User,
  ): Promise<{ code: string, url: string }> {
    const tokenPayload = {
      userId: user.id,
      code,
      expiredCode
    };

    const token = await this.jwtService.signAsync(
      tokenPayload as any,
      { expiresIn: 15 * 60 },
    );

    const urlSegment = typeCode === 'reset' ? 'reset/password' : 'verify/token';
    const url = `${process.env.HOST_URL || 'http://localhost:3000'}/auth/${urlSegment}?token=${token}`;

    const emailPayload = {
      user,
      code,
      url,
    } as SendEmailVerificationDto;
    this.gmailClient.emit(pattern, emailPayload);

    return { code, url };
  }

  async resetCode(id: string) {
    const payload = await firstValueFrom<ResetCodeDto>(
      this.handleRpc(
        this.userClient.send(USER_PATTERNS.RESET_CODE, id),
      ),
    );

    const { code, url } = await this.generateAndSendCode(
      payload.code,
      payload.expiredCode,
      'reset',
      GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
      payload.user
    );

    return {
      resetUrl: url,
      resetCode: code,
    };
  }

  async resetVerificationCode(userId: string) {
    const payload = await firstValueFrom<ResetCodeDto>(
      this.handleRpc(
        this.userClient.send(USER_PATTERNS.RESET_CODE, userId),
      ),
    );
    const { code, url } = await this.generateAndSendCode(
      payload.code,
      payload.expiredCode,
      'verify',
      GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
      payload.user
    );

    return {
      verificationUrl: url,
      verificationCode: code,
    };
  }


  private async generateTokensAndSession(payload: JwtDto | null = null, user: User | null = null, isRefresh = false) {
    const sessionId = randomUUID();
    const id = payload?.id ?? user?.id;
    const role = payload?.role ?? user?.role;
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id, role },
        { expiresIn: ACCESS_TTL },
      ),
      this.jwtService.signAsync(
        { id, sessionId, role },
        { expiresIn: REFRESH_TTL },
      ),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    if (isRefresh) {
      this.redisClient.emit(REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
        userId: id,
        sessionId,
      });
    }

    this.redisClient.emit(REDIS_PATTERN.STORE_REFRESH_TOKEN, {
      userId: id,
      sessionId,
      hashedRefresh,
      exp: REFRESH_TTL,
    });

    if (!isRefresh) {
      this.userClient.emit(USER_PATTERNS.UPDATE, {
        id,
        updateUser: {
          isActive: true,
          lastLogin: new Date(),
        },
      });

      this.notificationClient.emit(NOTIFICATION_PATTERN.SEND, {
        userId: id,
        title: 'Login Notification',
        message: 'Logged in successfully',
        type: NotificationType.SYSTEM,
      });

      this.gmailClient.emit(GMAIL_PATTERNS.SEND_LOGIN_EMAIL, user);
    }
    return { accessToken, refreshToken };
  }

  async login(loginDto: LoginDto) {
    const user = await firstValueFrom<User>(
      this.userClient.send(USER_PATTERNS.VALIDATE, loginDto),
    );
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return await this.generateTokensAndSession(null, user);
  }

  private async handleLinking(data: GoogleAccountDto, account: Account) {
    const { accessToken, refreshToken, provider, providerId, email, name, avatar, linkedUser } = data;

    const user = await this.verifyToken<JwtDto>(linkedUser ?? '');
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

  private async handleLoginGoogle(data: GoogleAccountDto, account: Account) {
    const { accessToken, refreshToken } = data;

    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: account.user.id,
      accessToken,
      refreshToken,
    });

    return await this.generateTokensAndSession(null, account.user, true);
  }

  private async handleRegisterGoogle(data: GoogleAccountDto) {
    const { accessToken, refreshToken, provider, providerId, email, name, avatar } = data;

    const user = await firstValueFrom<User>(
      this.handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_OAUTH, {
          provider, providerId, name, email, avatar,
        } as CreateAuthOAuthDto),
      ),
    );

    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN,
      { userId: user.id, accessToken, refreshToken });

    return await this.generateTokensAndSession(null, user, true);
  }

  async handleGoogleCallback(data: GoogleAccountDto) {
    if (!data.email) {
      throw new BadRequestException('Google account missing email');
    }

    const account = await firstValueFrom<Account>(
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
    const payload = await this.verifyToken<RefreshTokenDto>(token);
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

    return await this.generateTokensAndSession({ id: payload.id, role: payload.role } as JwtDto, null, true);
  }

  changePassword(changePasswordDto: ChangePasswordDto) {
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.UPDATE_PASSWORD, changePasswordDto).pipe(
        tap((user: User) => {
          console.log(user)
          this.gmailClient.emit(GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE, user);
        }),
        map(() => ({ message: 'Password changed successfully' })),
      ),    
    )
  }

  async forgetPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      const payload = await firstValueFrom<{ user: User, resetCode: string, expiredCode: Date }>(
        this.handleRpc(this.userClient.send(USER_PATTERNS.RESET_PASSWORD, forgotPasswordDto.email)),
      )

      if (!payload.user) {
        throw new NotFoundException('Account not found');
      }

      const { user, resetCode, expiredCode } = payload
      const { code, url } = await this.generateAndSendCode(
        resetCode,
        expiredCode,
        'reset',
        GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
        user
      )
      return {
        resetUrl: url,
        resetCode: code,
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

  async verifyToken<T extends object>(token: string): Promise<T> {
    try {
      return await this.jwtService.verifyAsync<T>(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }

  findUserById(id: string) {
    return this.handleRpc(this.userClient.send(USER_PATTERNS.FIND_ONE, id));
  }
}
