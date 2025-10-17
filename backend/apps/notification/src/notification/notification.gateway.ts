import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationEvent } from './dto/notification.event';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    if (!userId) {
      client.disconnect(true);
      return;
    }

    client.join(userId);

    console.log(`User ${userId} connected and joined room ${userId}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client ${client.id} disconnected`);
  }

  sendNotificationToUser(event: NotificationEvent) {
    this.server.to(event.userId).emit('notification', {
      title: event.title,
      message: event.message,
      type: event.type,
    });
  }
}
