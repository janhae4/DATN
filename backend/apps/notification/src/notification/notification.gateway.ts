import { WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { AuthenticatedGateway } from '@app/common';
import { AUTH_CLIENT, JwtDto, NotificationEventDto } from '@app/contracts';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway extends AuthenticatedGateway {
  constructor(
    @Inject(AUTH_CLIENT)
    protected authClient: ClientProxy,
  ) {
    super(authClient, NotificationGateway.name);
  }

  protected onClientAuthenticated(client: Socket, user: JwtDto): void {
    client.join(user.id);
    this.logger.log(`User ${user.id} joined notification room: ${user.id}`);
  }

  sendNotificationToUser(event: NotificationEventDto) {
    this.server.to(event.userId).emit('notification', {
      title: event.title,
      message: event.message,
      type: event.type,
    });
  }
}
