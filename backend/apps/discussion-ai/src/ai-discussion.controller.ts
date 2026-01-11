import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.pattern';
import { Controller } from '@nestjs/common';
import { CHATBOT_EXCHANGE} from '@app/contracts';
import type {MessageMetadataDto, MessageUserChatbot} from '@app/contracts';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';
import { AiDiscussionService } from './ai-discussion.service';

@Controller()
export class AiDiscussionController {
  constructor(
    private readonly aiDiscussionService: AiDiscussionService,
  ) { }
  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.FIND_CONVERSATION,
    queue: CHATBOT_PATTERN.FIND_CONVERSATION,
    errorHandler: customErrorHandler
  })
  async findConversation(payload: {
    userId: string;
    page: number;
    limit: number;
    id: string;
  }) {
    return await this.aiDiscussionService.findDiscussion(
      payload.userId,
      payload.page,
      payload.limit,
      payload.id
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.FIND_CONVERSATIONS,
    queue: CHATBOT_PATTERN.FIND_CONVERSATIONS,
    errorHandler: customErrorHandler
  })
  async findAllConversation(payload: {
    userId: string;
    page: number;
    limit: number;
  }) {
    return await this.aiDiscussionService.findAllDiscussion(
      payload.userId,
      payload.page,
      payload.limit,
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.FIND_TEAM_CONVERSATIONS,
    queue: CHATBOT_PATTERN.FIND_TEAM_CONVERSATIONS,
    errorHandler: customErrorHandler
  })
  async findTeamConversation(payload: {
    userId: string;
    teamId: string;
    page: number;
    limit: number;
  }) {
    return await this.aiDiscussionService.findTeamDiscussion(
      payload.userId,
      payload.teamId,
      payload.page,
      payload.limit,
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.DELETE_CONVERSATION,
    queue: CHATBOT_PATTERN.DELETE_CONVERSATION,
    errorHandler: customErrorHandler
  })
  async deleteConversation(payload:
    {
      conversationId: string;
      userId: string;
      teamId?: string
    }) {
    return await this.aiDiscussionService.deleteDiscussion(
      payload.conversationId,
      payload.userId,
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
    queue: CHATBOT_PATTERN.HANDLE_MESSAGE,
    errorHandler: customErrorHandler
  })
  async handleMessage(payload: MessageUserChatbot) {
    const { discussionId, userId, message, metadata, summarizeFileName } = payload
    console.log('handleMessage', payload);
    return await this.aiDiscussionService.handleMessageForUser(
      userId,
      message,
      metadata,
      discussionId,
      summarizeFileName
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.CREATE,
    queue: CHATBOT_PATTERN.CREATE,
    errorHandler: customErrorHandler
  })
  async createAiDiscussion(payload: {
    discussionId: string,
    message: string,
    metadata?: MessageMetadataDto
  }) {
    return await this.aiDiscussionService.saveAiMessage(
      payload.discussionId,
      payload.message,
      payload.metadata
    )
  }
}
