import { Controller } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MessagePattern } from '@nestjs/microservices';
import { REDIS_PATTERN } from '@app/contracts/redis/redis.pattern';

@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) {}

  @MessagePattern(REDIS_PATTERN.STORE_REFRESH_TOKEN)
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

  @MessagePattern(REDIS_PATTERN.GET_STORED_REFRESH_TOKEN)
  async getStoredRefreshToken(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.getStoredRefreshToken(userId, sessionId);
  }

  @MessagePattern(REDIS_PATTERN.DELETE_REFRESH_TOKEN)
  async deleteRefreshToken(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.deleteRefreshToken(userId, sessionId);
  }

  @MessagePattern(REDIS_PATTERN.CLEAR_REFRESH_TOKENS)
  async clearRefreshTokens(userId: string) {
    return await this.redisService.clearRefreshTokens(userId);
  }

  @MessagePattern(REDIS_PATTERN.SET_LOCK_KEY)
  async setLockKey(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.setLockKey(userId, sessionId);
  }
}
