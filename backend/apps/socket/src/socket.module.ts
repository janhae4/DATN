import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { CHATBOT_EXCHANGE, ClientConfigModule, ClientConfigService, SOCKET_EXCHANGE } from '@app/contracts';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';

@Module({
  imports: [
    ClientConfigModule,
    RabbitMQModule.forRootAsync({
      imports: [ClientConfigModule],
      inject: [ClientConfigService],
      useFactory: (config: ClientConfigService) => ({
        exchanges: [
          {
            name: SOCKET_EXCHANGE,
            type: 'direct',
          },
          {
            name: CHATBOT_EXCHANGE,
            type: 'direct',
          }
        ],
        uri: config.getRMQUrl(),
        connectionInitOptions: { wait: false },
      }),
    })
  ],
  controllers: [SocketController],
  providers: [SocketGateway, SocketController],
})
export class SocketModule { }