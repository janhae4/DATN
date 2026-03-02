import { Injectable, Logger } from '@nestjs/common';
import { User, USER_EXCHANGE, USER_PATTERNS } from '@app/contracts';
import { RedisService } from '../redis-service.service';
import { RmqClientService } from '@app/common';

const TTL_24_HOURS = 86400;

@Injectable()
export class UserCacheService {
    private readonly logger = new Logger(UserCacheService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly amqp: RmqClientService
    ) { }

    private getUserInfoKey(userId: string) {
        return `user:profile:${userId}`;
    }

    async delete(userId: string) {
        const key = this.getUserInfoKey(userId);
        await this.redisService.del(key);
    }

    async cacheUserProfile(user: User) {
        const key = this.getUserInfoKey(user.id);
        await this.redisService.set(key, user, TTL_24_HOURS);
    }

    async getUserInfo(userId: string, fetcher?: () => Promise<User | null>) {
        const key = this.getUserInfoKey(userId);
        const redis = this.redisService.getClient();

        const cached = await redis.get(key);
        if (cached) return JSON.parse(cached);

        const fetchData = await fetcher?.() || await this.amqp.request({
            exchange: USER_EXCHANGE,
            routingKey: USER_PATTERNS.FIND_ONE,
            payload: userId,
        })

        console.log("fetchData in getUserInfo: ", fetchData)

        if (fetchData) {
            await this.cacheUserProfile(fetchData);
            return fetchData;
        }
    }

    async handleUserLogin(user: User) {
        if (!user || !user.id) return;

        this.logger.log(`Received login event, invalidating cache for user: ${user.id}`);

        try {
            await this.delete(user.id);
            this.logger.log(`Successfully invalidated cache for user ${user.id}`);
        } catch (redisError) {
            this.logger.error(`Failed to invalidate cache for user ${user.id}`, redisError);
        }
    }

    async getManyUserInfo(
        userIds: string[],
        fetcher?: (missingIds: string[]) => Promise<User[]>
    ): Promise<User[]> {
        if (!userIds || userIds.length === 0) return [];
        const ids = Array.isArray(userIds) ? userIds : [userIds];
        const uniqueIds = [...new Set(ids)];

        const keys = uniqueIds.map((id) => `user:profile:${id}`);
        const results = await this.redisService.getClient().mget(keys);

        const cachedUsers: User[] = results
            .map((data) => (data ? JSON.parse(data) : null))
            .filter((u) => u !== null);

        const foundIds = new Set(cachedUsers.map((u) => u.id));
        const missingIds = uniqueIds.filter((id) => !foundIds.has(id));

        if (missingIds.length > 0) {
            if (fetcher) {
                this.logger.log(`Cache miss for ${missingIds.length} users. Fetching from Source...`);

                try {
                    const freshUsers = await fetcher(missingIds);
                    if (freshUsers && freshUsers.length > 0) {
                        await this.setManyUserInfo(freshUsers);
                        cachedUsers.push(...freshUsers);
                    }
                } catch (error) {
                    this.logger.error('Error fetching missing users', error);
                }
            } else {
                this.logger.warn(`Cache miss for ${missingIds.length} users, but no fetcher provided.`);
                // Fallback: try to fetch one by one if no bulk fetcher? OR just ignore.
                // For now, let's try to fetch via RPC as a default fallback if amqp is available 
                // BUT amqp is private. We should probably rely on the caller providing a fetcher.
            }
        }

        return cachedUsers;
    }

    async setManyUserInfo(users: User[]) {
        const pipe = this.redisService.getClient().pipeline();
        users.forEach((user) => {
            const key = this.getUserInfoKey(user.id);

            pipe.set(key, JSON.stringify(user), 'EX', TTL_24_HOURS);
        });

        try {
            await pipe.exec();
            this.logger.log(`Successfully cached ${users.length} profiles.`);
        } catch (error) {
            this.logger.error('Failed to cache user profiles in pipeline', error);
        }
    }

    async userUpdated(user: User) {
        if (!user || !user.id) return;

        this.logger.log(`Invalidating cached profile for user: ${user.id}`);
        await this.delete(user.id);
    }

    async deleteManyUsers(userIds: string[]) {
        const pipe = this.redisService.getClient().pipeline();
        userIds.forEach((userId) => {
            const key = this.getUserInfoKey(userId);
            pipe.del(key);
        });
        await pipe.exec();
    }

}