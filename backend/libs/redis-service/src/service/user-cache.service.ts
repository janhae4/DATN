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

        if (fetchData) {
            await this.cacheUserProfile(fetchData);
            return fetchData;
        }
    }

    async handleUserLogin(user: User) {
        if (!user || !user.id) return;

        this.logger.log(`Received login event, caching for user: ${user.id}`);

        try {
            const pipe = this.redisService.getClient().pipeline();

            const profileKey = this.getUserInfoKey(user.id);
            const profileData = { id: user.id, name: user.name, avatar: user.avatar };
            pipe.set(
                profileKey,
                JSON.stringify(profileData),
                'EX',
                TTL_24_HOURS,
            );
            await pipe.exec();

            this.logger.log(`Successfully executed cache pipeline for user ${user.id}`);

        } catch (redisError) {
            this.logger.error(`Failed to execute cache pipeline for user ${user.id}`, redisError);
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

        if (missingIds.length > 0 && fetcher) {
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
        }

        return cachedUsers;
    }

    async setManyUserInfo(users: User[]) {
        const pipe = this.redisService.getClient().pipeline();
        users.forEach((user) => {
            const key = this.getUserInfoKey(user.id);

            const profileData = {
                id: user.id,
                name: user.name,
                avatar: user.avatar,
            };

            pipe.set(key, JSON.stringify(profileData), 'EX', TTL_24_HOURS);
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

        this.logger.log(`Updating cached profile for user: ${user.id}`);
        const key = this.getUserInfoKey(user.id);
        const profileData = {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
        };

        await this.redisService.set(
            key,
            JSON.stringify(profileData),
            TTL_24_HOURS,
        );
    }

}