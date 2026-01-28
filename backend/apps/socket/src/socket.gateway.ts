import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  AiDiscussionDto,
  AskQuestionDto,
  AUTH_EXCHANGE,
  AUTH_PATTERN,
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  CreateNotificationDto,
  FileStatus,
  JwtDto,
  MeetingSummaryResponseDto,
  MessageSnapshot,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PATTERN,
  NotificationResource,
  NotificationTargetType,
  ResponseMessageDto,
  ResponseStreamDto,
  SendMessageEventPayload,
  SendTaskNotificationDto,
  SummarizeDocumentDto,
  User,
  VIDEO_CHAT_EXCHANGE,
  VIDEO_CHAT_PATTERN,
} from '@app/contracts';
import * as cookie from 'cookie';
import { RmqClientService } from '@app/common';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: JwtDto;
    accumulatedMessage?: string;
    streamMetadata?: any;
  };
}
@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:5000',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://api_gateway:3000',
      'http://frontend:5000',
    ],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger(SocketGateway.name);

  constructor(private readonly amqpConnection: RmqClientService) { }

  async _validateToken(client: AuthenticatedSocket): Promise<JwtDto | null> {
    const accessToken = cookie.parse(
      client.handshake.headers.cookie || '',
    ).accessToken;

    if (!accessToken) {
      this.logger.warn(
        `Client ${client.id} - Disconnected, accessToken not found.`,
      );
      client.disconnect();
      return null;
    }

    this.logger.log(`Client ${client.id} - Access token found!`);

    const user = await this.amqpConnection.request<JwtDto>({
      exchange: AUTH_EXCHANGE,
      routingKey: AUTH_PATTERN.VALIDATE_TOKEN,
      payload: accessToken,
    });

    if (!user) {
      this.logger.warn(`Client ${client.id} - Disconnected, invalid token.`);
      client.disconnect();
      return null;
    }

    return user
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const user = await this._validateToken(client)
      if (!user) return
      this.logger.log(`Client ${client.id} - Authenticated: ${user.id}`);
      client.data.user = user;
      client.join(user.id)
    } catch (error) {
      const e = error as Error;
      this.logger.error(
        `Client ${client.id} - Failed to validate token: ${e.message}`,
      );
      client.disconnect();
    }
  }


  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data.user as JwtDto;
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.id})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (User: N/A)`);
    }
  }

  async sendKickRequestToHost(hostUserId: string, message: string, roomId: string, targetUserId: string) {
    this.server.to(hostUserId).emit(
      'request-kick',
      { message, roomId, targetUserId }
    );
    this.logger.log(`Sent kick request to host ${hostUserId}`);
  }

  async sendUnKickRequestToHost(hostUserId: string, message: string, roomId: string, targetUserId: string) {
    this.server.to(hostUserId).emit(
      'request-unkick',
      { message, roomId, targetUserId }
    );
    this.logger.log(`Sent unkick request to host ${hostUserId}`);
  }

  async notifyUserKicked(targetUserId: string, message: string, roomId: string) {
    this.server.to(targetUserId).emit(
      'you-are-kicked',
      { message }
    );

    this.server.to(roomId).emit('user_left_video', {
      userId: targetUserId,
      socketId: null,
      reason: 'KICKED'
    });

    const sockets = await this.server.in(targetUserId).fetchSockets();
    for (const socket of sockets) {
      socket.leave(roomId);
    }

    this.logger.log(`User ${targetUserId} was kicked from room ${roomId}`);
  }

  async notifyUserUnKicked(targetUserId: string, message: string, roomId: string) {
    this.server.to(targetUserId).emit(
      'you-are-unkicked',
      { message }
    );
    this.logger.log(`User ${targetUserId} was un-kicked from room ${roomId}`);
  }

  // @SubscribeMessage("join_room")
  // async joinRoom(
  //   client: AuthenticatedSocket,
  //   payload: { roomId: string }
  // ) {
  //   const user = await this._validateToken(client);
  //   if (!user) return
  //   const rooms = Array.from(client.rooms);
  //   console.log(123, rooms, payload.roomId)
  //   const currentRooms = rooms.filter(r => r !== user.id);
  //   currentRooms.forEach(r => client.leave(r));
  //   client.join(payload.roomId);
  // }

  // @SubscribeMessage('leave_room')
  // async handleRoomDisconnect(
  //   @ConnectedSocket() client: AuthenticatedSocket,
  //   @MessageBody() payload: { roomId: string }
  // ) {
  //   await client.leave(payload.roomId);
  //   this.logger.log(`Client ${client.id} left room ${payload.roomId}`);
  // }

  async notifyTaskUpdate(payload: SendTaskNotificationDto) {
    this.server.to(payload.teamId).emit('task_update', payload);
    this.logger.log(`Emitted task_update to room ${payload.teamId}`);

    const { action, actor, details } = payload;

    let messageContent = '';
    let notificationType = 'INFO';

    const taskName = details?.taskTitle ? `"${details.taskTitle}"` : 'a task';
    const actorName = actor.name

    switch (action) {
      case 'APPROVED':
        messageContent = `${actorName} approved task ${taskName}`;
        notificationType = 'SUCCESS';
        break;
      case 'REJECTED':
        messageContent = `${actorName} rejected task ${taskName}`;
        notificationType = 'ERROR';
        break;
      case 'CREATE':
        messageContent = `${actorName} created new task ${taskName}`;
        notificationType = 'INFO';
        break;
      case 'DELETE':
        messageContent = `${actorName} deleted task ${taskName}`;
        notificationType = 'WARNING';
        break;
      default:
        messageContent = `${actorName} updated task ${taskName}`;
        notificationType = 'INFO';
    }

    await this.amqpConnection.request({
      exchange: NOTIFICATION_EXCHANGE,
      routingKey: NOTIFICATION_PATTERN.CREATE,
      payload: {
        title: 'Task Update',
        message: messageContent,
        type: notificationType,

        targetType: NotificationTargetType.TEAM,
        targetId: payload.teamId,

        resourceType: NotificationResource.TASK,
        resourceId: payload.taskIds[0],
        actorId: actor.id,

        metadata: {
          action: payload.action,
          originalUrl: ""
        }
      } as CreateNotificationDto
    });
  }

  @SubscribeMessage('join_video_room')
  async handleJoinVideoRoom(
    client: AuthenticatedSocket,
    payload: { roomId: string; teamId: string; userInfo: User; role: string }) {
    const user = await this._validateToken(client);
    if (!user) return

    const { roomId, userInfo, role } = payload;

    client.join(roomId);
    this.logger.log(`User ${user.id} joining video room ${roomId}`);

    client.to(roomId).emit('user_joined_video', {
      userInfo,
      socketId: client.id,
      role
    });
  }

  @SubscribeMessage('user_toggle_audio')
  async handleUserToggleAudio(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { roomId: string; userId: string; isMuted: boolean }
  ) {
    client.to(data.roomId).emit('user_toggle_audio', {
      userId: data.userId,
      isMuted: data.isMuted
    });
  }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: {
      sdp: any; targetUserId: string; roomId: string, userInfo: Partial<User>
    }
  ) {
    this.logger.debug(`Signaling: Offer from ${client.id} to ${data.targetUserId}`);

    client.to(data.targetUserId).emit('offer', {
      sdp: data.sdp,
      senderId: client.data.user?.id,
      senderSocketId: client.id,
      roomId: data.roomId,
      userInfo: data.userInfo
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { sdp: any; targetUserId: string; roomId: string }
  ) {
    client.to(data.targetUserId).emit('answer', {
      sdp: data.sdp,
      senderId: client.data.user?.id,
      senderSocketId: client.id,
      roomId: data.roomId
    });
  }

  @SubscribeMessage('ice_candidate')
  handleIceCandidate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { candidate: any; targetUserId: string; roomId: string }
  ) {
    client.to(data.targetUserId).emit('ice_candidate', {
      candidate: data.candidate,
      senderId: client.data.user?.id,
      senderSocketId: client.id,
      roomId: data.roomId
    });
  }

  @SubscribeMessage('req_start_speech_ai')
  handleReqStartSpeechAi(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string }
  ) {
    console.log(payload);
    client.to(payload.roomId).emit('req_start_speech_ai');
  }

  @SubscribeMessage('send_transcript')
  async handleSendTranscript(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { content: string; roomId: string, userId: string }
  ) {
    const user = await this._validateToken(client);
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

  @SubscribeMessage('end_call')
  handleEndCall(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { roomId: string }
  ) {
    this.amqpConnection.publish(
      VIDEO_CHAT_EXCHANGE,
      'video_chat.call.end',
      {
        roomId: payload.roomId
      }
    );
  }

  @SubscribeMessage(CHATBOT_PATTERN.ASK_QUESTION)
  async handleAskQuestion(
    client: AuthenticatedSocket,
    payload: AskQuestionDto,
  ) {
    const user = client.data.user;
    if (!user) {
      this.logger.warn(`Invalid user on ask_question for client ${client.id}.`);
      return;
    }

    const { question, discussionId, teamId } = payload;
    this.logger.log(`Forwarding ask_question from User ${user.id} to AiDiscussionService`);

    try {
      const { discussion: savedDiscussion, membersToNotify } = await this.amqpConnection.request<{ discussion: AiDiscussionDto, membersToNotify: string[] }>({
        exchange: CHATBOT_EXCHANGE,
        routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
        payload: {
          userId: user.id,
          message: question,
          discussionId: discussionId,
          teamId: teamId,
          socketId: client.id
        },
      })

      if (!savedDiscussion) {
        throw new Error('Failed to save message');
      }

      this.logger.debug('Members to notify:', membersToNotify);
      this.logger.debug('Saved discussion:', savedDiscussion);
      membersToNotify.forEach(userId => {
        this.server.to(userId).emit('new_message', {
          _id: savedDiscussion.latestMessage,
          message: savedDiscussion.latestMessageSnapshot,
          teamId,
        });
      });

      return {
        event: 'message_saved',
        data: savedDiscussion,
      };

    } catch (error) {
      this.logger.error(`Error handling ask_question: ${error.message}`);
      return {
        event: 'error',
        data: { message: error.message || 'Failed to ask question' },
      };
    }
  }

  @SubscribeMessage(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT)
  async handleSummarizeDocument(
    client: AuthenticatedSocket,
    payload: SummarizeDocumentDto,
  ) {
    const user = client.data.user;
    if (!user) return;

    const { fileId, discussionId, teamId } = payload;
    const messageContent = `Yêu cầu tóm tắt tài liệu: ${fileId}`;

    const savedDiscussion = await this.amqpConnection.request<AiDiscussionDto>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
      payload: {
        sender: user,
        message: messageContent,
        discussionId: discussionId,
        teamId: teamId,
        summarizeFileName: fileId,
        socketId: client.id
      },
    })

    if (!savedDiscussion) {
      throw new Error('Failed to save message');
    }

    return {
      event: 'message_saved',
      data: savedDiscussion,
    };
  }


  private summaryBuffer = new Map<string, string>();
  async handleMeetingSummaryStream(payload: MeetingSummaryResponseDto) {
    const { roomId, event, data } = payload;
    if (data.status === 'start') {
      this.logger.log(`Start streaming summary for Room: ${roomId}`);
      this.summaryBuffer.set(roomId, "");
    } else if (data.status === 'chunk') {
      const currentText = this.summaryBuffer.get(roomId) || "";
      this.summaryBuffer.set(roomId, currentText + data.content);
    }
    else if (data.status === 'end') {
      const fullMessage = this.summaryBuffer.get(roomId);
      this.logger.log(`End streaming Room ${roomId}. Full Message:`);
      console.log('Summary Buffer', fullMessage);
      this.summaryBuffer.delete(roomId);
    }

    this.server.to(roomId).emit(event, data);
  }

  async publishNotification(dto: CreateNotificationDto) {
    this.logger.log(`Publishing notification: ${dto.metadata}`);
    this.server.to(dto.targetId).emit('notification', dto);
    return await this.amqpConnection.request({
      exchange: NOTIFICATION_EXCHANGE,
      routingKey: NOTIFICATION_PATTERN.CREATE,
      payload: dto
    }); 
  }




  handleFileStatus(fileId: string, fileName: string, fileStatus: FileStatus, userId: string, teamId?: string) {
    this.server.to(teamId || userId).emit('file_status', { id: fileId, status: fileStatus, name: fileName });
  }

  handleUploadCompletion(fileId: string, status: FileStatus, userId: string, teamId?: string) {
    this.server.to(teamId || userId).emit('file_status', { id: fileId, status: status });
  }
}