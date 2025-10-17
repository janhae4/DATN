import { Module } from '@nestjs/common';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { ChatbotGateway } from './chatbot.gateway';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { StorageService } from './storage.service';

@Module({
  imports: [ClientConfigModule],
  providers: [
    ChatbotGateway, 
    CLIENT_PROXY_PROVIDER.AUTH_CLIENT,
    CLIENT_PROXY_PROVIDER.RAG_CLIENT,
    CLIENT_PROXY_PROVIDER.INGESTION_CLIENT,
    ChatbotService,
    StorageService
  ],
  controllers: [ChatbotController],
})
export class ChatbotModule { }
