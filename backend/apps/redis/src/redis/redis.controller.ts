import { Controller } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
  REDIS_EXCHANGE,
  REDIS_PATTERN,
} from '@app/contracts';

@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) { }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.STORE_REFRESH_TOKEN,
    queue: REDIS_PATTERN.STORE_REFRESH_TOKEN,
  })

  async storeRefreshToken(data: {
    userId: string;
    sessionId: string;
    hashedRefresh: string;
    exp: number;
  }) {
    const { userId, sessionId, hashedRefresh, exp } = data;
    return await this.redisService.storeRefreshToken(
      userId,
      sessionId,
      hashedRefresh,
      exp,
    );
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.STORE_GOOGLE_TOKEN,
    queue: REDIS_PATTERN.STORE_GOOGLE_TOKEN,
  })
  async storeGoogleToken(data: {
    userId: string;
    accessToken: string;
    refreshToken: string;
  }) {
    const { userId, accessToken, refreshToken } = data;
    console.log('Google userID', userId);
    console.log('Google accessToken', accessToken);
    console.log('Google refreshToken', refreshToken);
    return await this.redisService.storeGoogleToken(
      userId,
      accessToken,
      refreshToken,
    );
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_STORED_REFRESH_TOKEN,
    queue: REDIS_PATTERN.GET_STORED_REFRESH_TOKEN,
  })
  async getStoredRefreshToken(data: { userId: string; sessionId: string }) {
    console.log(data)
    const { userId, sessionId } = data;
    return await this.redisService.getStoredRefreshToken(userId, sessionId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_GOOGLE_TOKEN,
    queue: REDIS_PATTERN.GET_GOOGLE_TOKEN,
  })
  async getGoogleToken(userId: string) {
    console.log('Google userID', userId);
    return await this.redisService.getGoogleToken(userId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.DELETE_REFRESH_TOKEN,
    queue: REDIS_PATTERN.DELETE_REFRESH_TOKEN,
  })
  async deleteRefreshToken(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.deleteRefreshToken(userId, sessionId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.CLEAR_REFRESH_TOKENS,
    queue: REDIS_PATTERN.CLEAR_REFRESH_TOKENS,
  })
  async clearRefreshTokens(userId: string) {
    return await this.redisService.clearRefreshTokens(userId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.SET_LOCK_KEY,
    queue: REDIS_PATTERN.SET_LOCK_KEY,
  })
  async setLockKey(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.setLockKey(userId, sessionId);
  }
}