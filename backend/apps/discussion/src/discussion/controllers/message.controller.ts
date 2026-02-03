import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { DISCUSSION_EXCHANGE, DISCUSSION_PATTERN, CreateMessageDto, RequestPaginationDto } from '@app/contracts';
import { MessageService } from '../services/message.service';
import { customErrorHandler } from '@app/common';

@Controller()
export class MessageController {
    constructor(private readonly messageService: MessageService) { }

    /**
     * RPC handler to create a new chat message in a discussion.
     * @param payload DTO containing discussionId, userId, content, and attachments.
     * @returns The newly created message response DTO.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.CREATE_MESSAGE,
        queue: DISCUSSION_PATTERN.CREATE_MESSAGE,
        errorHandler: customErrorHandler,
    })
    async createChatMessage(payload: CreateMessageDto) {
        return this.messageService.createChatMessage(payload);
    }

    /**
     * RPC handler to retrieve paginated messages for a specific conversation.
     * @param payload Contains discussionId, pagination offsets, and the requester's ID.
     * @returns A paginated list of messages from the discussion.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET_MESSAGES,
        queue: DISCUSSION_PATTERN.GET_MESSAGES,
        errorHandler: customErrorHandler,
    })
    async getMessagesForConversation(payload: {
        discussionId: string;
        limit: number;
        page: number;
        userId: string;
    }) {
        const { discussionId, limit, page, userId } = payload;
        return this.messageService.getMessagesForDiscussion(
            userId,
            discussionId,
            page,
            limit,
        );
    }

    /**
     * RPC handler to search for messages within a specific conversation.
     * @param payload Contains the search query, conversationId, userId, and pagination options.
     * @returns A list of messages matching the search criteria.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.SEARCH_MESSAGES,
        queue: DISCUSSION_PATTERN.SEARCH_MESSAGES,
        errorHandler: customErrorHandler,
    })
    async searchMessages(payload: { query: string; conversationId: string; userId: string, options: RequestPaginationDto }) {
        const { query, conversationId, userId, options } = payload;
        return this.messageService.searchMessages(query, conversationId, userId, options);
    }


    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.TOGGLE_REACTION,
        queue: DISCUSSION_PATTERN.TOGGLE_REACTION,
        errorHandler: customErrorHandler,
    })
    async toggleReaction(payload: { userId: string, messageId: string, emoji: string }) {
        return this.messageService.toggleReaction(payload.userId, payload.messageId, payload.emoji);
    }
}
