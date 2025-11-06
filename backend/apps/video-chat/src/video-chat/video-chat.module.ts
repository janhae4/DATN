import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { VideoChatController } from './video-chat.controller';
import { VIDEO_CHAT_CLIENT, VIDEO_CHAT_CLIENT_PORT } from '@app/contracts/constants';
import { VideoChatService } from './video-chat.service';
import { VideoChatGateway } from './video-chat.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: VIDEO_CHAT_CLIENT,
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: VIDEO_CHAT_CLIENT_PORT,
        },
      },
    ]),
    PrismaModule,
    ClientConfigModule
  ],
  controllers: [VideoChatController],
  providers: [VideoChatService, VideoChatGateway]
})
export class VideoChatModule { }