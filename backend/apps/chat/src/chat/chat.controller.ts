import { Controller } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  ChangeRoleMember,
  CHAT_EXCHANGE,
  CHAT_PATTERN,
  CHAT_QUEUE,
  CreateChatMessageDto,
  CreateDirectChatDto,
  EVENTS,
  EVENTS_CHAT_QUEUE,
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
  TransferOwnershipEventPayload,
} from '@app/contracts';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.CREATE_TEAM,
    queue: EVENTS.CREATE_TEAM,
  })
  handleCreateTeam(payload: CreateTeamEventPayload) {
    return this.chatService.createChat(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.USER_UPDATED,
    queue: EVENTS.USER_UPDATED,
  })
  updateUser(user: Partial<User>) {
    return this.chatService.updateUser(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: EVENTS.ADD_MEMBER,
  })
  addMember(payload: AddMemberEventPayload) {
    return this.chatService.addMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: EVENTS.REMOVE_MEMBER,
  })
  removeMember(payload: RemoveMemberEventPayload) {
    return this.chatService.removeMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: EVENTS.LEAVE_TEAM,
  })
  leaveTeam(payload: LeaveMember) {
    return this.chatService.leaveTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.MEMBER_ROLE_CHANGED,
    queue: EVENTS.MEMBER_ROLE_CHANGED,
  })
  memberRoleChanged(payload: ChangeRoleMember) {
    return this.chatService.changeRole(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.OWNERSHIP_TRANSFERRED,
    queue: EVENTS.OWNERSHIP_TRANSFERRED,
  })
  ownershipTransferred(payload: TransferOwnershipEventPayload) {
    return this.chatService.transferOwnership(payload);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.CREATE_DIRECT_MESSAGE,
    queue: CHAT_PATTERN.CREATE_DIRECT_MESSAGE,
  })
  createDirectChat(createDirectChat: CreateDirectChatDto) {
    return this.chatService.createDirectChat(createDirectChat);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.CREATE_MESSAGE,
    queue: CHAT_PATTERN.CREATE_MESSAGE,
  })
  createChatMessage(createChatMessageDto: CreateChatMessageDto) {
    console.log(createChatMessageDto);
    return this.chatService.createChatMessage(createChatMessageDto);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.GET,
    queue: CHAT_PATTERN.GET,
  })
  getConversationsForUser(
    payload: { userId: string; page: number; limit: number },
  ) {
    const { userId, page = 1, limit = 10 } = payload;
    return this.chatService.getConversationsForUser(userId, page, limit);
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.GET_MESSAGES,
    queue: CHAT_PATTERN.GET_MESSAGES,
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
  })
  async getAllMessages() {
    return await this.chatService.getAllMessages();
  }

  @RabbitRPC({
    exchange: CHAT_EXCHANGE,
    routingKey: CHAT_PATTERN.SEARCH_MESSAGES,
    queue: CHAT_PATTERN.SEARCH_MESSAGES,
  })
  searchMessages(payload: { query: string; conversationId: string; userId: string, options: PaginationDto }) {
    console.log(payload);
    const { query, conversationId, userId, options } = payload;
    return this.chatService.searchMessages(query, conversationId, userId, options);
  }
}
