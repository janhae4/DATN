import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { ClientConfigModule } from '../../../../libs/contracts/src/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

@Module({
  imports: [ClientConfigModule],
  controllers: [RedisController],
  providers: [
    RedisService,
    CLIENT_PROXY_PROVIDER.REDIS_CLIENT
  ],
})
export class RedisModule {}
