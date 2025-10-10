import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, map, catchError } from 'rxjs';
import {
  NOTIFICATION_CLIENT,
  REDIS_CLIENT,
  USER_CLIENT,
  GMAIL_CLIENT,
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
  UnauthorizedException,
} from '@app/contracts/errror';
import { UserDto } from '@app/contracts/user/user.dto';
import { StoredRefreshTokenDto } from '@app/contracts/redis/store-refreshtoken.dto';
import { NOTIFICATION_PATTERN } from '@app/contracts/notification/notification.pattern';
import { NotificationType } from '@app/contracts/notification/notification.enum';
import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { AccountDto } from '@app/contracts/user/account.dto';
import { ResetPasswordDto } from '@app/contracts/auth/reset-password.dto';
import { GMAIL_PATTERNS } from '@app/contracts/gmail/gmail.patterns';
import { ForgotPasswordDto } from '@app/contracts/auth/forgot-password.dto';
import { ConfirmResetPasswordDto } from '@app/contracts/auth/confirm-reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationClient: ClientProxy,
    @Inject(GMAIL_CLIENT) private readonly gmailClient: ClientProxy,
    private jwtService: JwtService,
  ) { }

  mapper(user: UserDto) {
    return {
      id: user.id,
      role: user.role,
    };
  }

  register(createAuthDto: CreateAuthDto) {
    return this.userClient.send(USER_PATTERNS.CREATE_LOCAL, createAuthDto);
  }

  async login(loginDto: LoginDto) {
    const user = await firstValueFrom(
      this.userClient
        .send(USER_PATTERNS.VALIDATE, loginDto)
        .pipe(map((u: UserDto) => this.mapper(u))),
    );
    console.log('User: ', user);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const sessionId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { id: user.id, role: user.role },
        { expiresIn: ACCESS_TTL },
      ),
      this.jwtService.signAsync(
        { id: user.id, sessionId: sessionId, role: user.role },
        { expiresIn: REFRESH_TTL },
      ),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    this.userClient.emit(USER_PATTERNS.UPDATE, {
      id: user.id,
      updateUser: {
        isActive: true,
        lastLogin: new Date(),
      },
    });

    this.redisClient.emit(REDIS_PATTERN.STORE_REFRESH_TOKEN, {
      userId: user.id,
      sessionId,
      hashedRefresh,
      exp: REFRESH_TTL,
    });

    this.notificationClient.emit(NOTIFICATION_PATTERN.SEND, {
      userId: user.id,
      title: 'Login Notification',
      message: 'You have logged in successfully',
      type: NotificationType.SYSTEM,
    });

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
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

  async forgetPassword(forgotPasswordDto: ForgotPasswordDto) {
    try {
      // Tìm user theo email
      const user = await firstValueFrom<UserDto>(
        this.userClient.send(USER_PATTERNS.FIND_ONE_BY_EMAIL, forgotPasswordDto.email)
      );

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Tạo reset token
      const resetToken = randomUUID();

      // Gửi email reset password
      await firstValueFrom(
        this.gmailClient.send(GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL, {
          userId: user.id,
          email: user.email,
          resetToken: resetToken,
          name: user.name,
        })
      );

      return { message: 'Reset password email sent successfully' };
    } catch (error) {
      console.error('Failed to process forgot password:', error);
      throw error;
    }
  }

  async resetPasswordConfirm(confirmResetPasswordDto: ConfirmResetPasswordDto) {
    // Tìm user theo reset token (cần implement logic kiểm tra token)
    // Đây chỉ là placeholder, cần implement đầy đủ logic

    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(confirmResetPasswordDto.newPassword, 10);

    // Cập nhật mật khẩu
    // return this.userClient.send(USER_PATTERNS.UPDATE_PASSWORD, {
    //   id: userId,
    //   password: hashedPassword,
    // });

    return { message: 'Password reset successfully' };
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

  async handleGoogleCallback(data: CreateAuthOAuthDto) {
    const {
      accessToken,
      refreshToken,
      provider,
      providerId,
      email,
      name,
      avatar,
    } = data;

    const account = await firstValueFrom<AccountDto>(
      this.userClient.send(USER_PATTERNS.FIND_ONE_GOOGLE_BY_EMAIL, email),
    );

    console.log(account);

    if (account) {
      console.log("account found");

      this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
        userId: account.user.id,
        accessToken,
        refreshToken,
      });

      return account;
    }
    else {

      let user = await firstValueFrom<UserDto>(
        this.userClient.send(USER_PATTERNS.FIND_ONE_BY_EMAIL, email),
      );

      if (!user) {
        user = await firstValueFrom<UserDto>(
          this.userClient.send(USER_PATTERNS.CREATE_OAUTH, {
            provider,
            providerId,
            name,
            email,
            avatar,
          }),
        );
      }

      console.log("account not found");

      return user;
    }
  }

  findUserById(id: string) {
    return this.userClient.send(USER_PATTERNS.FIND_ONE, id);
  }
}
