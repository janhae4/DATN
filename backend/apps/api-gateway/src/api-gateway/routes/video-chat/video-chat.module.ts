import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { ClientsModule } from '@nestjs/microservices';
import { ClientConfigService } from '@app/contracts/client-config/client-config.service';
import { VIDEO_CHAT_CLIENT } from '@app/contracts/constants';
import { VideoChatService } from './video-chat.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: VIDEO_CHAT_CLIENT,
        useFactory: (clientConfigService: ClientConfigService) =>
          clientConfigService.videoChatClientOptions,
        inject: [ClientConfigService],
      },
    ]),
  ],
  controllers: [VideoChatController],
  providers: [ClientConfigService, VideoChatService],
})
export class VideoChatModule {}
