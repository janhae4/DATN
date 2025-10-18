import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { Inject, Logger } from '@nestjs/common';
import { AUTH_CLIENT, RAG_CLIENT } from '@app/contracts/constants';
import { ClientProxy, Payload } from '@nestjs/microservices';
import { AUTH_PATTERN } from '@app/contracts/auth/auth.patterns';
import { firstValueFrom } from 'rxjs';
import { JwtDto } from '@app/contracts/auth/jwt.dto';
import { CHATBOT_PATTERN } from '../../../libs/contracts/src/chatbot/chatbot.pattern';
import type { AskQuestionPayload } from './interface/ask-question.itf';
import { ChatbotService } from './chatbot.service';
import { ConversationDocument } from './schema/conversation.schema';
import { ResponseStreamPayload } from './interface/response-stream.itf';

interface SummarizeDocumentPayload {
  fileName: string;
  conversationId?: string;
}

@WebSocketGateway({
  cors: {
    origin: `http://localhost:5000`,
    credentials: true
  }
})
export class ChatbotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatbotGateway.name);

  constructor(
    @Inject(AUTH_CLIENT) private readonly authClient: ClientProxy,
    @Inject(RAG_CLIENT) private readonly ragClient: ClientProxy,
    private readonly chatbotService: ChatbotService
  ) { }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    const cookieString = client.handshake.headers.cookie;
    if (!cookieString) {
      this.logger.warn(`Client ${client.id} - Disconnected, cookie not found.`);
      client.disconnect();
      return;
    }

    try {
      const parsedCookies = cookie.parse(cookieString);
      const accessToken = parsedCookies.accessToken;
      this.logger.log(`Client ${client.id} - Access token found!`);

      const user = await firstValueFrom<JwtDto>(
        this.authClient.send(AUTH_PATTERN.VALIDATE_TOKEN, accessToken)
      );

      if (!user) {
        this.logger.warn(`Client ${client.id} - Disconnected, invalid token.`);
        client.disconnect();
        return;
      }

      this.logger.log(`Client ${client.id} - Authenticated: ${user.id}`);
      client.data.user = user;
      client.emit("authenticated", user);
    } catch (error) {
      this.logger.error(`Client ${client.id} - Failed to validate token: ${error.message}`, error.stack);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user as JwtDto;
    if (user) {
      this.logger.log(`Client disconnected: ${client.id} (User: ${user.id})`);
    } else {
      this.logger.log(`Client disconnected: ${client.id} (User: N/A)`);
    }
  }

  private async handleInteraction(
    client: Socket,
    user: JwtDto,
    messageContent: string,
    conversationId?: string,
    role: 'user' | 'ai' = 'user'
  ): Promise<ConversationDocument | null> {
    let savedConversation: ConversationDocument;
    try {
      savedConversation = await this.chatbotService.handleMessage(
        user.id,
        messageContent,
        conversationId,
        role
      ) as ConversationDocument;
    } catch (dbError) {
      console.log(messageContent)
      this.logger.error(`Client ${client.id} - Failed to save message to DB for user ${user.id}: ${dbError.message}`, dbError.stack);
      client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, "Failed to save your message.");
      return null;
    }

    if (!savedConversation) {
      this.logger.error(`Client ${client.id} - Saved conversation is null or undefined after handleUserMessage for user ${user.id}`);
      client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, "Failed to save your message.");
      return null;
    }

    if (!conversationId) {
      this.logger.log(`Emitting new conversation ID: ${savedConversation._id} for client ${client.id}`);
      client.emit('conversation_started', {
        newConversationId: String(savedConversation._id),
      });
    }

    return savedConversation;
  }

  @SubscribeMessage(CHATBOT_PATTERN.ASK_QUESTION)
  async handleAskQuestion(client: Socket, payload: AskQuestionPayload) {
    const user = client.data.user as JwtDto;
    if (!user) {
      this.logger.warn(`Invalid user on ask_question for client ${client.id}.`);
      return;
    }

    const { question, conversationId } = payload;
    this.logger.log(`Received ask_question from ${client.id} (User: ${user.id}): ${question}`);

    const savedConversation = await this.handleInteraction(
      client,
      user,
      question,
      conversationId
    );

    if (!savedConversation) {
      return;
    }

    const requestPayload = {
      userId: user.id,
      question,
      socketId: client.id,
      conversationId: String(savedConversation._id)
    };

    this.logger.log(`Emitting to RAG_CLIENT (ask_question) for user ${user.id}`);
    this.ragClient.emit(CHATBOT_PATTERN.ASK_QUESTION, requestPayload);
  }

  @SubscribeMessage(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT)
  async handleSummarizeDocument(client: Socket, payload: SummarizeDocumentPayload): Promise<void> {
    const user = client.data.user as JwtDto;
    if (!user) {
      this.logger.warn(`Invalid user on summarize_document for client ${client.id}.`);
      return;
    }

    const { fileName, conversationId } = payload;
    this.logger.log(`Received summarize_document from ${client.id} (User: ${user.id}): ${fileName}`);

    const messageContent = `Yêu cầu tóm tắt tài liệu: ${fileName}`;
    const savedConversation = await this.handleInteraction(
      client,
      user,
      messageContent,
      conversationId
    );

    if (!savedConversation) {
      return;
    }

    const requestPayload = {
      userId: user.id,
      fileName,
      socketId: client.id,
      conversationId: String(savedConversation._id)
    };

    this.logger.log(`Emitting to RAG_CLIENT (summarize_document) for user ${user.id}`);
    this.ragClient.emit(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT, requestPayload);
  }

  handleStreamResponse(response: ResponseStreamPayload) {
    const { conversationId, socketId, content, type } = response;
    const client = this.server.sockets.sockets.get(socketId);
    if (!client) {
      this.logger.warn(`Client ${socketId} not found.`);
      return;
    }

    this.logger.debug(`handleStreamResponse for ${client.id}, type: ${type}`);

    let message: string = "";
    if (type === 'chunk') {
      const currentMessage = client.data.accumulatedMessage || "";
      client.data.accumulatedMessage = currentMessage + content;
      client.emit(CHATBOT_PATTERN.RESPONSE_CHUNK, content);
    } else if (type === 'error') {
      client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, content);
    } else if (type === 'end') {
      client.emit(CHATBOT_PATTERN.RESPONSE_END, content);
      const fullMessage = client.data.accumulatedMessage || "";
      if (fullMessage.trim().length > 0) {
        this.handleInteraction(
          client,
          client.data.user as JwtDto,
          fullMessage,
          conversationId,
          "ai"
        )
      } else {
        this.logger.warn(`Skipping save for AI message on ${socketId} because message was empty.`);
      }
      delete client.data.accumulatedMessage;
    }
  }
}