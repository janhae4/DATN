
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RmqClientService } from '@app/common';
import * as cookie from 'cookie';
import { 
  JwtDto, AUTH_EXCHANGE, AUTH_PATTERN, User, 
  VIDEO_CHAT_EXCHANGE, VIDEO_CHAT_PATTERN 
} from '@app/contracts';
import * as socketGateway from './socket.gateway';

// Voice / video-call signaling namespace.
// - Authenticates clients via accessToken cookie (validated via AUTH service)
// - Relays WebRTC signaling messages (offer/answer/ice_candidate)
// - Broadcasts media state changes (mute/video/screen share)
// - Publishes transcripts and end-call events to RMQ

@WebSocketGateway({
  namespace: 'voice',
  cors: {
    origin: [
      'http://localhost:5000',
      'http://localhost:3000',
      'http://frontend:5000',
    ],
    credentials: true,
  },
})
export class VoiceGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(VoiceGateway.name);

  constructor(private readonly amqpConnection: RmqClientService) {}

  // Authenticate the socket connection using the access token cookie.
  // The socket is joined to a private room keyed by `user.id` for direct signaling.
  async handleConnection(client: socketGateway.AuthenticatedSocket) {
    try {
      const accessToken = cookie.parse(client.handshake.headers.cookie || '').accessToken;
      if (!accessToken) {
        client.disconnect();
        return;
      }

      const user = await this.amqpConnection.request<JwtDto>({
        exchange: AUTH_EXCHANGE,
        routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
        payload: accessToken,
      });

      if (!user) {
        client.disconnect();
        return;
      }

      client.data.user = user;
      client.join(user.id); 
      this.logger.log(`User ${user.id} connected to Voice Namespace`);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: socketGateway.AuthenticatedSocket) {
    this.logger.log(`Client disconnected from Voice Namespace: ${client.id}`);
  }

  // Join a shared video room; notify other participants in the room.
  @SubscribeMessage('join_video_room')
  async handleJoinVideoRoom(
    client: socketGateway.AuthenticatedSocket,
    payload: { roomId: string; teamId: string; userInfo: User; role: string }
  ) {
    client.join(payload.roomId);
    this.logger.log(`User ${client.data.user?.id} joining video room ${payload.roomId}`);

    client.to(payload.roomId).emit('user_joined_video', {
      userInfo: payload.userInfo,
      socketId: client.id,
      role: payload.role
    });
  }

  // WebRTC SDP offer relay (caller -> callee).
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() data: { sdp: any; targetUserId: string; roomId: string, userInfo: Partial<User> }
  ) {
    client.to(data.targetUserId).emit('offer', {
      sdp: data.sdp,
      senderId: client.data.user?.id,
      senderSocketId: client.id,
      roomId: data.roomId,
      userInfo: data.userInfo
    });
  }

  // WebRTC SDP answer relay (callee -> caller).
  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() data: { sdp: any; targetUserId: string; roomId: string }
  ) {
    client.to(data.targetUserId).emit('answer', {
      sdp: data.sdp,
      senderId: client.data.user?.id,
      senderSocketId: client.id,
      roomId: data.roomId
    });
  }

  // WebRTC ICE candidate relay.
  @SubscribeMessage('ice_candidate')
  handleIceCandidate(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() data: { candidate: any; targetUserId: string; roomId: string }
  ) {
    client.to(data.targetUserId).emit('ice_candidate', {
      candidate: data.candidate,
      senderId: client.data.user?.id,
      senderSocketId: client.id,
      roomId: data.roomId
    });
  }

  // Broadcast audio mute/unmute state to the room.
  @SubscribeMessage('user_toggle_audio')
  handleUserToggleAudio(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isMuted: boolean }
  ) {
    client.to(data.roomId).emit('user_toggle_audio', {
      userId: client.data.user?.id,
      isMuted: data.isMuted
    });
  }

  // Broadcast camera on/off state to the room.
  @SubscribeMessage('user_toggle_video')
  handleUserToggleVideo(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() data: { roomId: string; isVideoOff: boolean }
  ) {
    client.to(data.roomId).emit('user_toggle_video', {
      userId: client.data.user?.id,
      isVideoOff: data.isVideoOff
    });
  }

  // Broadcast screen-share start event to the room.
  @SubscribeMessage('user_start_share_screen')
  handleStartShareScreen(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    client.to(data.roomId).emit('user_start_share_screen', {
      userId: client.data.user?.id
    });
  }

  // Broadcast screen-share stop event to the room.
  @SubscribeMessage('user_stop_share_screen')
  handleStopShareScreen(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() data: { roomId: string }
  ) {
    client.to(data.roomId).emit('user_stop_share_screen', {
      userId: client.data.user?.id
    });
  }

  // --- CÁC TÍNH NĂNG KHÁC (Kick, Transcript, AI Speech) ---

  // Request speech-to-text AI for the room.
  @SubscribeMessage('req_start_speech_ai')
  handleReqStartSpeechAi(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() payload: { roomId: string }
  ) {
    client.to(payload.roomId).emit('req_start_speech_ai');
  }

  // Publish a transcript to the room.
  @SubscribeMessage('send_transcript')
  async handleSendTranscript(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() payload: { content: string; roomId: string, userId: string }
  ) {
    const user = client.data.user;
    if (!user) return;

    this.amqpConnection.publish(
      VIDEO_CHAT_EXCHANGE,
      VIDEO_CHAT_PATTERN.RECEIVE_TRANSCRIPT,
      {
        roomId: payload.roomId,
        userId: user.id,
        content: payload.content,
        timestamp: new Date().toISOString()
      }
    );
  }

  // Notify backend services that a call has ended.
  @SubscribeMessage('end_call')
  handleEndCall(
    @ConnectedSocket() client: socketGateway.AuthenticatedSocket,
    @MessageBody() payload: { roomId: string }
  ) {
    this.amqpConnection.publish(VIDEO_CHAT_EXCHANGE, 'video_chat.call.end', { roomId: payload.roomId });
  }

  // --- HÀM HỖ TRỢ CONTROLLER GỌI XUỐNG (Kick/Unkick) ---
  
  // Ask the host to approve kicking a user from the room.
  async sendKickRequestToHost(hostUserId: string, message: string, roomId: string, targetUserId: string) {
    this.server.to(hostUserId).emit('request-kick', { message, roomId, targetUserId });
  }

  // Ask the host to approve un-kicking a user.
  async sendUnKickRequestToHost(hostUserId: string, message: string, roomId: string, targetUserId: string) {
    this.server.to(hostUserId).emit('request-unkick', { message, roomId, targetUserId });
  }

  // Inform the target user and force all their sockets to leave the room.
  async notifyUserKicked(targetUserId: string, message: string, roomId: string) {
    this.server.to(targetUserId).emit('you-are-kicked', { message });
    this.server.to(roomId).emit('user_left_video', {
      userId: targetUserId,
      socketId: null,
      reason: 'KICKED'
    });
    const sockets = await this.server.in(targetUserId).fetchSockets();
    for (const socket of sockets) {
      socket.leave(roomId);
    }
  }

  // Inform the target user that they were un-kicked.
  async notifyUserUnKicked(targetUserId: string, message: string, roomId: string) {
    this.server.to(targetUserId).emit('you-are-unkicked', { message });
  }
}