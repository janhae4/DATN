import { Controller } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  ChangeRoleMember,
  CHAT_EXCHANGE,
  CHAT_PATTERN,
  CreateChatMessageDto,
  CreateDirectChatDto,
  EVENTS,
  EVENTS_EXCHANGE,
  GetChatMessageConversationDto,
  LeaveMember,
  User,
} from '@app/contracts';

import type {
  AddMemberEventPayload,
  CreateTeamEventPayload,
  PaginationDto,
  RemoveMemberEventPayload,
  RemoveTeamEventPayload,
  TransferOwnershipEventPayload,
} from '@app/contracts';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

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
  leaveTeam(payload: LeaveMember) {
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
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.CREATE_DIRECT_MESSAGE,
    queue: CHAT_PATTERN.CREATE_DIRECT_MESSAGE,
    errorHandler: customErrorHandler,
  })
  createDirectChat(createDirectChat: CreateDirectChatDto) {
    return this.chatService.createDirectChat(createDirectChat);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.CREATE_MESSAGE,
    queue: CHAT_PATTERN.CREATE_MESSAGE,
    errorHandler: customErrorHandler,
  })
  createChatMessage(createChatMessageDto: CreateChatMessageDto) {
    console.log(createChatMessageDto);
    return this.chatService.createChatMessage(createChatMessageDto);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.GET,
    queue: CHAT_PATTERN.GET,
    errorHandler: customErrorHandler,
  })
  getConversationsForUser(
    payload: { userId: string; page: number; limit: number },
  ) {
    const { userId, page = 1, limit = 10 } = payload;
    return this.chatService.getConversationsForUser(userId, page, limit);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.GET_CONVERSATION_BY_TEAM_ID,
    queue: CHAT_PATTERN.GET_CONVERSATION_BY_TEAM_ID,
    errorHandler: customErrorHandler,
  })
  getConversationByTeamId(payload: { teamId: string; userId: string }) {
    const { teamId, userId } = payload;
    return this.chatService.getConversationByTeamId(userId, teamId);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.GET_MESSAGES,
    queue: CHAT_PATTERN.GET_MESSAGES,
    errorHandler: customErrorHandler,
  })
  getMessagesForConversation(payload: GetChatMessageConversationDto) {
    const { conversationId, limit, page, userId } = payload;
    return this.chatService.getMessagesForConversation(
      userId,
      conversationId,
      page,
      limit,
    );
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.GET_CONVERSATION_BY_ID,
    queue: CHAT_PATTERN.GET_CONVERSATION_BY_ID,
    errorHandler: customErrorHandler,
  })
  getConversationById(
    payload: { conversationId: string; userId: string },
  ) {
    const { conversationId, userId } = payload;
    return this.chatService.getConversationById(conversationId, userId);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.GET_ALL_MESSAGES,
    queue: CHAT_PATTERN.GET_ALL_MESSAGES,
    errorHandler: customErrorHandler,
  })
  async getAllMessages() {
    return await this.chatService.getAllMessages();
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.SEARCH_MESSAGES,
    queue: CHAT_PATTERN.SEARCH_MESSAGES,
    errorHandler: customErrorHandler,
  })
  searchMessages(payload: { query: string; conversationId: string; userId: string, options: PaginationDto }) {
    console.log(payload);
    const { query, conversationId, userId, options } = payload;
    return this.chatService.searchMessages(query, conversationId, userId, options);
  }
}
