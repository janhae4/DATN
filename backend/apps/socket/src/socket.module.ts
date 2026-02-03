import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { ClientConfigModule, EVENTS_EXCHANGE, SOCKET_EXCHANGE, CHATBOT_EXCHANGE } from '@app/contracts';
import { RmqModule } from '@app/common';
import { ChatGateway } from './chat.gateway';
import { VoiceGateway } from './voice.gateway';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register({
      exchanges: [
        { name: SOCKET_EXCHANGE, type: 'direct' },
        { name: EVENTS_EXCHANGE, type: 'topic' },
        { name: CHATBOT_EXCHANGE, type: 'direct' },
      ]
    })
  ],
  controllers: [SocketController],
  providers: [SocketGateway, SocketController, ChatGateway, VoiceGateway],
})
export class SocketModule { }