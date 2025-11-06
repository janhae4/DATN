import { BadRequestException } from '@app/contracts/errror';
import { StoredRefreshTokenDto } from '@app/contracts/redis/store-refreshtoken.dto';
import { Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
ConfigModule.forRoot();
@Injectable()
export class RedisService {
  private redis: Redis;
  constructor() {
    this.redis = new Redis({
      host: process.env.HOST_URL,
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
  }

  async getStoredRefreshToken(userId: string, sessionId: string) {
    const key = `refresh:${userId}:${sessionId}`;
    const data = await this.redis.hgetall(key);
    return Object.keys(data).length > 0
      ? (data as unknown as StoredRefreshTokenDto)
      : false;
  }

  async deleteRefreshToken(userId: string, sessionId: string) {
    const key = `refresh:${userId}:${sessionId}`;
    await this.redis.del(key);
  }

  async clearRefreshTokens(userId: string) {
    const pattern = `refresh:${userId}:*`;
    const keys = await this.scanKeys(pattern);
    if (keys.length) await this.redis.del(keys);
  }

  async setLockKey(userId: string, sessionId: string) {
    const key = `lock:${userId}:${sessionId}`;
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
    return found;
  }

  async storeGoogleToken(
    userId: string,
    accessToken: string,
    refreshToken: string,
  ) {
    const accessKey = `google:${userId}:access`;
    const refreshKey = `google:${userId}:refresh`;

    console.log('Storing Google tokens for user:', userId);
    console.log('Access token length:', accessToken?.length);
    console.log('Refresh token length:', refreshToken?.length);

    await this.redis.set(accessKey, accessToken, 'EX', 3600);

    if (refreshToken) {
      await this.redis.set(refreshKey, refreshToken);
      console.log('Stored refresh token for user:', userId);
    }

    console.log('Successfully stored Google tokens for user:', userId);
  }

  async getGoogleToken(userId: string) {
    const accessKey = `google:${userId}:access`;
    const refreshKey = `google:${userId}:refresh`;

    const [accessToken, refreshToken] = await Promise.all([
      this.redis.get(accessKey),
      this.redis.get(refreshKey),
    ]);

    console.log('Redis getGoogleToken - userId:', userId);
    console.log('Redis getGoogleToken - accessToken exists:', !!accessToken);
    console.log('Redis getGoogleToken - refreshToken exists:', !!refreshToken);

    if (!refreshToken) {
      console.log('No refresh token found for user:', userId);
      throw new BadRequestException('No Google account linked');
    }

    console.log('Found tokens for user:', userId);
    return { accessToken, refreshToken };
  }
}
