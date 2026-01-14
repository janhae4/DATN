import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { ClientConfigModule, EVENTS_EXCHANGE, SOCKET_EXCHANGE } from '@app/contracts';
import { RmqModule } from '@app/common';

@Module({
  imports: [
    ClientConfigModule,
    RmqModule.register({
      exchanges: [
        { name: SOCKET_EXCHANGE, type: 'direct' },
        { name: EVENTS_EXCHANGE, type: 'topic' },
      ]
    })
  ],
  controllers: [SocketController],
  providers: [SocketGateway, SocketController],
})
export class SocketModule { }