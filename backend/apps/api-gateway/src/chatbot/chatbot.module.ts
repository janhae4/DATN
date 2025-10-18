import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';
@Module({
  imports: [ClientConfigModule, MulterModule, AuthModule],
  controllers: [ChatbotController],
  providers: [ChatbotService, CLIENT_PROXY_PROVIDER.CHATBOT_CLIENT],
})
export class ChatbotModule {}
