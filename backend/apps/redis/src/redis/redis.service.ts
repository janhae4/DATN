import { StoredRefreshTokenDto } from '@app/contracts';
import { BadRequestException } from '@app/contracts/error';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
ConfigModule.forRoot();
@Injectable()
export class RedisService {
  private redis: Redis;
  private readonly logger = new Logger(RedisService.name);
  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_CLIENT_HOST || 'localhost',
      port: Number(process.env.REDIS_CLIENT_PORT) || 6379,
    });
  }

  async storeRefreshToken(
    userId: string,
    sessionId: string,
    hashedRefresh: string,
    exp: number,
  ) {
    const key = `refresh:${userId}:${sessionId}`;
    await this.redis.hmset(key, {
      token: hashedRefresh,
      createdAt: String(Date.now()),
    });
    await this.redis.expire(key, exp);
    this.logger.log('Stored refresh token for user:', userId);
  }

  async getStoredRefreshToken(userId: string, sessionId: string) {
    const key = `refresh:${userId}:${sessionId}`;
    const data = await this.redis.hgetall(key);
    this.logger.log('Retrieved refresh token for user:', userId);
    return Object.keys(data).length > 0
      ? (data as unknown as StoredRefreshTokenDto)
      : false;
  }

  async deleteRefreshToken(userId: string, sessionId: string) {
    const key = `refresh:${userId}:${sessionId}`;
    await this.redis.del(key);
    this.logger.log('Deleted refresh token for user:', userId);
  }

  async clearRefreshTokens(userId: string) {
    const pattern = `refresh:${userId}:*`;
    const keys = await this.scanKeys(pattern);
    if (keys.length) await this.redis.del(keys);
    this.logger.log('Cleared refresh tokens for user:', userId);
  }

  async setLockKey(userId: string, sessionId: string) {
    const key = `lock:${userId}:${sessionId}`;
    this.logger.log('Setting lock key for user:', userId);
    return await this.redis.set(key, '1', 'EX', 1000, 'NX');
  }

  private async scanKeys(pattern: string) {
    const found: string[] = [];
    let cursor = '0';
    while (cursor !== '0') {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        '1000',
      );
      cursor = nextCursor;
      if (keys.length) found.push(...keys);
      cursor = keys[0];
    }
    this.logger.log('Found keys:', found);
    return found;
  }

  async storeGoogleToken(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const accessKey = `google:${userId}:access`;
    const refreshKey = `google:${userId}:refresh`;

    await this.redis.set(accessKey, accessToken, 'EX', 3600);

    if (refreshToken) {
      await this.redis.set(refreshKey, refreshToken);
      this.logger.log('Stored refresh token for user:', userId);
    }
    this.logger.log('Stored access token for user:', userId);
  }

  async getGoogleToken(userId: string) {
    const accessKey = `google:${userId}:access`;
    const refreshKey = `google:${userId}:refresh`;

    const [accessToken, refreshToken] = await Promise.all([
      this.redis.get(accessKey),
      this.redis.get(refreshKey),
    ]);

    if (!refreshToken) {
      this.logger.warn('No valid Google tokens found for user:', userId);
      throw new BadRequestException('No Google account linked');
    }

    this.logger.log('Retrieved Google tokens for user:', userId);
    return { accessToken, refreshToken };
  }
}
