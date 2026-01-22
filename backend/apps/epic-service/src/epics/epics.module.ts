import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EpicsService } from './epics.service';
import { EpicsController } from './epics.controller';
import { Epic } from '@app/contracts/epic/entity/epic.entity';
import {
  ClientConfigModule,
  ClientConfigService,
  EPIC_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqModule } from '@app/common';
import { RedisServiceModule } from '@app/redis-service';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseEpicUrl,
        entities: [Epic],
        synchronize: true,
      }),
    }),
    RedisServiceModule,
    TypeOrmModule.forFeature([Epic]),
    RmqModule.register({ exchanges: [{ name: EPIC_EXCHANGE, type: 'direct' }] }),
  ],
  controllers: [EpicsController],
  providers: [EpicsService],
})
export class EpicsModule { }