import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { ChatGateway } from './chat.gateway';
import { VoiceGateway } from './voice.gateway';
import { ClientConfigModule } from '@app/contracts';
import { RmqModule } from '@app/common';
import { RedisServiceModule } from '@app/redis-service';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register(),
    RedisServiceModule
  ],
  controllers: [SocketController],
  providers: [SocketGateway, ChatGateway, VoiceGateway],
})
export class SocketModule { }