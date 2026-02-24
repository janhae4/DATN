import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { ClientConfigModule, ClientConfigService, VIDEO_CHAT_EXCHANGE } from '@app/contracts';
import { RmqModule } from '@app/common';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    RmqModule.register()
  ],
  controllers: [VideoChatController],
  providers: [VideoChatService],
})
export class VideoChatModule { }
