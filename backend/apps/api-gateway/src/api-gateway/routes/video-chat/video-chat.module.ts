import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { CLIENT_PROXY_PROVIDER } from '@app/contracts/client-config/client-config.provider';

@Module({
  imports: [ClientConfigModule],
  controllers: [VideoChatController],
  providers: [VideoChatService, CLIENT_PROXY_PROVIDER.VIDEO_CHAT_CLIENT],
})
export class VideoChatModule {}
