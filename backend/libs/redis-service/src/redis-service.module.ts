import { Global, Module, Provider } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constant';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis-service.service';
import { AuthCacheService } from './service/auth-cache.service';
import { TeamCacheService } from './service/team-cache.service';
import { UserCacheService } from './service/user-cache.service';
import { MeetingCacheService } from './service/meeting-cache.service';

const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (cfg: ConfigService) => {
    return new Redis({
      host: cfg.get('REDIS_CLIENT_HOST') || 'localhost',
      port: Number(cfg.get('REDIS_CLIENT_PORT')) || 6379,
      keepAlive: 10000,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
      connectTimeout: 10000,
    })
  },
  inject: [ConfigService]
}

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisProvider, RedisService, AuthCacheService, TeamCacheService, UserCacheService, MeetingCacheService],
  exports: [RedisService, AuthCacheService, TeamCacheService, UserCacheService, MeetingCacheService],
})
export class RedisServiceModule { }
