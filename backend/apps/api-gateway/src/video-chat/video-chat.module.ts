import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { ClientConfigModule, ClientConfigService, VIDEO_CHAT_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    ClientConfigModule,
    AuthModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      useFactory: (configService: ClientConfigService) => ({
        exchanges: [
          {
            name: VIDEO_CHAT_EXCHANGE,
            type: 'direct',
          },
        ],
        uri: configService.getRMQUrl(),
      }),
      inject: [ClientConfigService],
    })
  ],
  controllers: [VideoChatController],
  providers: [VideoChatService],
})
export class VideoChatModule { }
