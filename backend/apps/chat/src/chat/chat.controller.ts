import { Controller } from '@nestjs/common';
import { ChatService } from './chat.service';
import {
  ChangeRoleMember,
  CHAT_PATTERN,
  CreateChatMessageDto,
  CreateDirectChatDto,
  EVENTS,
  GetChatMessageConversationDto,
  LeaveMember,
  User,
} from '@app/contracts';
import type {
  AddMemberEventPayload,
  CreateTeamEventPayload,
  RemoveMemberEventPayload,
  TransferOwnershipEventPayload,
} from '@app/contracts';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @EventPattern(EVENTS.CREATE_TEAM)
  handleCreateTeam(@Payload() payload: CreateTeamEventPayload) {
    return this.chatService.createChat(payload);
  }

  @EventPattern(EVENTS.UPDATED)
  updateUser(@Payload() user: Partial<User>) {
    return this.chatService.updateUser(user);
  }

  @EventPattern(EVENTS.ADD_MEMBER)
  addMember(@Payload() payload: AddMemberEventPayload) {
    return this.chatService.addMember(payload);
  }

  @EventPattern(EVENTS.REMOVE_MEMBER)
  removeMember(@Payload() payload: RemoveMemberEventPayload) {
    return this.chatService.removeMember(payload);
  }

  @EventPattern(EVENTS.LEAVE_TEAM)
  leaveTeam(@Payload() payload: LeaveMember) {
    return this.chatService.leaveTeam(payload);
  }

  @EventPattern(EVENTS.MEMBER_ROLE_CHANGED)
  memberRoleChanged(@Payload() payload: ChangeRoleMember) {
    return this.chatService.changeRole(payload);
  }

  @EventPattern(EVENTS.OWNERSHIP_TRANSFERRED)
  ownershipTransferred(@Payload() payload: TransferOwnershipEventPayload) {
    return this.chatService.transferOwnership(payload);
  }

  @MessagePattern(CHAT_PATTERN.CREATE_DIRECT_MESSAGE)
  createDirectChat(createDirectChat: CreateDirectChatDto) {
    return this.chatService.createDirectChat(createDirectChat);
  }

  @MessagePattern(CHAT_PATTERN.CREATE_MESSAGE)
  createChatMessage(createChatMessageDto: CreateChatMessageDto) {
    return this.chatService.createChatMessage(createChatMessageDto);
  }

  @MessagePattern(CHAT_PATTERN.GET)
  getConversationsForUser(
    @Payload() payload: { userId: string; page: number; limit: number },
  ) {
    const { userId, page = 1, limit = 10 } = payload;
    return this.chatService.getConversationsForUser(userId, page, limit);
  }

  @MessagePattern(CHAT_PATTERN.GET_MESSAGES)
  getMessagesForConversation(payload: GetChatMessageConversationDto) {
    const { conversationId, limit, page, userId } = payload;
    return this.chatService.getMessagesForConversation(
      userId,
      conversationId,
      page,
      limit,
    );
  }

  @MessagePattern(CHAT_PATTERN.GET_CONVERSATION_BY_ID)
  getConversationById(
    @Payload() payload: { conversationId: string; userId: string },
  ) {
    const { conversationId, userId } = payload;
    return this.chatService.getConversationById(conversationId, userId);
  }
}
