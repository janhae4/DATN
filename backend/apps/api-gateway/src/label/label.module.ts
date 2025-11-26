import { Module } from '@nestjs/common';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService } from '@app/contracts';
import { LabelController } from './label.controller';
import { LabelService } from './label.service';

@Module({
  imports: [
    ClientConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [{ name: 'label_exchange', type: 'topic' }],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [LabelController],
  providers: [LabelService],
})
export class LabelModule {}