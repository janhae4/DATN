import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, REDIS_EXCHANGE, TEAM_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register({
      exchanges: [
        { name: REDIS_EXCHANGE, type: 'direct' },
      ]
    })
  ],
  controllers: [RedisController],
  providers: [RedisService, RedisController],
})
export class RedisModule { }
