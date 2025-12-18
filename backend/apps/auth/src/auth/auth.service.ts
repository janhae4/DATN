import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import {
  USER_PATTERNS,
  GMAIL_PATTERNS,
  REDIS_PATTERN,
  User,
  CreateAuthDto,
  LoginDto,
  GoogleAccountDto,
  SendEmailVerificationDto,
  JwtDto,
  REFRESH_TTL,
  Account,
  BadRequestException,
  RefreshTokenDto,
  StoredRefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  NotFoundException,
  EVENTS,
  Error,
  USER_EXCHANGE,
  EVENTS_EXCHANGE,
  GMAIL_EXCHANGE,
  REDIS_EXCHANGE,
} from '@app/contracts';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { VerifyTokenDto } from './dto/verify-token.dto';
import { ResetCodeDto } from './dto/reset-code.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { unwrapRpcResult } from '@app/common';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private readonly amqp: AmqpConnection
  ) { }

  async register(createAuthDto: CreateAuthDto) {
    this.logger.log(
      `Starting registration for user: ${createAuthDto.email}...`,
    );
    const user = await unwrapRpcResult(await this.amqp.request<User & Error>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.CREATE_LOCAL,
      payload: createAuthDto,
    }))

    this.logger.log(`User ${user.id} created. Emitting welcome email.`);
    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.REGISTER, user);

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

  async verifyLocal(userId: string, code: string) {
    this.logger.log(`Verifying local account for user ${userId}...`);
    return await this.amqp.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.VERIFY_LOCAL,
      payload: { userId, code },
    })
  }

  async verifyLocalToken(token: string) {
    this.logger.log('Verifying local account via token...');
    const payload = await this.verifyToken<VerifyTokenDto>(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    const { userId, code } = payload;
    this.logger.log(`Token validated. Verifying user ${userId}...`);
    return await this.amqp.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.VERIFY_LOCAL,
      payload: { userId, code },
    })
  }

  verifyForgotPassword(userId: string, code: string, password: string) {
    this.logger.log(`Verifying forgot password for user ${userId}...`);
    return this.amqp.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.VERIFY_FORGET_PASSWORD,
      payload: { userId, code, password },
    })
  }

  async verifyForgotPasswordToken(token: string, password: string) {
    this.logger.log('Verifying forgot password via token...');
    const payload = await this.verifyToken<VerifyTokenDto>(token);
    if (!payload) throw new UnauthorizedException('Invalid token');
    this.logger.log(
      `Token validated. Verifying forgot password for user ${payload.userId}...`,
    );
    const { userId, code } = payload;
    return await this.amqp.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.VERIFY_FORGET_PASSWORD,
      payload: { userId, code, password },
    })
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
      id: user.id,
      name: user.name,
      avatar: user.avatar,
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
    this.amqp.publish(GMAIL_EXCHANGE, pattern, emailPayload);

    return { code, url };
  }

  async resetCode(id: string) {
    this.logger.log(`Resetting password code for user ${id}...`);
    const payload = await this.amqp.request<ResetCodeDto>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.RESET_CODE,
      payload: id,
    })

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
    const payload = await this.amqp.request<ResetCodeDto>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.RESET_CODE,
      payload: userId,
    })

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
      this.jwtService.signAsync(payload, { expiresIn: 60 * 60 * 24 }),
      this.jwtService.signAsync(
        { ...payload, sessionId },
        { expiresIn: 60 * 60 * 24 * 14 },
      ),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.STORE_REFRESH_TOKEN, {
      userId: user.id,
      sessionId,
      hashedRefresh,
      exp: REFRESH_TTL,
    });

    return { accessToken, refreshToken };
  }

  private _handlePostLoginTasks(user: User) {
    this.logger.log(`Emitting post-login events for user ${user.id}.`);
    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.LOGIN, user);
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Login attempt for ${loginDto.username}...`);
    const user = await this.amqp.request<User>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.VALIDATE,
      payload: loginDto,
    })

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

  async getGoogleTokens(userId: string) {
    return await this.amqp.request({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.GET_GOOGLE_TOKEN,
      payload: userId,
    });
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

    const currentUser = await this.amqp.request<User>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE,
      payload: user,
    })

    this.logger.log(`Storing Google tokens for user ${user.id}.`);
    this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: user.id,
      accessToken,
      refreshToken,
    });

    console.log("user.id in handleLinking", user.id);

    this.logger.log(`Creating new account link for user ${user.id}.`);
    await this.amqp.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.CREATE_ACCOUNT,
      payload: {
        user: { id: user.id },
        provider,
        providerId,
        email,
        name,
        avatar,
      },
    })

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
    console.log("data from handleLoginGoogle: ",)

    this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
      userId: account.user.id,
      accessToken,
      refreshToken,
    });

    await this._generateTokensAndSession(account.user);
    return await this._generateTokensAndSession(account.user);
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

    const user = await this.amqp.request<User>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.CREATE_OAUTH,
      payload: {
        name,
        email,
        avatar,
        isVerified: true,

        provider,
        providerId,
      },
    })

    this.logger.log(`New user ${user.id} created via Google registration.`);

    this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.STORE_GOOGLE_TOKEN, {
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

    console.log("data in google callback: ", data)

    const account = await this.amqp.request<Account>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE_OAUTH,
      payload: {
        provider: data.provider,
        providerId: data.providerId
      }
    })

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
    return this.amqp.request<User>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE,
      payload: id,
    });
  }

  async refresh(token: string) {
    this.logger.log('Attempting token refresh...');
    const payload = await this.verifyToken<RefreshTokenDto>(token);
    this.logger.log(
      `Refresh payload validated for user ${payload.id}, session ${payload.sessionId}.`,
    );

    const stored = await this.amqp.request<StoredRefreshTokenDto>({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.GET_STORED_REFRESH_TOKEN,
      payload: {
        userId: payload.id,
        sessionId: payload.sessionId,
      },
    })

    console.log(stored)

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
    const lockKey = await this.amqp.request<string>({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.SET_LOCK_KEY,
      payload: {
        userId: payload.id,
        sessionId: payload.sessionId,
      },
    })
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

    this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
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
    const user = this.amqp.request<User>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.UPDATE_PASSWORD,
      payload: changePasswordDto.id,
    })
    if (!user) {
      this.logger.warn(`User ${changePasswordDto.id} not found.`);
      throw new NotFoundException(`User ${changePasswordDto.id} not found.`);
    }
    this.amqp.publish(GMAIL_EXCHANGE, GMAIL_PATTERNS.SEND_EMAIL_PASSWORD_CHANGE, user)
    return { message: 'Password changed successfully' }
  }

  async forgetPassword(forgotPasswordDto: ForgotPasswordDto) {
    this.logger.log(
      `Processing forgot password request for email: ${forgotPasswordDto.email}...`,
    );
    try {
      const payload = await this.amqp.request<{ user: User, resetCode: string, expiredCode: Date }>({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.RESET_PASSWORD,
        payload: forgotPasswordDto.email
      })

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
    return this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.CLEAR_REFRESH_TOKENS, {
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
    return this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
      userId,
      sessionId,
    });
  }

  async verifyToken<T extends object>(token: string): Promise<T> {
    try {
      return await this.jwtService.verifyAsync<T>(token);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(`Token verification failed: ${err.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  async findUserById(id: string) {
    this.logger.log(`Finding user by ID: ${id}...`);
    return await this.amqp.request<User>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE,
      payload: id,
    })
  }
}
