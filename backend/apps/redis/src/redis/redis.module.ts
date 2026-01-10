import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { ClientConfigModule, ClientConfigService, EVENTS_EXCHANGE, REDIS_EXCHANGE, TEAM_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => {
        return {
          exchanges: [
            {
              name: REDIS_EXCHANGE,
              type: 'direct',
            }
          ],
          uri: cfg.getRMQUrl(),
          connectionInitOptions: { wait: false },
        }
      }
    }),
  ],
  controllers: [RedisController],
  providers: [RedisService, RedisController],
})
export class RedisModule { }
