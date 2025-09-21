import { Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import Redis from 'ioredis';
ConfigModule.forRoot()
@Injectable()
export class RedisService {
    private redis: Redis;
    constructor() {
        this.redis = new Redis({
            host: process.env.HOST_URL,
            port: 6379
        })
    }

    async storeRefreshToken(userId: string, sessionId: string, hashedRefresh: string, exp: number) {
        const key = `refresh:${userId}:${sessionId}`;
        console.log("key: ", key)
        await this.redis.hmset(key, {
            token: hashedRefresh,
            createdAt: String(Date.now())
        });
        await this.redis.expire(key, exp);
        return { success: true };
    }

    async getStoredRefreshToken(userId: string, sessionId: string) {
        const key = `refresh:${userId}:${sessionId}`;
        console.log("key: ", key)
        const data = await this.redis.hgetall(key);
        console.log("GET: ", data)
        return Object.keys(data).length > 0 ? data : null;
    }

    async deleteRefreshToken(userId: string, sessionId: string) {
        const key = `refresh:${userId}:${sessionId}`;
        await this.redis.del(key);
        return { success: true };
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
        const found: string[] = []
        let cursor = '0'
        while (cursor !== '0') {
            const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', '1000')
            cursor = nextCursor
            if (keys.length) found.push(...keys)
            cursor = keys[0]
        }
        return found
    }
}
