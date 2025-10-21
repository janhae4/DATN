import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    CLIENT_PROXY_PROVIDER.CHAT_CLIENT
  ],
})
export class ChatModule {}
