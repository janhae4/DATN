import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  CHATBOT_EXCHANGE,
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  REDIS_CLIENT,
  TEAM_EXCHANGE,
  USER_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AiDiscussionController } from './ai-discussion.controller';
import { AiDiscussionService } from './ai-discussion.service';
import { AiDiscussion, AiDiscussionSchema } from 'apps/discussion-ai/src/schema/ai-discussion.schema';
import { AiMessage, AiMessageSchema } from 'apps/discussion-ai/src/schema/message.schema';
import { AuthModule } from '../auth/auth.module';
import Redis from 'ioredis';
@Module({
  imports: [
    AuthModule,
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
      provide: REDIS_CLIENT,
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => {
        return new Redis({
          host: config.getRedisHost() || 'localhost',
          port: config.getRedisClientPort() || 6379,
        });
      },
    },
  ],
  controllers: [AiDiscussionController],

})
export class AiDiscussionModule { }