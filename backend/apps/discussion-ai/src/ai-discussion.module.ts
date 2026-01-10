import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  CHATBOT_EXCHANGE,
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  REDIS_EXCHANGE,
  TEAM_EXCHANGE,
  USER_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AiDiscussion, AiDiscussionSchema } from './schema/ai-discussion.schema';
import { AiDiscussionController } from './ai-discussion.controller';
import { AiDiscussionService } from './ai-discussion.service';
import { AiMessage, AiMessageSchema } from './schema/message.schema';
import Redis from 'ioredis';
@Module({
  imports: [
    ClientConfigModule,
    MongooseModule.forRootAsync({
      useFactory: (config: ClientConfigService) => ({
        uri: config.getChatbotDatabaseURL(),
      }),
      inject: [ClientConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: AiDiscussion.name,
        schema: AiDiscussionSchema,
      },
      {
        name: AiMessage.name,
        schema: AiMessageSchema,
      }
    ]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: CHATBOT_EXCHANGE,
            type: 'direct',
          }
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
      })
    })
  ],
  providers: [
    AiDiscussionController,
    AiDiscussionService,
    {
      provide: REDIS_EXCHANGE,
      useFactory: (config: ClientConfigService) => new Redis({
        host: config.getRedisHost(),
        port: config.getRedisClientPort(),
      }),
      inject: [ClientConfigService],
    }
  ],
  controllers: [AiDiscussionController],
})
export class AiDiscussionModule { }
