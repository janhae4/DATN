import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ClientConfigModule],
  controllers: [VideoChatController],
  providers: [VideoChatService, CLIENT_PROXY_PROVIDER.VIDEO_CHAT_CLIENT],
})
export class VideoChatModule {}
