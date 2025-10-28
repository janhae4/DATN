import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CHAT_EXCHANGE,
  CHAT_PATTERN,
  CreateChatMessageDto,
  CreateDirectChatDto,
  GetChatMessageConversationDto,
} from '@app/contracts';
import { PaginationDto } from './dto/pagination.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class ChatService {
  private readonly rpcTimeout = 10000;

  constructor(private readonly amqp: AmqpConnection) { }

  createDirectChat(payload: CreateDirectChatDto) {
    return this.amqp.request({
      exchange: CHAT_EXCHANGE,
      routingKey: CHAT_PATTERN.CREATE_DIRECT_MESSAGE,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  createChatMessage(payload: CreateChatMessageDto) {
    return this.amqp.request({
      exchange: CHAT_EXCHANGE,
      routingKey: CHAT_PATTERN.CREATE_MESSAGE,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  getConversationsForUser(userId: string, paginationDto: PaginationDto) {
    return this.amqp.request({
      exchange: CHAT_EXCHANGE,
      routingKey: CHAT_PATTERN.GET,
      payload: { userId, paginationDto },
      timeout: this.rpcTimeout,
    })
  }

  getMessagesForConversation(payload: GetChatMessageConversationDto) {
    return this.amqp.request({
      exchange: CHAT_EXCHANGE,
      routingKey: CHAT_PATTERN.GET_MESSAGES,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  getConversationById(conversationId: string, userId: string) {
    return this.amqp.request({
      exchange: CHAT_EXCHANGE,
      routingKey: CHAT_PATTERN.GET_CONVERSATION_BY_ID,
      payload: { conversationId, userId },
      timeout: this.rpcTimeout,
    })
  }

  async getConversationByTeamId(userId: string, teamId: string) {
    const result = await this.amqp.request({
      exchange: CHAT_EXCHANGE,
      routingKey: CHAT_PATTERN.GET_CONVERSATION_BY_TEAM_ID,
      payload: { teamId, userId },
    });
    console.log(result)
    return unwrapRpcResult(result);
  }

  searchMessages(query: string, conversationId: string, userId: string, page: number, limit: number) {
    const options = { page, limit };
    return this.amqp.request({
      exchange: CHAT_EXCHANGE,
      routingKey: CHAT_PATTERN.SEARCH_MESSAGES,
      payload: { query, conversationId, userId, options },
      timeout: this.rpcTimeout,
    })
  }
}
