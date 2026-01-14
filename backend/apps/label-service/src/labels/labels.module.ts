import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from '@app/contracts/label/entity/label.entity';
import { ClientConfigModule, ClientConfigService, LABEL_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

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
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: LABEL_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: configService.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [LabelsController],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule { }