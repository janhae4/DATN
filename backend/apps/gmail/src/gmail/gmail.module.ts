import { Module } from '@nestjs/common';
import { GmailService } from './gmail.service';
import { GmailController } from './gmail.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { RedisModule } from 'apps/redis/src/redis/redis.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

@Module({
  imports: [ClientConfigModule, RedisModule],
  controllers: [GmailController],
  providers: [GmailService,
    CLIENT_PROXY_PROVIDER.REDIS_CLIENT,
  ],
})
export class GmailModule { }
