import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.pattern';
import { Controller } from '@nestjs/common';
import { CHATBOT_EXCHANGE, EVENTS, EVENTS_EXCHANGE, User } from '@app/contracts';
import type { AddMemberEventPayload, CreateTeamEventPayload, LeaveMember, RemoveMemberEventPayload, RemoveTeamEventPayload, SendAiMessageEventPayload } from '@app/contracts';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';
import { AiDiscussionService } from './chatbot.service';

@Controller('chatbot')
export class AiDiscussionController {
  constructor(
    private readonly aiDiscussionService: AiDiscussionService,
  ) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.CREATE_TEAM,
    queue: 'events.user.created.chatbot',
  })
  createTeam(payload: CreateTeamEventPayload) {
    return this.aiDiscussionService.createTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.USER_UPDATED,
    queue: 'events.user.updated.chatbot',
  })
  userUpdate(user: Partial<User>) {
    return this.aiDiscussionService.userUpdate(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: 'events.add.member.chatbot',
  })
  addMember(payload: AddMemberEventPayload) {
    return this.aiDiscussionService.addMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.DELETE_DOCUMENT,
    queue: 'events.delete.document.chatbot',
  })

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: 'events.remove.member.chatbot',
  })
  removeMember(payload: RemoveMemberEventPayload) {
    return this.aiDiscussionService.removeMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: 'events.leave.member.chatbot',
  })
  leaveTeam(payload: LeaveMember) {
    return this.aiDiscussionService.leaveTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_TEAM,
    queue: 'events.remove.team.chatbot',
  })
  removeTeam(payload: RemoveTeamEventPayload) {
    return this.aiDiscussionService.removeTeam(payload);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.FIND_CONVERSATION,
    queue: CHATBOT_PATTERN.FIND_CONVERSATION,
    errorHandler: customErrorHandler
  })
  async findConversation(payload: {
    userId: string;
    conversationId: string;
    page: number;
    limit: number;
    teamId?: string
  }) {
    return await this.aiDiscussionService.findDiscussion(
      payload.userId,
      payload.conversationId,
      payload.page,
      payload.limit
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
    return await this.aiDiscussionService.deleteDiscussion(payload.conversationId, payload.userId, payload.teamId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
    queue: CHATBOT_PATTERN.HANDLE_MESSAGE,
    errorHandler: customErrorHandler
  })
  async handleMessage(payload: SendAiMessageEventPayload) {
    return await this.aiDiscussionService.handleMessage(
      payload.sender,
      payload.content,
      payload.discussionId,
      payload.teamId,
      payload.metadata
    );
  }
}
