import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ClientConfigModule],
  controllers: [VideoChatController],
  providers: [VideoChatService],
})
export class VideoChatModule {}
