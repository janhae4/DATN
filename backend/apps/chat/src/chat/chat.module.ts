import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import {
  CLIENT_PROXY_PROVIDER,
  ClientConfigModule,
  ClientConfigService,
} from '@app/contracts';
import { MongooseModule } from '@nestjs/mongoose';
import { Conversation, ConversationSchema } from './schema/conversation.schema';
import { Message, MessageSchema } from './schema/message.schema';

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
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    CLIENT_PROXY_PROVIDER.USER_CLIENT,
    CLIENT_PROXY_PROVIDER.EVENT_CLIENT,
    CLIENT_PROXY_PROVIDER.SOCKET_CLIENT,
  ],
})
export class ChatModule {}
