import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis-service.service';

@Injectable()
export class MeetingCacheService {
    private readonly logger = new Logger(MeetingCacheService.name)
    constructor(private readonly redisService: RedisService) { }

    private getMeetingBufferKey(roomId: string) {
        return `meeting:${roomId}:buffer`;
    }

    private getMeetingProcessingKey(roomId: string) {
        return `meeting:${roomId}:processing`;
    }

    async pushToMeetingBuffer(roomId: string, data: any) {
        const redis = this.redisService.getClient();
        const redisKey = this.getMeetingBufferKey(roomId);
        await redis.rpush(redisKey, JSON.stringify(data));
        this.logger.debug(await redis.lrange(redisKey, 0, -1))
        return await redis.llen(redisKey);
    }

    async popMeetingBuffer(roomId: string) {
        const redis = this.redisService.getClient();
        const redisKey = this.getMeetingBufferKey(roomId);
        const processingKey = this.getMeetingProcessingKey(roomId);
        try {
            await redis.rename(redisKey, processingKey);
        } catch (e) {
            return [];
        }
        const data = await redis.lrange(processingKey, 0, -1);
        await redis.del(processingKey);
        return data.map(item => JSON.parse(item));
    }
}