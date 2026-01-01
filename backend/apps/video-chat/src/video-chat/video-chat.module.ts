import { Module } from '@nestjs/common';
import { VideoChatController } from './video-chat.controller';
import { VideoChatService } from './video-chat.service';
import { ClientConfigModule } from '@app/contracts/client-config/client-config.module';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Call, CallActionItem, CallParticipant, CallSummaryBlock, CallTranscript, ClientConfigService, VIDEO_CHAT_EXCHANGE } from '@app/contracts';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
    ClientConfigModule, 
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_VIDEO_CHAT_URL', 'postgres://postgres:postgres@localhost:5432/video_chat_db'),
        entities: [
          Call, 
          CallParticipant, 
          CallSummaryBlock, 
          CallActionItem, 
          CallTranscript
        ],
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),

    TypeOrmModule.forFeature([
      Call, 
      CallParticipant, 
      CallSummaryBlock, 
      CallActionItem,
      CallTranscript
    ]),
  ],
  controllers: [VideoChatController],
  providers: [VideoChatService],
})
export class VideoChatModule { }