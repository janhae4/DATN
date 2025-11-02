import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigModule, ClientConfigService, FILE_EXCHANGE } from '@app/contracts';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: FILE_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      })
    })
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
})
export class WebhooksModule { }
