import { Inject, Injectable } from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, map, catchError, throwError, Observable } from 'rxjs';
import {
  NOTIFICATION_CLIENT,
  REDIS_CLIENT,
  USER_CLIENT,
} from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { RefreshTokenDto } from '@app/contracts/auth/jwt.dto';
import { LoginDto } from '@app/contracts/auth/login-request.dto';
import { randomUUID } from 'crypto';
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
import { ResetPasswordDto } from '@app/contracts/auth/reset-password.dto';
import { GoogleAccountDto } from '@app/contracts/auth/account-google.dto';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,
    private jwtService: JwtService,
  ) {}

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
    const user = await firstValueFrom<UserDto>(
      this.handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_LOCAL, createAuthDto),
      ),
    );
    const verifiedCode = user.verifiedCode;
    const token = await this.jwtService.signAsync(
      { userId: user.id, verifiedCode },
      { expiresIn: 15 * 60 },
    );
    return {
      verifiedCode,
      verifiedUrl: 'http://localhost:3000/auth/verify/token?token=' + token,
    };
  }

  verifyLocal(userId: string, code: string) {
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_LOCAL, { userId, code }),
    );
  }

  async verifyLocalToken(token: string) {
    try {
      console.log(token);
      console.log(this.jwtService.decode(token));
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

  resetCode(userId: string) {
    return this.handleRpc(
      this.userClient.send(USER_PATTERNS.RESET_CODE, userId),
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

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const account = await firstValueFrom<AccountDto>(
      this.userClient.send(
        USER_PATTERNS.FIND_ONE_WITH_PASSWORD,
        resetPasswordDto.id,
      ),
    );
    if (!account) throw new NotFoundException('User not found');
    const isMatch = await bcrypt.compare(
      resetPasswordDto.oldPassword,
      account.password || '',
    );
    if (!isMatch) throw new UnauthorizedException('Invalid password');
    const isSame = await bcrypt.compare(
      resetPasswordDto.newPassword,
      account.password || '',
    );
    if (isSame)
      throw new BadRequestException('New password is the same as old password');
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
    return await firstValueFrom<UserDto>(
      this.userClient.send(USER_PATTERNS.UPDATE_PASSWORD, {
        id: account.id,
        password: hashedPassword,
      }),
    );
  }

  forgetPassword() {}

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
    return this.userClient.send(USER_PATTERNS.FIND_ONE, id);
  }
}
