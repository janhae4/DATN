import {
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
  MessageSnapshot,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PATTERN,
  NotificationResource,
  NotificationTargetType,
  ResponseMessageDto,
  SendMessageEventPayload,
  SendTaskNotificationDto,
  SummarizeDocumentDto,
} from '@app/contracts';
import * as cookie from 'cookie';
import { RmqClientService } from '@app/common';

export interface AuthenticatedSocket extends Socket {
  data: {
    user?: JwtDto;
    accumulatedMessage?: string;
    streamMetadata?: any;
    videoRoomId?: string;
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
      payload: { token: accessToken },
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
    const videoRoomId = client.data.videoRoomId;

    if (videoRoomId) {
      this.server.to(videoRoomId).emit('user_left_video', {
        socketId: client.id,
        userId: user?.id
      });
      this.logger.log(`Client ${client.id} left video room ${videoRoomId}`);
    }

    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.id})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (User: N/A)`);
    }
  }

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


  async publishNotification(dto: CreateNotificationDto) {
    this.logger.log(`Publishing notification: ${dto.metadata}`);
    this.server.to(dto.targetId).emit('notification', dto);
    return await this.amqpConnection.request({
      exchange: NOTIFICATION_EXCHANGE,
      routingKey: NOTIFICATION_PATTERN.CREATE,
      payload: dto
    });
  }

  handleNewMessage(payload: SendMessageEventPayload) {
    const {
      discussionId,
      _id,
      messageSnapshot,
      membersToNotify
    } = payload;

    const senderId = messageSnapshot.sender?._id;
    if (!senderId) {
      this.logger.error("Lỗi: Tin nhắn không có senderId", payload);
      return;
    }

    const messageDoc: ResponseMessageDto = {
      _id,
      discussionId,
      message: messageSnapshot as MessageSnapshot,
    };

    this.logger.log(`Received new message for ${discussionId}. Sender: ${senderId}`);

    if (!membersToNotify?.length) return;

    const onlineUsers: string[] = [];
    const offlineUsers: string[] = [];

    membersToNotify.forEach((userId) => {
      if (userId === senderId) {
        return;
      }

      const socketIds = this.server.sockets.adapter.rooms.get(userId);
      if (socketIds && socketIds.size) {
        onlineUsers.push(userId);
        socketIds.forEach((socketId) => {
          this.server.to(userId).emit('new_message', messageDoc);
        });
      } else {
        offlineUsers.push(userId);
      }
    });
  }




  handleFileStatus(fileId: string, fileName: string, fileStatus: FileStatus, userId: string, teamId?: string) {
    this.server.to(teamId || userId).emit('file_status', { id: fileId, status: fileStatus, name: fileName });
  }

  handleUploadCompletion(fileId: string, status: FileStatus, userId: string, teamId?: string) {
    this.server.to(teamId || userId).emit('file_status', { id: fileId, status: status });
  }
}