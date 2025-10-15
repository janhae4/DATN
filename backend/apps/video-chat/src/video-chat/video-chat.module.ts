import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { VideoChatGateway } from './video-chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
@Module({
  imports: [PrismaModule, ClientConfigModule],
  controllers: [VideoChatController],
  providers: [VideoChatService, VideoChatGateway],
})
export class VideoChatModule {}
