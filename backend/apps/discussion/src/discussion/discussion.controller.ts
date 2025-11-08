import { Controller } from '@nestjs/common';
import { DiscussionService } from './discussion.service';
import {
  ChangeRoleMember,
  DISCUSSION_EXCHANGE,
  DISCUSSION_PATTERN,
  EVENTS,
  EVENTS_EXCHANGE,
  User,
} from '@app/contracts';

import type {
  AddMemberEventPayload,
  CreateDirectDiscussionDto,
  CreateMessageDto,
  CreateTeamEventPayload,
  LeaveMemberEventPayload,
  RemoveMemberEventPayload,
  RemoveTeamEventPayload,
  RequestPaginationDto,
  TransferOwnershipEventPayload,
} from '@app/contracts';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';

@Controller('discussion')
export class DiscussionController {
  constructor(private readonly chatService: DiscussionService) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.CREATE_TEAM,
    queue: "events.create.team.chat",
    errorHandler: customErrorHandler,
  })
  async handleCreateTeam(payload: CreateTeamEventPayload) {
    return await this.chatService.createChat(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.USER_UPDATED,
    queue: 'events.user.updated.chat',
    errorHandler: customErrorHandler,
  })
  updateUser(user: Partial<User>) {
    return this.chatService.updateUser(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: 'events.add.member.chat',
    errorHandler: customErrorHandler,
  })
  addMember(payload: AddMemberEventPayload) {
    return this.chatService.addMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: 'events.remove.member.chat',
    errorHandler: customErrorHandler,
  })
  removeMember(payload: RemoveMemberEventPayload) {
    return this.chatService.removeMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: 'events.leave.team.chat',
    errorHandler: customErrorHandler,
  })
  leaveTeam(payload: LeaveMemberEventPayload) {
    return this.chatService.leaveTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_TEAM,
    queue: 'events.remove.team.chat',
    errorHandler: customErrorHandler,
  })
  removeTeam(payload: RemoveTeamEventPayload) {
    return this.chatService.removeTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.MEMBER_ROLE_CHANGED,
    queue: 'events.member.role.changed.chat',
    errorHandler: customErrorHandler,
  })
  memberRoleChanged(payload: ChangeRoleMember) {
    return this.chatService.changeRole(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.OWNERSHIP_TRANSFERRED,
    queue: 'events.ownership.transferred.chat',
    errorHandler: customErrorHandler,
  })
  ownershipTransferred(payload: TransferOwnershipEventPayload) {
    return this.chatService.transferOwnership(payload);
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.CREATE_DIRECT_MESSAGE,
    queue: DISCUSSION_PATTERN.CREATE_DIRECT_MESSAGE,
    errorHandler: customErrorHandler,
  })
  createDirectChat(createDirectChat: CreateDirectDiscussionDto) {
    return this.chatService.createDirectChat(createDirectChat);
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.CREATE_MESSAGE,
    queue: DISCUSSION_PATTERN.CREATE_MESSAGE,
    errorHandler: customErrorHandler,
  })
  createChatMessage(createChatMessageDto: CreateMessageDto) {
    console.log(createChatMessageDto);
    return this.chatService.createChatMessage(createChatMessageDto);
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.GET,
    queue: DISCUSSION_PATTERN.GET,
    errorHandler: customErrorHandler,
  })
  getDiscussionsForUser(
    payload: { userId: string; page: number; limit: number },
  ) {
    const { userId, page = 1, limit = 10 } = payload;
    return this.chatService.getDiscussionsForUser(userId, page, limit);
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_TEAM_ID,
    queue: DISCUSSION_PATTERN.GET_DISCUSSION_BY_TEAM_ID,
    errorHandler: customErrorHandler,
  })
  getDiscussionByTeamId(payload: { teamId: string; userId: string }) {
    const { teamId, userId } = payload;
    return this.chatService.getDiscussionByTeamId(userId, teamId);
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.GET_MESSAGES,
    queue: DISCUSSION_PATTERN.GET_MESSAGES,
    errorHandler: customErrorHandler,
  })

  getMessagesForConversation(payload: {
    discussionId: string;
    limit: number;
    page: number;
    userId: string;
  }) {
    const { discussionId, limit, page, userId } = payload;
    return this.chatService.getMessagesForDiscussion(
      userId,
      discussionId,
      page,
      limit,
    );
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_ID,
    queue: DISCUSSION_PATTERN.GET_DISCUSSION_BY_ID,
    errorHandler: customErrorHandler,
  })
  getDiscussionById(
    payload: { discussionId: string; userId: string },
  ) {
    const { discussionId, userId } = payload;
    return this.chatService.getDiscussionById(discussionId, userId);
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.GET_ALL_MESSAGES,
    queue: DISCUSSION_PATTERN.GET_ALL_MESSAGES,
    errorHandler: customErrorHandler,
  })
  async getAllMessages() {
    return await this.chatService.getAllMessages();
  }

  @RabbitRPC({
    exchange: DISCUSSION_EXCHANGE,
    routingKey: DISCUSSION_PATTERN.SEARCH_MESSAGES,
    queue: DISCUSSION_PATTERN.SEARCH_MESSAGES,
    errorHandler: customErrorHandler,
  })
  searchMessages(payload: { query: string; conversationId: string; userId: string, options: RequestPaginationDto }) {
    console.log(payload);
    const { query, conversationId, userId, options } = payload;
    return this.chatService.searchMessages(query, conversationId, userId, options);
  }
}
