import { Module } from '@nestjs/common';
import {DiscussionService } from './discussion.service';
import {DiscussionController } from './discussion.controller';
import {DISCUSSION_EXCHANGE, ClientConfigModule, ClientConfigService } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name:DISCUSSION_EXCHANGE,
            type: 'direct',
            options: {
              durable: true,
            },
          },
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      })
    })
  ],
  controllers: [DiscussionController],
  providers: [DiscussionService],
})
export class DiscussionModule { }
