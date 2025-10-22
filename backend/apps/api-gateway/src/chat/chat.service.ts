import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CHAT_CLIENT,
  CHAT_PATTERN,
  CreateChatMessageDto,
  CreateDirectChatDto,
  GetChatMessageConversationDto,
} from '@app/contracts';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class ChatService {
  constructor(
    @Inject(CHAT_CLIENT)
    private readonly chatClient: ClientProxy,
  ) {}

  createDirectChat(payload: CreateDirectChatDto) {
    return this.chatClient.send(CHAT_PATTERN.CREATE_DIRECT_MESSAGE, payload);
  }

  createChatMessage(payload: CreateChatMessageDto) {
    return this.chatClient.send(CHAT_PATTERN.CREATE_MESSAGE, payload);
  }

  getConversationsForUser(userId: string, paginationDto: PaginationDto) {
    return this.chatClient.send(CHAT_PATTERN.GET, {
      userId,
      page: paginationDto.page,
      limit: paginationDto.limit,
    });
  }

  getMessagesForConversation(payload: GetChatMessageConversationDto) {
    return this.chatClient.send(CHAT_PATTERN.GET_MESSAGES, payload);
  }

  getConversationById(conversationId: string, userId: string) {
    return this.chatClient.send(CHAT_PATTERN.GET_CONVERSATION_BY_ID, {
      conversationId,
      userId,
    });
  }
}
