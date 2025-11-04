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
  FileStatus,
  JwtDto,
  MessageSnapshot,
  MessageUserChatbot,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PATTERN,
  NotificationEventDto,
  NotificationType,
  ResponseMessageDto,
  ResponseStreamDto,
  RPC_TIMEOUT,
  SENDER_SNAPSHOT_AI,
  SendMessageEventPayload,
  SummarizeDocumentDto,
} from '@app/contracts';
import * as cookie from 'cookie';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { DiscussionDocument } from 'apps/discussion/src/discussion/schema/discussion.schema';

interface AuthenticatedSocket extends Socket {
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
    ],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  protected readonly logger = new Logger(SocketGateway.name);

  constructor(private readonly amqpConnection: AmqpConnection) { }

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
      timeout: RPC_TIMEOUT,
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

  @SubscribeMessage("join_room")
  async joinRoom(
    client: AuthenticatedSocket,
    payload: { roomId: string }
  ) {
    const user = await this._validateToken(client);
    if (!user) return
    const rooms = Array.from(client.rooms);
    console.log(123, rooms, payload.roomId)
    const currentRooms = rooms.filter(r => r !== user.id);
    currentRooms.forEach(r => client.leave(r));
    client.join(payload.roomId);
  }


  private async handleInteraction(
    client: AuthenticatedSocket,
    payload: MessageUserChatbot,
  ) {
    const { userId, discussionId } = payload;
    const savedConversation = await this.amqpConnection.request<DiscussionDocument>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
      payload,
      timeout: RPC_TIMEOUT,
    });

    if (!savedConversation) {
      this.logger.error(
        `Client ${userId} - Saved conversation is null or undefined after handleUserMessage for user ${userId}`,
      );

      const payload = {
        type: NotificationType.FAILED,
        message: 'Failed to save your message.',
        title: 'Error',
        userId: userId,
      } as NotificationEventDto;
      this.sendNotificationToUser(payload);
      return null;
    }

    this.logger.log(
      `Client ${client.id} - Saved conversation: ${String(savedConversation._id)}`,
    );

    if (!discussionId) {
      this.logger.log(
        `Emitting new conversation ID: ${String(savedConversation._id)} for client ${client.id}`,
      );
      client.emit('conversation_started', {
        newdiscussionId: String(savedConversation._id),
      });
    }

    return savedConversation;
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
      const savedDiscussion = await this.amqpConnection.request<AiDiscussionDto>({
        exchange: CHATBOT_EXCHANGE,
        routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
        payload: {
          userId: user.id,
          message: question,
          discussionId: discussionId,
          teamId: teamId,
          socketId: client.id
        },
        timeout: 10000,
      })

      if (!savedDiscussion) {
        throw new Error('Failed to save message');
      }

      const broadcastRoom = teamId || discussionId;
      client.broadcast
        .to(broadcastRoom)
        .emit('new_user_message', savedDiscussion);

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
      timeout: 10000,
    })

    if (!savedDiscussion) {
      throw new Error('Failed to save message');
    }

    return {
      event: 'message_saved',
      data: savedDiscussion,
    };
  }

  // Giả định 'AuthenticatedSocket' đã được định nghĩa ở trên
  // Giả định 'ResponseStreamDto' (từ RAG) chứa 'membersToNotify'

  handleStreamResponse(response: ResponseStreamDto) {
    const { discussionId, socketId, content, type, membersToNotify } = response;

    const client = this.server.sockets.sockets.get(socketId) as
      | AuthenticatedSocket
      | undefined;

    if (!client) {
      this.logger.warn(`Client ${socketId} not found.`);
      return;
    }

    if (!membersToNotify || membersToNotify.length === 0) {
      this.logger.warn(`Invalid 'membersToNotify' list for stream on ${socketId}.`);
      client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, { content: "Lỗi: Không tìm thấy người nhận stream (stream session error)." });
      return;
    }

    this.logger.debug(`handleStreamResponse for ${client.id}, type: ${type}`);

    const emitToAll = (event: string, data: any) => {
      membersToNotify.forEach(userId => {
        this.server.to(userId).emit(event, data);
      });
    };

    if (type === 'chunk') {
      const currentMessage = client.data.accumulatedMessage || '';
      client.data.accumulatedMessage = currentMessage + content;
      emitToAll(CHATBOT_PATTERN.RESPONSE_CHUNK, content);
    } else if (type === 'start') {
      emitToAll(CHATBOT_PATTERN.RESPONSE_START, content);
    } else if (type === 'error') {
      emitToAll(CHATBOT_PATTERN.RESPONSE_ERROR, { content });
    } else if (type === "metadata") {
      try {
        client.data.streamMetadata = JSON.parse(content);
      } catch (e) {
        this.logger.warn(`Failed to parse metadata: ${content}`);
        client.data.streamMetadata = { error: "Invalid metadata received" };
      }
    } else if (type === 'end') {
      emitToAll(CHATBOT_PATTERN.RESPONSE_END, content);

      const fullMessage = client.data.accumulatedMessage || '';

      if (fullMessage.trim().length > 0) {
        this.amqpConnection.publish(
          CHATBOT_EXCHANGE,
          CHATBOT_PATTERN.CREATE,
          {
            discussionId,
            message: fullMessage,
            metadata: client.data.streamMetadata,
          },
        );
        this.logger.log(
          `Saved streamed AI message for ${socketId} to discussion ${discussionId}.`,
        );
      }

      delete client.data.accumulatedMessage;
      delete client.data.streamMetadata;
    }
  }



  sendNotificationToUser(event: NotificationEventDto) {
    this.server.to(event.userId).emit('notification', {
      title: event.title,
      message: event.message,
      type: event.type,
    });

    this.amqpConnection.publish(
      NOTIFICATION_EXCHANGE,
      NOTIFICATION_PATTERN.CREATE,
      event
    );
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

    if (offlineUsers.length) {
      this.logger.log(`Offline users: ${offlineUsers.join(', ')}`);
    }
  }



  handleFileStatus(fileId: string, fileName: string, fileStatus: FileStatus, userId: string, teamId?: string) {
    this.server.to(teamId || userId).emit('file_status', { id: fileId, status: fileStatus, name: fileName });
  }

  handleUploadCompletion(fileId: string, status: FileStatus, userId: string, teamId?: string) {
    this.server.to(teamId || userId).emit('file_status', { id: fileId, status: status });
  }
}
