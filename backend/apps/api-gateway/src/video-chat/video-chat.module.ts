// api-gateway/src/video-chat/video-chat.module.ts (ĐÃ SỬA)

import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import {
  ClientConfigModule,
  ClientConfigService,
  VIDEO_CHAT_CLIENT,
} from '@app/contracts';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientConfigModule,
    ClientsModule.registerAsync([
      {
        name: VIDEO_CHAT_CLIENT,
        imports: [ClientConfigModule],
        inject: [ClientConfigService],
        useFactory: (configService: ClientConfigService) => {
          const port = configService.getVideoChatClientPort();
          console.log(`Initializing Video Chat client on port ${port}...`);
          return {
            transport: Transport.TCP,
            options: {
              port: port,
              retryAttempts: 3,
              retryDelay: 3000,
            },
          };
        },
      },
    ]),
  ],
  controllers: [VideoChatController],
  providers: [VideoChatService],
})
export class VideoChatModule {}