import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { ClientConfigService, VIDEO_CHAT_EXCHANGE } from '@app/contracts';
@Module({
  imports: [
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: VIDEO_CHAT_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: config.getRMQUrl(),
        enableControllerDiscovery: true
      }),
    }),
    PrismaModule,
    ClientConfigModule
  ],
  controllers: [VideoChatController],
  providers: [VideoChatService],
})
export class VideoChatModule { }
