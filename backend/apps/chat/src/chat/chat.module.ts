import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import {
  CHAT_EXCHANGE,
  ClientConfigModule,
  ClientConfigService,
  EVENTS_EXCHANGE,
  USER_EXCHANGE,
} from '@app/contracts';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schema/conversation.schema';
import { Message, MessageSchema } from './schema/message.schema';
import { MessageHandlerErrorBehavior, RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
@Module({
  imports: [
    ClientConfigModule,
    MongooseModule.forRootAsync({
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        uri: cfg.getChatDatabaseUrl(),
      }),
    }),
    MongooseModule.forFeature([
      {
        name: Conversation.name,
        schema: ConversationSchema,
      },
      {
        name: Message.name,
        schema: MessageSchema,
      },
    ]),
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (cfg: ClientConfigService) => ({
        exchanges: [
          {
            name: EVENTS_EXCHANGE,
            type: 'topic',
          },
          {
            name: CHAT_EXCHANGE,
            type: 'direct'
          },
          {
            name: USER_EXCHANGE,
            type: 'direct'
          }
        ],
        uri: cfg.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatController]
})
export class ChatModule { }
