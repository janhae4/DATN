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

@Module({
  imports: [
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
    TypeOrmModule.forFeature([Epic]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: EPIC_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: configService.getRMQUrl(),
        enableControllerDiscovery: true
      }),
    })
  ],
  controllers: [EpicsController],
  providers: [EpicsService],
})
export class EpicsModule { }