import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from '@app/contracts/label/entity/label.entity';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    TypeOrmModule.forFeature([Label]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: 'label_exchange',
            type: 'topic',
          },
          {
            name: 'events_exchange',
            type: 'topic',
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
export class LabelsModule {}