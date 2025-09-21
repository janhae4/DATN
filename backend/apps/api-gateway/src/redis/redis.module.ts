import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { ClientConfigModule } from '../../client-config/client-config.module';
import { REDIS_CLIENT } from '@app/contracts/constants';
import { ClientProxyFactory } from '@nestjs/microservices';
import { ClientConfigService } from '../../client-config/client-config.service';

@Module({
  imports: [ClientConfigModule],
  controllers: [RedisController],
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ClientConfigService) =>
        ClientProxyFactory.create(configService.redisClientOptions),
      inject: [ClientConfigService],
    },
  ],
})
export class RedisModule {}
