import { Global, Module, Provider } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import Redis from 'ioredis';
import { RedisService } from './redis-service.service';
import { AuthCacheService } from './service/auth-cache.service';
import { TeamCacheService } from './service/team-cache.service';
import { UserCacheService } from './service/user-cache.service';
import { MeetingCacheService } from './service/meeting-cache.service';


const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (cfg: ClientConfigService) => {
    return new Redis({
      host: cfg.getRedisHost() || 'redis',
      port: cfg.getRedisClientPort() || 6379,
      keepAlive: 10000,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
      connectTimeout: 10000,
    })
  },
  inject: [ClientConfigService]
}

@Global()
@Module({
  imports: [ClientConfigModule],
  providers: [RedisProvider, RedisService, AuthCacheService, TeamCacheService, UserCacheService, MeetingCacheService],
  exports: [RedisService, AuthCacheService, TeamCacheService, UserCacheService, MeetingCacheService],
})
export class RedisServiceModule { }
