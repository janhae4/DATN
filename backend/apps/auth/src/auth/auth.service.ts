import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom, map, tap } from 'rxjs';
import {
  REDIS_CLIENT,
  USER_CLIENT,
  GMAIL_CLIENT,
  USER_PATTERNS,
  GMAIL_PATTERNS,
  REDIS_PATTERN,
  User,
  CreateAuthDto,
  CreateAuthOAuthDto,
  LoginDto,
  GoogleAccountDto,
  SendEmailVerificationDto,
  JwtDto,
  REFRESH_TTL,
  ACCESS_TTL,
  Account,
  BadRequestException,
  RefreshTokenDto,
  StoredRefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  NotFoundException,
  SOCKET_CLIENT,
  EVENT_CLIENT,
  EVENTS,
  Error,
} from '@app/contracts';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ResetCodeDto } from './dto/reset-code.dto';
import { handleRpc } from '@app/common/utils/handle-rpc';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    @Inject(SOCKET_CLIENT)
    private readonly socketClient: ClientProxy,
    @Inject(GMAIL_CLIENT) private readonly gmailClient: ClientProxy,
    private jwtService: JwtService,
    @Inject(EVENT_CLIENT)
    private readonly eventClient: ClientProxy,
  ) {}

  async register(createAuthDto: CreateAuthDto) {
    this.logger.log(
      `Starting registration for user: ${createAuthDto.email}...`,
    );
    const user = await firstValueFrom<User>(
      handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_LOCAL, createAuthDto),
      ),
    );
    this.logger.log(`User ${user.id} created. Emitting welcome email.`);
    this.eventClient.emit(EVENTS.REGISTER, user);

    this.logger.log(`Generating verification code for user ${user.id}.`);
    const { code, url } = await this.generateAndSendCode(
      user.verifiedCode ?? '',
      user.expiredCode ?? new Date(),
      'verify',
      GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
      user,
    );
    this.logger.log(`Verification code sent for user ${user.id}.`);
    return {
      verifiedCode: code,
      verifiedUrl: url,
    };
  }

  verifyLocal(userId: string, code: string) {
    this.logger.log(`Verifying local account for user ${userId}...`);
    return handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_LOCAL, { userId, code }),
    );
  }

  async verifyLocalToken(token: string) {
    this.logger.log('Verifying local account via token...');
    const payload = await this.verifyToken<VerifyTokenDto>(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    const { userId, code } = payload;
    this.logger.log(`Token validated. Verifying user ${userId}...`);
    return handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_LOCAL, { userId, code }),
    );
  }

  verifyForgotPassword(userId: string, code: string, password: string) {
    this.logger.log(`Verifying forgot password for user ${userId}...`);
    return handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_FORGET_PASSWORD, {
        userId,
        code,
        password,
      }),
    );
  }

  async verifyForgotPasswordToken(token: string, password: string) {
    this.logger.log('Verifying forgot password via token...');
    const payload = await this.verifyToken<VerifyTokenDto>(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    this.logger.log(
      `Token validated. Verifying forgot password for user ${payload.userId}...`,
    );
    return handleRpc(
      this.userClient.send(USER_PATTERNS.VERIFY_FORGET_PASSWORD, {
        userId: payload.userId,
        code: payload.code,
        password,
      }),
    );
  }

  private async generateAndSendCode(
    code: string,
    expiredCode: Date,
    typeCode: 'verify' | 'reset',
    pattern: string,
    user: User,
  ): Promise<{ code: string; url: string }> {
    this.logger.log(
      `Generating JWT for ${typeCode} code for user ${user.id}...`,
    );
    const tokenPayload = {
      userId: user.id,
      code,
      expiredCode,
    };

    const token = await this.jwtService.signAsync(tokenPayload, {
      expiresIn: 15 * 60,
    });

    const urlSegment = typeCode === 'reset' ? 'reset/password' : 'verify/token';
    const url = `${process.env.HOST_URL || 'http://localhost:3000'}/auth/${urlSegment}?token=${token}`;

    this.logger.log(`Emitting email pattern '${pattern}' for user ${user.id}.`);
    const emailPayload = {
      user,
      code,
      url,
    } as SendEmailVerificationDto;
    this.gmailClient.emit(pattern, emailPayload);

    return { code, url };
  }

  async resetCode(id: string) {
    this.logger.log(`Resetting password code for user ${id}...`);
    const payload = await firstValueFrom<ResetCodeDto>(
      handleRpc(this.userClient.send(USER_PATTERNS.RESET_CODE, id)),
    );

    this.logger.log(
      `Generating new reset code email for user ${payload.user.id}.`,
    );
    const { code, url } = await this.generateAndSendCode(
      payload.code,
      payload.expiredCode,
      'reset',
      GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
      payload.user,
    );

    return {
      resetUrl: url,
      resetCode: code,
    };
  }

  async resetVerificationCode(userId: string) {
    this.logger.log(`Resetting verification code for user ${userId}...`);
    const payload = await firstValueFrom<ResetCodeDto>(
      handleRpc(this.userClient.send(USER_PATTERNS.RESET_CODE, userId)),
    );

    this.logger.log(
      `Generating new verification code email for user ${payload.user.id}.`,
    );
    const { code, url } = await this.generateAndSendCode(
      payload.code,
      payload.expiredCode,
      'verify',
      GMAIL_PATTERNS.SEND_VERIFICATION_EMAIL,
      payload.user,
    );

    return {
      verificationUrl: url,
      verificationCode: code,
    };
  }

  private async _generateTokensAndSession(user: User | JwtDto) {
    const sessionId = randomUUID();
    const payload = { id: user.id, role: user.role };

    this.logger.log(
      `Generating tokens for user ${user.id}, session ${sessionId}...`,
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: ACCESS_TTL }),
      this.jwtService.signAsync(
        { ...payload, sessionId },
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

    return { accessToken, refreshToken };
  }

  private _handlePostLoginTasks(user: User) {
    this.logger.log(`Emitting post-login events for user ${user.id}.`);
    this.eventClient.emit(EVENTS.LOGIN, user);
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for ${loginDto.username}...`);
    const user = await firstValueFrom<User>(
      this.userClient.send(USER_PATTERNS.VALIDATE, loginDto),
    );
    if (!user) {
      this.logger.warn(`Invalid credentials for ${loginDto.username}.`);
      throw new UnauthorizedException('Invalid credentials');
    }
    this.logger.log(
      `User ${loginDto.username} validated. Generating session...`,
    );
    const token = await this._generateTokensAndSession(user);
    this._handlePostLoginTasks(user);
    return token;
  }

  private async handleLinking(data: GoogleAccountDto, account: Account) {
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

    const user = await this.verifyToken<JwtDto>(linkedUser ?? '');
    if (!user) {
      this.logger.warn('OAuth linking attempt without valid user session.');
      throw new UnauthorizedException(
        'You must be logged in to link a provider',
      );
    }

    this.logger.log(
      `Attempting to link ${provider} for user ${user.id} (Email: ${email}).`,
    );

    if (account) {
      this.logger.warn(
        `Google account ${email} already linked to another user.`,
      );
      throw new BadRequestException('Google account already linked');
    }

    const currentUser = await firstValueFrom<User>(
      this.userClient.send(USER_PATTERNS.FIND_ONE, user.id),
    );

    this.logger.log(`Storing Google tokens for user ${user.id}.`);
    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: user.id,
      accessToken,
      refreshToken,
    });

    this.logger.log(`Creating new account link for user ${user.id}.`);
    await firstValueFrom(
      handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_ACCOUNT, {
          providerId,
          provider,
          name,
          avatar,
          email,
          user: currentUser,
        } as Partial<Account>),
      ),
    );

    this.logger.log(
      `Google account ${email} linked successfully to user ${user.id}.`,
    );
    return { message: 'Google account linked successfully' };
  }

  private async handleLoginGoogle(data: GoogleAccountDto, account: Account) {
    this.logger.log(
      `Handling Google login for existing user ${account.user.id} (Email: ${data.email}).`,
    );
    const { accessToken, refreshToken } = data;

    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: account.user.id,
      accessToken,
      refreshToken,
    });

    await this._generateTokensAndSession(account.user);
  }

  private async handleRegisterGoogle(data: GoogleAccountDto) {
    this.logger.log(
      `Handling Google registration for new user (Email: ${data.email}).`,
    );
    const {
      accessToken,
      refreshToken,
      provider,
      providerId,
      email,
      name,
      avatar,
    } = data;

    const user = await firstValueFrom<User>(
      handleRpc(
        this.userClient.send(USER_PATTERNS.CREATE_OAUTH, {
          provider,
          providerId,
          name,
          email,
          avatar,
        } as CreateAuthOAuthDto),
      ),
    );

    this.logger.log(`New user ${user.id} created via Google registration.`);

    this.redisClient.emit(REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: user.id,
      accessToken,
      refreshToken,
    });

    return await this._generateTokensAndSession(user);
  }

  async handleGoogleCallback(data: GoogleAccountDto) {
    this.logger.log(
      `Processing Google callback for ${data.email} (Provider: ${data.provider}).`,
    );
    if (!data.email) {
      this.logger.error('Google callback missing email.');
      throw new BadRequestException('Google account missing email');
    }

    const account = await firstValueFrom<Account>(
      this.userClient.send(USER_PATTERNS.FIND_ONE_OAUTH, {
        provider: data.provider,
        providerId: data.providerId,
      }),
    );

    if (data.isLinking && data.linkedUser) {
      this.logger.log(`Routing to handleLinking for ${data.email}.`);
      return await this.handleLinking(data, account);
    }

    if (account) {
      this.logger.log(`Routing to handleLoginGoogle for ${data.email}.`);
      return await this.handleLoginGoogle(data, account);
    }

    this.logger.log(`Routing to handleRegisterGoogle for ${data.email}.`);
    return await this.handleRegisterGoogle(data);
  }

  getInfo(id: string) {
    this.logger.log(`Fetching info for user ${id}.`);
    return this.userClient.send(USER_PATTERNS.FIND_ONE, id);
  }

  async refresh(token: string) {
    this.logger.log('Attempting token refresh...');
    const payload = await this.verifyToken<RefreshTokenDto>(token);
    this.logger.log(
      `Refresh payload validated for user ${payload.id}, session ${payload.sessionId}.`,
    );

    const stored = await firstValueFrom(
      this.redisClient
        .send(REDIS_PATTERN.GET_STORED_REFRESH_TOKEN, {
          userId: payload.id,
          sessionId: payload.sessionId,
        })
        .pipe(map((s) => s as StoredRefreshTokenDto)),
    );
    if (!stored) {
      this.logger.warn(
        `No stored refresh token found for user ${payload.id}, session ${payload.sessionId}.`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.logger.log('Comparing token hashes...');
    const matches = await bcrypt.compare(token, stored.token);
    if (!matches) {
      this.logger.warn(
        `Refresh token hash mismatch for user ${payload.id}, session ${payload.sessionId}.`,
      );
      throw new UnauthorizedException('Invalid refresh token');
    }

    this.logger.log(
      `Attempting to acquire refresh lock for user ${payload.id}, session ${payload.sessionId}...`,
    );
    const lockKey = await firstValueFrom(
      this.redisClient
        .send(REDIS_PATTERN.SET_LOCK_KEY, {
          userId: payload.id,
          sessionId: payload.sessionId,
        })
        .pipe(map((l) => l as string)),
    );
    if (!lockKey) {
      this.logger.warn(
        `Refresh lock failed (already in progress) for user ${payload.id}, session ${payload.sessionId}.`,
      );
      throw new RpcException({
        status: 429,
        error: 'Too many requests',
        message: 'Refresh in progress',
      });
    }
    this.logger.log(
      `Refresh lock acquired. Generating new tokens for user ${payload.id}.`,
    );

    this.redisClient.emit(REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
      userId: payload.id,
      sessionId: payload.sessionId,
    });

    return this._generateTokensAndSession({
      id: payload.id,
      role: payload.role,
    } as JwtDto);
  }

  changePassword(changePasswordDto: ChangePasswordDto) {
    this.logger.log(
      `Processing password change for user ${changePasswordDto.id}...`,
    );
    return handleRpc(
      this.userClient
        .send(USER_PATTERNS.UPDATE_PASSWORD, changePasswordDto)
        .pipe(
          tap((user: User) => {
            this.logger.log(
              `Password changed successfully for user ${user.id}. Emitting notification email.`,
            );
            this.gmailClient.emit(
              GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE,
              user,
            );
          }),
          map(() => ({ message: 'Password changed successfully' })),
        ),
    );
  }

  async forgetPassword(forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(
      `Processing forgot password request for email: ${forgotPasswordDto.email}...`,
    );
    try {
      const payload = await firstValueFrom<{
        user: User;
        resetCode: string;
        expiredCode: Date;
      }>(
        handleRpc(
          this.userClient.send(
            USER_PATTERNS.RESET_PASSWORD,
            forgotPasswordDto.email,
          ),
        ),
      );

      if (!payload.user) {
        this.logger.warn(
          `Forgot password attempt for non-existent account: ${forgotPasswordDto.email}`,
        );
        throw new NotFoundException('Account not found');
      }

      const { user, resetCode, expiredCode } = payload;
      this.logger.log(
        `User ${user.id} found. Generating password reset code...`,
      );
      const { code, url } = await this.generateAndSendCode(
        resetCode,
        expiredCode,
        'reset',
        GMAIL_PATTERNS.SEND_RESET_PASSWORD_EMAIL,
        user,
      );
      return {
        resetUrl: url,
        resetCode: code,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `Failed to process forgot password for ${forgotPasswordDto.email}: ${err.message}`,
      );
      throw error;
    }
  }

  logoutAll(userId: string) {
    this.logger.log(`Logging out all sessions for user ${userId}...`);
    return this.redisClient.send(REDIS_PATTERN.CLEAR_REFRESH_TOKENS, {
      userId,
    });
  }

  async logout(token: string) {
    this.logger.log('Processing logout...');
    const payload: RefreshTokenDto = await this.jwtService.verifyAsync(token);
    const { id: userId, sessionId } = payload;
    this.logger.log(
      `Deleting refresh token for user ${userId}, session ${sessionId}.`,
    );
    this.redisClient.emit(REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
      userId,
      sessionId,
    });
  }

  async verifyToken<T extends object>(token: string): Promise<T> {
    try {
      this.logger.debug('Verifying token...');
      console.log(await this.jwtService.verifyAsync(token));
      return await this.jwtService.verifyAsync<T>(token);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  findUserById(id: string) {
    this.logger.log(`Finding user by ID: ${id}...`);
    return handleRpc(this.userClient.send(USER_PATTERNS.FIND_ONE, id));
  }
}
