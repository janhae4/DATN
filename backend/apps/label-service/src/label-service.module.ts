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
  ],
})
export class LabelServiceModule {}
