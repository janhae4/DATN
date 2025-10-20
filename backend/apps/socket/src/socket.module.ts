import { Module } from '@nestjs/common';
import { SocketController } from './socket.controller';
import { SocketGateway } from './socket.gateway';
import { CLIENT_PROXY_PROVIDER, ClientConfigModule } from '@app/contracts';

@Module({
  imports: [ClientConfigModule],
  controllers: [SocketController],
  providers: [
    SocketGateway,
    CLIENT_PROXY_PROVIDER.AUTH_CLIENT,
    CLIENT_PROXY_PROVIDER.RAG_CLIENT,
    CLIENT_PROXY_PROVIDER.NOTIFICATION_CLIENT,
    CLIENT_PROXY_PROVIDER.CHATBOT_CLIENT,
  ],
})
export class SocketModule { }
