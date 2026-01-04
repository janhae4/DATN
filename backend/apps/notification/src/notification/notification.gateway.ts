import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { NotificationService } from './notification.service';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
export class NotificationGateway {
    @WebSocketServer()
    server: Server;

    constructor(private readonly notificationService: NotificationService) { }
}
