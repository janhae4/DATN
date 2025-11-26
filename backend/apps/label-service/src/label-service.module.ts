import { Module } from '@nestjs/common';
import { LabelsModule } from './labels/labels.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, Label } from '@app/contracts';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ClientConfigModule,
    TypeOrmModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        type: 'postgres',
        url: configService.databaseLabelUrl,
        entities: [Label],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([Label]),
    LabelsModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: 'label_exchange',
            type: 'topic',
          },
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
})
export class LabelServiceModule {}
