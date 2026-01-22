// libs/redis/src/redis.service.ts
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constant';

@Injectable()
export class RedisService implements OnModuleDestroy {
    constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) { }

    onModuleDestroy() {
        this.redis.disconnect();
    }

    getClient(): Redis {
        return this.redis;
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, value: any, ttl?: number, callback?: () => void): Promise<void> {
        const valStr = typeof value === 'string' ? value : JSON.stringify(value);
        if (ttl && callback) {
            await this.redis.set(key, valStr, 'EX', ttl, callback);
        } else {
            await this.redis.set(key, valStr);
        }
    }

    async del(key: string | string[]) {
        if (Array.isArray(key)) {
            if (key.length > 0) await this.redis.del(...key);
        } else {
            await this.redis.del(key);
        }
    }
}