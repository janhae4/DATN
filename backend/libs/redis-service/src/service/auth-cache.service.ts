// libs/redis/src/services/auth-cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';
import { StoredRefreshTokenDto } from '@app/contracts';
import { RedisService } from '../redis-service.service';

@Injectable()
export class AuthCacheService {
    private readonly logger = new Logger(AuthCacheService.name);

    constructor(private readonly redisService: RedisService) { }

    async storeRefreshToken(userId: string, sessionId: string, hashedRefresh: string, exp: number) {
        const redis = this.redisService.getClient();
        const activeKey = `refresh:${userId}:${sessionId}`;
        const usedKey = `used_refresh:${userId}:${sessionId}`;

        const oldTokenHash = await redis.hget(activeKey, 'token');
        const pipe = redis.pipeline();

        if (oldTokenHash) {
            pipe.lpush(usedKey, oldTokenHash);
            pipe.expire(usedKey, 300);
        }
        pipe.hmset(activeKey, {
            token: hashedRefresh,
            createdAt: String(Date.now()),
        });
        pipe.expire(activeKey, exp);
        await pipe.exec();
    }

    async getStoredRefreshToken(userId: string, sessionId: string) {
        const redis = this.redisService.getClient();
        const key = `refresh:${userId}:${sessionId}`;
        const data = await redis.hgetall(key);
        return Object.keys(data).length > 0 ? (data as unknown as StoredRefreshTokenDto) : false;
    }

    async isTokenUsed(userId: string, tokenHash: string) {
        const key = `used_refresh:${userId}:${tokenHash}`;
        return await this.redisService.get<string>(key);
    }

    async deleteRefreshToken(userId: string, sessionId: string) {
        await this.redisService.del(`refresh:${userId}:${sessionId}`);
    }

    async storeGoogleToken(userId: string, accessToken: string, refreshToken: string) {
        await this.redisService.set(`google:${userId}:access`, accessToken, 3600);
        if (refreshToken) {
            await this.redisService.set(`google:${userId}:refresh`, refreshToken);
        }
    }

    async getGoogleToken(userId: string) {
        const redis = this.redisService.getClient();
        const [accessToken, refreshToken] = await Promise.all([
            redis.get(`google:${userId}:access`),
            redis.get(`google:${userId}:refresh`),
        ]);

        if (!refreshToken) throw new BadRequestException('No Google account linked');
        return { accessToken, refreshToken };
    }

    async clearRefreshTokens(userId: string) {
        const pattern = `refresh:${userId}:*`;
        const keys = await this.scanKeys(pattern);
        if (keys.length) await this.redisService.del(keys);
        this.logger.log('Cleared refresh tokens for user:', userId);
    }

    async setLockKey(userId: string, sessionId: string) {
        const key = `lock:${userId}:${sessionId}`;
        console.log("Lock Key: ", await this.redisService.get(key));
        this.logger.log('Setting lock key for user:', userId);
        return await this.redisService.getClient().set(key, '1', 'EX', 10, 'NX');
    }

    async deleteLockKey(userId: string, sessionId: string) {
        const key = `lock:${userId}:${sessionId}`;
        return await this.redisService.del(key);
    }

    private async scanKeys(pattern: string) {
        const found: string[] = [];
        let cursor = '0';
        do {
            const [nextCursor, keys] = await this.redisService.getClient().scan(
                cursor,
                'MATCH',
                pattern,
                'COUNT',
                1000,
            );
            if (keys.length) found.push(...keys);
            cursor = nextCursor;
        } while (cursor !== '0');
        return found;
    }
}