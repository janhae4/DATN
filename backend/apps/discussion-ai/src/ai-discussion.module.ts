import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  CHATBOT_EXCHANGE,
  ClientConfigModule,
  ClientConfigService,
  REDIS_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AiDiscussion, AiDiscussionSchema } from './schema/ai-discussion.schema';
import { AiDiscussionController } from './ai-discussion.controller';
import { AiDiscussionService } from './ai-discussion.service';
import { AiMessage, AiMessageSchema } from './schema/message.schema';
import Redis from 'ioredis';
import { RmqModule } from '@app/common';
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
    RmqModule.register({
      exchanges: [
        {
          name: CHATBOT_EXCHANGE,
          type: 'direct',
        }
      ]
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
