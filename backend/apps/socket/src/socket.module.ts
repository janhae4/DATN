import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { ClientConfigModule, EVENTS_EXCHANGE, SOCKET_EXCHANGE, CHATBOT_EXCHANGE } from '@app/contracts';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register()
  ],
  controllers: [SocketController],
  providers: [SocketGateway],
})
export class SocketModule { }