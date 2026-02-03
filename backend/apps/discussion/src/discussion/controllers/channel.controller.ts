import { Controller } from '@nestjs/common';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import {
    DISCUSSION_EXCHANGE,
    DISCUSSION_PATTERN,
    CreateChannelDto,
    CreateCategoryDto,
    UpdateChannelDto,
    ReorderChannelsDto
} from '@app/contracts';
import { ChannelService } from '../services/channel.service';
import { customErrorHandler } from '@app/common';

@Controller()
export class ChannelController {
    constructor(private readonly channelService: ChannelService) { }

    /**
     * RPC handler to retrieve all channels/discussions belonging to a specific team.
     * @param payload Contains teamId and the ID of the user making the request.
     * @returns A list of discussion documents for the team.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_TEAM_ID,
        queue: DISCUSSION_PATTERN.GET_DISCUSSION_BY_TEAM_ID,
        errorHandler: customErrorHandler,
    })
    async getChannelsByTeam(payload: { teamId: string; userId: string }) {
        return this.channelService.getChannelsByTeam(payload.teamId);
    }

    /**
     * RPC handler to retrieve all discussions for a specific user.
     * @param payload Contains userId and pagination options.
     * @returns A list of discussion documents for the user.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET,
        queue: DISCUSSION_PATTERN.GET,
        errorHandler: customErrorHandler,
    })
    async getDiscussionsForUser(payload: { userId: string; page?: number; limit?: number }) {
        return this.channelService.getDiscussionsForUser(payload.userId, payload.page, payload.limit);
    }

    /**
     * RPC handler to retrieve a specific channel or discussion by its unique ID.
     * @param payload Contains the conversationId (the ID of the channel/discussion) and the requester's userId.
     * @returns The discussion document if found.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_ID,
        queue: DISCUSSION_PATTERN.GET_DISCUSSION_BY_ID,
        errorHandler: customErrorHandler,
    })
    async getChannelById(payload: { conversationId: string; userId: string }) {
        return this.channelService.getChannelById(payload.conversationId);
    }

    /**
     * RPC handler to create a new channel (TEXT or VOICE).
     * @param payload DTO containing teamId, name, type, and ownerId.
     * @returns The created channel document.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.CREATE_CHANNEL,
        queue: DISCUSSION_PATTERN.CREATE_CHANNEL,
        errorHandler: customErrorHandler,
    })
    async createChannel(payload: CreateChannelDto) {
        return this.channelService.createChannel({ ...payload });
    }

    /**
     * RPC handler to create a new category.
     * @param payload DTO containing teamId, name, and ownerId.
     * @returns The created category document.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.CREATE_CATEGORY,
        queue: DISCUSSION_PATTERN.CREATE_CATEGORY,
        errorHandler: customErrorHandler,
    })
    async createCategory(payload: CreateCategoryDto) {
        return this.channelService.createCategory({ ...payload });
    }

    /**
     * RPC handler to update an existing channel's information.
     * @param payload DTO containing channel ID and fields to update.
     * @returns The updated channel document.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.UPDATE_CHANNEL,
        queue: DISCUSSION_PATTERN.UPDATE_CHANNEL,
        errorHandler: customErrorHandler,
    })
    async updateChannel(payload: UpdateChannelDto) {
        const { id, ...update } = payload;
        return this.channelService.updateChannel(id, update as any);
    }

    /**
     * RPC handler to delete a channel or category.
     * @param payload Contains the ID of the channel/category to delete.
     * @returns The deleted channel document.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.DELETE_CHANNEL,
        queue: DISCUSSION_PATTERN.DELETE_CHANNEL,
        errorHandler: customErrorHandler,
    })
    async deleteChannel(payload: { id: string }) {
        return this.channelService.deleteChannel(payload.id);
    }

    /**
     * RPC handler to reorder channels and categories within a team.
     * @param payload DTO containing teamId and the new orders.
     * @returns A success status.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.REORDER_CHANNELS,
        queue: DISCUSSION_PATTERN.REORDER_CHANNELS,
        errorHandler: customErrorHandler,
    })
    async reorderChannels(payload: ReorderChannelsDto) {
        return this.channelService.reorderChannels(payload.teamId, payload.orders);
    }
}
