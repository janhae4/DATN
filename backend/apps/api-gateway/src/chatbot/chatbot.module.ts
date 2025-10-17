import { Module } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';
import { MulterModule } from '@nestjs/platform-express';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [
    ClientConfigModule, 
    MulterModule,
    AuthModule
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService, CLIENT_PROXY_PROVIDER.CHATBOT_CLIENT],
})
export class ChatbotModule {}
