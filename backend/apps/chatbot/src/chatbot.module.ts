import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatbotGateway } from './chatbot.gateway';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { StorageService } from './storage.service';
import { Conversation, ConversationSchema } from './schema/conversation.schema';
import {
  CLIENT_PROXY_PROVIDER,
  ClientConfigModule,
  ClientConfigService,
} from '@app/contracts';
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
  ],
  providers: [
    ChatbotGateway,
    CLIENT_PROXY_PROVIDER.AUTH_CLIENT,
    CLIENT_PROXY_PROVIDER.RAG_CLIENT,
    CLIENT_PROXY_PROVIDER.INGESTION_CLIENT,
    ChatbotService,
    StorageService,
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
