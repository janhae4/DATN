import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { REDIS_CLIENT, USER_CLIENT } from '@app/contracts/constants';
import { USER_PATTERNS } from '@app/contracts/user/user.patterns';
import { AccessTokenDto, RefreshTokenDto } from '@app/contracts/auth/jwt.dto';
import { LoginDto } from '@app/contracts/auth/login.dto';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { CreateAuthDto } from '@app/contracts/auth/create-auth.dto';
import { ACCESS_TTL, REFRESH_TTL } from '@app/contracts/auth/jwt.constant';
import { UnauthorizedException } from '@app/contracts/errror';
ConfigModule.forRoot()

@Injectable()
export class AuthService {
  constructor(
    @Inject(USER_CLIENT) private readonly userClient: ClientProxy,
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
    private jwtService: JwtService) { }

  async register(createAuthDto: CreateAuthDto) {
    return await firstValueFrom(this.userClient.send(USER_PATTERNS.CREATE, createAuthDto));
  }

  async login(loginDto: LoginDto) {
    const user = await firstValueFrom(this.userClient.send(USER_PATTERNS.VALIDATE, loginDto));
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const sessionId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ id: user.id, role: user.role }, { expiresIn: ACCESS_TTL }),
      this.jwtService.signAsync({ id: user.id, sessionId: sessionId, role: user.role }, { expiresIn: REFRESH_TTL })
    ])
    this.redisClient.emit(
      REDIS_PATTERN.STORE_REFRESH_TOKEN,
      {
        userId: user.id,
        sessionId,
        hashedRefresh: await bcrypt.hash(refreshToken, 10),
        exp: REFRESH_TTL
      }
    )
    return {
      ...user,
      accessToken: accessToken,
      refreshToken: refreshToken
    };
  }

  async refresh(token: string) {
    const payload: RefreshTokenDto = await this.verifyToken(token);

    const stored = await firstValueFrom(this.redisClient.send(REDIS_PATTERN.GET_STORED_REFRESH_TOKEN, { userId: payload.id, sessionId: payload.sessionId }));
    if (!stored) throw new UnauthorizedException('Invalid refresh token');

    const matches = await bcrypt.compare(token, stored.token);
    if (!matches) throw new UnauthorizedException('Invalid refresh token');

    const lockKey = await firstValueFrom(this.redisClient.send(REDIS_PATTERN.SET_LOCK_KEY, { userId: payload.id, sessionId: payload.sessionId }));
    if (!lockKey) throw new RpcException({ status: 429, error: 'Too many requests', message: 'Refresh in progress' });

    const sessionId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ id: payload.id, role: payload.role }, { expiresIn: ACCESS_TTL }),
      this.jwtService.signAsync({ id: payload.id, sessionId: sessionId, role: payload.role }, { expiresIn: REFRESH_TTL })
    ])

    this.redisClient.emit(
      REDIS_PATTERN.DELETE_REFRESH_TOKEN,
      {
        userId: payload.id,
        sessionId: payload.sessionId,
      });
    this.redisClient.emit(
      REDIS_PATTERN.STORE_REFRESH_TOKEN,
      {
        userId: payload.id,
        sessionId: sessionId,
        hashedRefresh: await bcrypt.hash(refreshToken, 10),
        exp: REFRESH_TTL
      });

    return { accessToken, refreshToken };
  }

  async logoutAll(userId: string) {
    return this.redisClient.send(REDIS_PATTERN.CLEAR_REFRESH_TOKENS, { userId });
  }

  async logout(token: string) {
    const { id: userId, sessionId } = await this.jwtService.verifyAsync(token);
    return this.redisClient.emit(REDIS_PATTERN.DELETE_REFRESH_TOKEN, { userId, sessionId });
  }

  async validateToken(token: string) {
    try {
      const payload: AccessTokenDto = await this.jwtService.verifyAsync(token as string);
      return { id: payload.id, role: payload.role };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async verifyToken(token: string) {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

}

