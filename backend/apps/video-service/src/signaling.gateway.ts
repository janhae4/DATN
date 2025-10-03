import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RoomInfo } from '@app/contracts/video-chat/room-info.type';

@WebSocketGateway({
  namespace: '/webrtc',
  cors: {
    origin: process.env.FRONTEND_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
  pingInterval: 25000,
  pingTimeout: 20000,
})

export class SignalingGateway implements OnGatewayConnection, OnGatewayDisconnect {


  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(SignalingGateway.name);
  private rooms = new Map<string, RoomInfo>();
  private socketRoom = new Map<string, string>();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const roomId = this.socketRoom.get(client.id);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    room.members.delete(client.id);
    this.socketRoom.delete(client.id);

    client.to(roomId).emit('peer-left', { socketId: client.id });

    if (room.members.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  @SubscribeMessage('join')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const { roomId } = payload;
    if (!roomId) return;

    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        members: new Set(),
        pending: new Set(),
        owner: client.id,
        isPrivate: false,
        maxSize: 55,
        createdAt: new Date(),
      };
      this.rooms.set(roomId, room);
    }

    if (room.members.size >= room.maxSize) {
      client.emit('room-full', { roomId });
      return;
    }

    client.join(roomId);

    room.members.add(client.id);
    this.socketRoom.set(client.id, roomId);

    const others = [...room.members].filter((id) => id !== client.id);
    client.emit('joined', { roomId, peers: others });

    client.to(roomId).emit('peer-joined', { socketId: client.id });
  }

  @SubscribeMessage('leave')
  handleLeave(@ConnectedSocket() client: Socket) {
    const roomId = this.socketRoom.get(client.id);
    if (!roomId) return;
    const room = this.rooms.get(roomId);
    if (!room) return;

    client.leave(roomId);
    room.members.delete(client.id);
    this.socketRoom.delete(client.id);

    client.to(roomId).emit('peer-left', { socketId: client.id });
    if (room.members.size === 0) {
      this.rooms.delete(roomId);
    }
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; sdp: any; to?: string },
  ) {
    const { roomId, sdp, to } = payload;
    if (to) {
      this.server.to(to).emit('offer', { from: client.id, sdp });
    } else {
      client.to(roomId).emit('offer', { from: client.id, sdp });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; sdp: any; to?: string },
  ) {
    const { roomId, sdp, to } = payload;
    if (to) {
      this.server.to(to).emit('answer', { from: client.id, sdp });
    } else {
      client.to(roomId).emit('answer', { from: client.id, sdp });
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; candidate: any; to?: string },
  ) {
    const { roomId, candidate, to } = payload;
    if (to) {
      this.server.to(to).emit('ice-candidate', { from: client.id, candidate });
    } else {
      client.to(roomId).emit('ice-candidate', { from: client.id, candidate });
    }
  }
}
