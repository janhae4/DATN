import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { StorageService } from './storage.service';

import {
  CHATBOT_EXCHANGE,
  ClientConfigModule,
  ClientConfigService,
  Conversation,
  ConversationSchema,
  EVENTS_EXCHANGE,
  TEAM_EXCHANGE,
  USER_EXCHANGE,
} from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
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
        name: Conversation.name,
        schema: ConversationSchema,
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
    ChatbotService,
    StorageService,
    ChatbotController
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule { }
