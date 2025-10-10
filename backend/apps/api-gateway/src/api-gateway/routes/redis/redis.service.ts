import { REDIS_CLIENT } from '@app/contracts/constants';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redisClient: ClientProxy,
  ) {}

  storeRefreshToken(userId: string, sessionId: string, refreshToken: string) {
    return this.redisClient.send(REDIS_PATTERN.STORE_REFRESH_TOKEN, {
      userId,
      sessionId,
      refreshToken,
    });
  }

  deleteRefreshToken(userId: string, sessionId: string) {
    return this.redisClient.send(REDIS_PATTERN.DELETE_REFRESH_TOKEN, {
      userId,
      sessionId,
    });
  }

  clearRefreshTokens(userId: string) {
    return this.redisClient.send(REDIS_PATTERN.CLEAR_REFRESH_TOKENS, {
      userId,
    });
  }

  getStoredRefreshToken(userId: string, sessionId: string) {
    return this.redisClient.send(REDIS_PATTERN.GET_STORED_REFRESH_TOKEN, {
      userId,
      sessionId,
    });
  }
}
