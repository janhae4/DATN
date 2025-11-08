import { Injectable } from '@nestjs/common';
import {

  CreateDirectDiscussionDto,
  CreateMessageDto,
  DISCUSSION_EXCHANGE,
  DISCUSSION_PATTERN,
  GetMessageDiscussionDto,
  RequestPaginationDto,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { unwrapRpcResult } from '../common/helper/rpc';

@Injectable()
export class DiscussionService {
  private readonly rpcTimeout = 10000;

  constructor(private readonly amqp: AmqpConnection) { }

  createDirectDiscussion(payload: CreateDirectDiscussionDto) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.CREATE_DIRECT_MESSAGE,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  createDiscussionMessage(payload: CreateMessageDto) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.CREATE_MESSAGE,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  getDiscussionsForUser(userId: string, page: number, limit: number) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET,
      payload: { userId, page, limit },
      timeout: this.rpcTimeout,
    })
  }

  getMessagesForDiscussion(payload: GetMessageDiscussionDto) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_MESSAGES,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  getDiscussionById(discussionId: string, userId: string, paginationDto: RequestPaginationDto) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_ID,
      payload: { discussionId, userId,  page: paginationDto.page, limit: paginationDto.limit },
      timeout: this.rpcTimeout,
    })
  }

  async getDiscussionByTeamId(userId: string, teamId: string) {
    const result = await this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_TEAM_ID,
      payload: { teamId, userId },
    });
    return unwrapRpcResult(result);
  }

  searchMessages(query: string, conversationId: string, userId: string, page: number, limit: number) {
    console.log(query)
    const options = { page, limit };
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.SEARCH_MESSAGES,
      payload: { query, conversationId, userId, options },
      timeout: this.rpcTimeout,
    })
  }
}
