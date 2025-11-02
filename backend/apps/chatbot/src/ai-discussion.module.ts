import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  CHATBOT_EXCHANGE,
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  TEAM_EXCHANGE,
  USER_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AiDiscussion } from './schema/ai-discussion.schema';
import { AiDiscussionController } from './ai-discussion.controller';
import { AiDiscussionService } from './ai-discussion.service';
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
        schema: AiDiscussion,
      },
    ]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: CHATBOT_EXCHANGE,
            type: 'direct',
          },
          {
            name: USER_EXCHANGE,
            type: 'direct'
          },
          {
            name: TEAM_EXCHANGE,
            type: 'direct'
          },
          {
            name: EVENTS_EXCHANGE,
            type: 'topic'
          }
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      })
    })
  ],
  providers: [
    AiDiscussionController,
    AiDiscussionService
  ],
  controllers: [AiDiscussionController],
})
export class ChatbotModule { }
