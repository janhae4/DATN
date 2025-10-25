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
  AskQuestionDto,
  AUTH_EXCHANGE,
  AUTH_PATTERN,
  CHATBOT_EXCHANGE,
  CHATBOT_PATTERN,
  ConversationDocument,
  JwtDto,
  MessageDto,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PATTERN,
  NotificationEventDto,
  NotificationType,
  ResponseStreamDto,
  RPC_TIMEOUT,
  SendMessageEventPayload,
  SummarizeDocumentDto,
} from '@app/contracts';
import * as cookie from 'cookie';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: JwtDto;
    accumulatedMessage?: string;
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


  async handleConnection(client: AuthenticatedSocket) {
    try {
      const accessToken = cookie.parse(
        client.handshake.headers.cookie || '',
      ).accessToken;

      if (!accessToken) {
        this.logger.warn(
          `Client ${client.id} - Disconnected, accessToken not found.`,
        );
        client.disconnect();
        return;
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
        return;
      }

      this.logger.log(`Client ${client.id} - Authenticated: ${user.id}`);
      client.data.user = user;
      client.join(user.id);
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

  private async handleInteraction(
    client: AuthenticatedSocket,
    payload: MessageDto,
  ): Promise<ConversationDocument | null> {
    const { message, userId, conversationId, role } = payload;
    const savedConversation = await this.amqpConnection.request<ConversationDocument>({
      exchange: CHATBOT_EXCHANGE,
      routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
      payload: {
        message,
        conversationId,
        role,
        userId,
      } as MessageDto,
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

    if (!conversationId) {
      this.logger.log(
        `Emitting new conversation ID: ${String(savedConversation._id)} for client ${client.id}`,
      );
      client.emit('conversation_started', {
        newConversationId: String(savedConversation._id),
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

    const { question, conversationId } = payload;
    this.logger.log(
      `Received ask_question from ${client.id} (User: ${user.id}): ${question}`,
    );

    const savedConversation = await this.handleInteraction(client, {
      message: question,
      userId: user.id,
      conversationId,
      role: 'user',
    } as MessageDto);

    if (!savedConversation) {
      return;
    }

    const chatHistory = savedConversation.messages
      .slice(-20)
      .map((message) => ({
        role: message.role.replace('ai', 'you').replace('user', 'me'),
        content: message.content,
      }));

    const requestPayload = {
      userId: user.id,
      question,
      socketId: client.id,
      conversationId: String(savedConversation._id),
      chatHistory,
    };

    this.logger.log(
      `Emitting to RAG_CLIENT (ask_question) for user ${user.id}`,
    );
    
    await this.amqpConnection.publish(
      CHATBOT_EXCHANGE,
      CHATBOT_PATTERN.ASK_QUESTION,
      requestPayload
    );
  }

  @SubscribeMessage(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT)
  async handleSummarizeDocument(
    client: AuthenticatedSocket,
    payload: SummarizeDocumentDto,
  ): Promise<void> {
    const user = client.data.user;
    if (!user) {
      this.logger.warn(
        `Invalid user on summarize_document for client ${client.id}.`,
      );
      return;
    }

    const { fileName, conversationId } = payload;
    this.logger.log(
      `Received summarize_document from ${client.id} (User: ${user.id}): ${fileName}`,
    );

    const messageContent = `Yêu cầu tóm tắt tài liệu: ${fileName}`;
    const savedConversation = await this.handleInteraction(client, {
      message: messageContent,
      userId: user.id,
      conversationId,
      role: 'user',
    } as MessageDto);

    if (!savedConversation) {
      return;
    }

    const requestPayload = {
      userId: user.id,
      fileName,
      socketId: client.id,
      conversationId: String(savedConversation._id),
    };

    this.logger.log(
      `Emitting to RAG_CLIENT (summarize_document) for user ${user.id}`,
    );
    this.amqpConnection.publish(
      CHATBOT_EXCHANGE,
      CHATBOT_PATTERN.SUMMARIZE_DOCUMENT,
      requestPayload
    );
  }

  handleStreamResponse(response: ResponseStreamDto) {
    const { conversationId, socketId, content, type } = response;
    const client = this.server.sockets.sockets.get(socketId) as
      | AuthenticatedSocket
      | undefined;
    if (!client) {
      this.logger.warn(`Client ${socketId} not found.`);
      return;
    }

    this.logger.debug(`handleStreamResponse for ${client.id}, type: ${type}`);

    if (type === 'chunk') {
      const currentMessage = client.data.accumulatedMessage || '';
      client.data.accumulatedMessage = currentMessage + content;
      client.emit(CHATBOT_PATTERN.RESPONSE_CHUNK, content);
    } else if (type === 'error') {
      client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, content);
    } else if (type === 'end') {
      client.emit(CHATBOT_PATTERN.RESPONSE_END, content);
      const fullMessage = client.data.accumulatedMessage || '';
      if (fullMessage.trim().length > 0) {
        const user = client.data.user;
        if (user) {
          try {
            this.handleInteraction(client, {
              userId: user.id,
              message: fullMessage,
              conversationId,
              role: 'ai',
            });
          } catch (error) {
            this.logger.error(error);
          }
        }
      } else {
        this.logger.warn(
          `Skipping save for AI message on ${socketId} because message was empty.`,
        );
      }
      delete client.data.accumulatedMessage;
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
      id,
      conversationId,
      participants,
      content,
      attachments,
      sender,
      createdAt,
    } = payload;
    this.logger.log(`Received new message for conversation ${conversationId}`);

    try {
      const participantIds = participants.reduce((acc, participant) => {
        if (participant._id !== sender._id) {
          acc.push(participant._id);
        }
        return acc;
      }, [] as string[]);

      console.log(participantIds)

      if (participants.length === 0) {
        this.logger.warn(
          `No participants found for conversation ${conversationId}`,
        );
        return;
      }

      this.logger.log(
        `Broadcasting to participants: ${participantIds.join(', ')}`,
      );
      participantIds.forEach((userId) => {
        this.server.to(userId).emit('new_message', {
          _id: id,
          conversationId,
          content,
          sender,
          attachments,
          createdAt,
        });
      });
    } catch (error) {
      this.logger.error('Failed to handle new message event', error);
    }
  }
}
