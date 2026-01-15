import { Module } from '@nestjs/common';
import { LabelsController } from './labels.controller';
import { LabelsService } from './labels.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Label } from '@app/contracts/label/entity/label.entity';
import { ClientConfigModule, ClientConfigService, LABEL_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqModule } from '@app/common';

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
    RmqModule.register({
      exchanges: [
        {name: LABEL_EXCHANGE, type: 'direct'}
      ]
    })
  ],
  controllers: [LabelsController],
  providers: [LabelsService],
  exports: [LabelsService],
})
export class LabelsModule { }