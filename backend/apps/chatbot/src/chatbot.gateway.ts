import { SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { Inject } from '@nestjs/common';
import { AuthenticatedGateway } from '@app/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  AUTH_CLIENT,
  CHATBOT_PATTERN,
  JwtDto,
  RAG_CLIENT,
} from '@app/contracts';
import { ChatbotService } from './chatbot.service';
import { ConversationDocument } from './schema/conversation.schema';
import type { AskQuestionPayload } from './interface/ask-question.itf';
import { ResponseStreamPayload } from './interface/response-stream.itf';

interface SummarizeDocumentPayload {
  fileName: string;
  conversationId?: string;
}

interface AuthenticatedChatSocket extends Socket {
  data: {
    user?: JwtDto;
    accumulatedMessage?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: `http://localhost:5000`,
    credentials: true,
  },
})
export class ChatbotGateway extends AuthenticatedGateway {
  constructor(
    @Inject(AUTH_CLIENT) protected readonly authClient: ClientProxy,
    @Inject(RAG_CLIENT) private readonly ragClient: ClientProxy,
    private readonly chatbotService: ChatbotService,
  ) {
    super(authClient, ChatbotGateway.name);
  }

  // 2. Use the new interface here
  protected onClientAuthenticated(
    client: AuthenticatedChatSocket,
    user: JwtDto,
  ): void {
    this.logger.log(`Emitting 'authenticated' to client ${client.id}`);
    client.emit('authenticated', user);
  }

  // 3. And here
  private async handleInteraction(
    client: AuthenticatedChatSocket,
    user: JwtDto,
    messageContent: string,
    conversationId?: string,
    role: 'user' | 'ai' = 'user',
  ): Promise<ConversationDocument | null> {
    let savedConversation: ConversationDocument;
    try {
      savedConversation = await this.chatbotService.handleMessage(
        user.id,
        messageContent,
        conversationId,
        role,
      );
    } catch (dbError) {
      const e = dbError as Error;
      this.logger.error(
        `Client ${client.id} - Failed to save message to DB for user ${user.id}: ${e.message}`,
      );
      client.emit(
        CHATBOT_PATTERN.RESPONSE_ERROR,
        'Failed to save your message.',
      );
      return null;
    }

    if (!savedConversation) {
      this.logger.error(
        `Client ${client.id} - Saved conversation is null or undefined after handleUserMessage for user ${user.id}`,
      );
      client.emit(
        CHATBOT_PATTERN.RESPONSE_ERROR,
        'Failed to save your message.',
      );
      return null;
    }

    if (!conversationId) {
      this.logger.log(
        // 4. FIX: Use .toString() on the ObjectId for the template literal
        `Emitting new conversation ID: ${String(savedConversation._id)} for client ${client.id}`,
      );
      client.emit('conversation_started', {
        newConversationId: String(savedConversation._id),
      });
    }

    return savedConversation;
  }

  @SubscribeMessage(CHATBOT_PATTERN.ASK_QUESTION)
  // 5. And here
  async handleAskQuestion(
    client: AuthenticatedChatSocket,
    payload: AskQuestionPayload,
  ) {
    // This is now type-safe, and TypeScript knows 'user' is a JwtDto or undefined.
    const user = client.data.user;
    if (!user) {
      this.logger.warn(`Invalid user on ask_question for client ${client.id}.`);
      return;
    }

    const { question, conversationId } = payload;
    this.logger.log(
      `Received ask_question from ${client.id} (User: ${user.id}): ${question}`,
    );

    const savedConversation = await this.handleInteraction(
      client,
      user,
      question,
      conversationId,
    );

    if (!savedConversation) {
      return;
    }

    const requestPayload = {
      userId: user.id,
      question,
      socketId: client.id,
      conversationId: String(savedConversation._id),
    };

    this.logger.log(
      `Emitting to RAG_CLIENT (ask_question) for user ${user.id}`,
    );
    this.ragClient.emit(CHATBOT_PATTERN.ASK_QUESTION, requestPayload);
  }

  @SubscribeMessage(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT)
  async handleSummarizeDocument(
    // 6. And here
    client: AuthenticatedChatSocket,
    payload: SummarizeDocumentPayload,
  ): Promise<void> {
    // This is now type-safe
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
    const savedConversation = await this.handleInteraction(
      client,
      user,
      messageContent,
      conversationId,
    );

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
    this.ragClient.emit(CHATBOT_PATTERN.SUMMARIZE_DOCUMENT, requestPayload);
  }

  handleStreamResponse(response: ResponseStreamPayload) {
    const { conversationId, socketId, content, type } = response;
    // 7. Cast the result of .get() to your new, specific type
    const client = this.server.sockets.sockets.get(socketId) as
      | AuthenticatedChatSocket
      | undefined;
    if (!client) {
      this.logger.warn(`Client ${socketId} not found.`);
      return;
    }

    this.logger.debug(`handleStreamResponse for ${client.id}, type: ${type}`);

    if (type === 'chunk') {
      // These accesses are now type-safe
      const currentMessage = client.data.accumulatedMessage || '';
      client.data.accumulatedMessage = currentMessage + content;
      client.emit(CHATBOT_PATTERN.RESPONSE_CHUNK, content);
    } else if (type === 'error') {
      client.emit(CHATBOT_PATTERN.RESPONSE_ERROR, content);
    } else if (type === 'end') {
      client.emit(CHATBOT_PATTERN.RESPONSE_END, content);
      // This access is now type-safe
      const fullMessage = client.data.accumulatedMessage || '';
      if (fullMessage.trim().length > 0) {
        // This access is now type-safe
        const user = client.data.user;
        if (user) {
          this.handleInteraction(
            client,
            user,
            fullMessage,
            conversationId,
            'ai',
          );
        }
      } else {
        this.logger.warn(
          `Skipping save for AI message on ${socketId} because message was empty.`,
        );
      }
      delete client.data.accumulatedMessage;
    }
  }
}
