import { Module } from '@nestjs/common';
import { EpicsModule } from './epics/epics.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService,Epic } from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    TypeOrmModule.forFeature([Epic]),
    EpicsModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: 'epic_exchange',
            type: 'topic',
          },
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
})
export class EpicServiceModule {}
