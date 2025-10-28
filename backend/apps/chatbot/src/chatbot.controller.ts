import { CHATBOT_PATTERN } from '@app/contracts/chatbot/chatbot.pattern';
import { Controller } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { StorageService } from './storage.service';
import { CHATBOT_EXCHANGE, EVENTS, EVENTS_EXCHANGE, MessageDto, User } from '@app/contracts';
import type { AddMemberEventPayload, CreateTeamEventPayload, LeaveMember, RemoveMemberEventPayload, RemoveTeamEventPayload } from '@app/contracts';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';

@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly storageService: StorageService,
  ) { }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.CREATE_TEAM,
    queue: 'events.user.created.chatbot',
  })
  createTeam(payload: CreateTeamEventPayload) {
    return this.chatbotService.createTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.USER_UPDATED,
    queue: 'events.user.updated.chatbot',
  })
  userUpdate(user: Partial<User>) {
    return this.chatbotService.userUpdate(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: 'events.add.member.chatbot',
  })
  addMember(payload: AddMemberEventPayload) {
    return this.chatbotService.addMember(payload);
  }


  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: 'events.remove.member.chatbot',
  })
  removeMember(payload: RemoveMemberEventPayload) {
    return this.chatbotService.removeMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: 'events.leave.member.chatbot',
  })
  leaveTeam(payload: LeaveMember) {
    return this.chatbotService.leaveTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_TEAM,
    queue: 'events.remove.team.chatbot',
  })
  removeTeam(payload: RemoveTeamEventPayload) {
    return this.chatbotService.removeTeam(payload);
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
    return await this.chatbotService.findConversation(
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
    return await this.chatbotService.findAllConversation(
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
    return await this.chatbotService.findTeamConversation(
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
    return await this.chatbotService.deleteConversation(payload.conversationId, payload.userId, payload.teamId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.UPLOAD_FILE,
    queue: CHATBOT_PATTERN.UPLOAD_FILE,
    errorHandler: customErrorHandler
  })
  async uploadFile(payload: { file: Express.Multer.File; userId: string, teamId?: string }) {
    return await this.storageService.uploadFile(payload.file, payload.userId, payload.teamId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.DELETE_FILE,
    queue: CHATBOT_PATTERN.DELETE_FILE,
    errorHandler: customErrorHandler
  })
  async deleteFile(payload: { userId: string, fileId: string, teamId?: string }) {
    const { userId, fileId, teamId } = payload;
    console.log(payload)
    return await this.storageService.deleteFile(fileId, userId, teamId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.HANDLE_MESSAGE,
    queue: CHATBOT_PATTERN.HANDLE_MESSAGE,
    errorHandler: customErrorHandler
  })
  async handleMessage(payload: MessageDto) {
    return await this.chatbotService.handleMessage(
      payload.userId,
      payload.message,
      payload.role,
      payload.conversationId,
      payload.teamId,
    );
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.GET_FILE_BY_ID,
    queue: CHATBOT_PATTERN.GET_FILE_BY_ID,
    errorHandler: customErrorHandler
  })
  async getFileById(payload: { fileId: string, userId: string, teamId?: string }) {
    const { fileId, userId, teamId } = payload
    console.log(payload)
    const fileStream = await this.storageService.getFile(fileId, userId, teamId);

    const chunks: Buffer[] = [];
    for await (const chunk of fileStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return buffer.toString('base64');
  }



  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.GET_FILES_BY_PREFIX,
    queue: CHATBOT_PATTERN.GET_FILES_BY_PREFIX,
    errorHandler: customErrorHandler
  })
  async getFilesByPrefix(payload: {userId?: string, teamId?: string}) {
    const { userId, teamId } = payload
    const prefix = teamId ? `${teamId}@` : `${userId}_`;
    return await this.storageService.getFilesByPrefix(prefix);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.UPDATE_FILE,
    queue: CHATBOT_PATTERN.UPDATE_FILE,
    errorHandler: customErrorHandler
  })
  async updateFile(payload: { fileId: string; file: Express.Multer.File, userId: string, teamId?: string }) {
    const { fileId, file, userId, teamId } = payload
    return await this.storageService.updateFile(file, fileId, userId, teamId);
  }

  @RabbitRPC({
    exchange: CHATBOT_EXCHANGE,
    routingKey: CHATBOT_PATTERN.RENAME_FILE,
    queue: CHATBOT_PATTERN.RENAME_FILE,
    errorHandler: customErrorHandler
  })
  async renameFile(payload: { fileId: string; newName: string, userId: string, teamId?: string }) {
    const { fileId, newName, userId, teamId } = payload
    return await this.storageService.renameFile(fileId, newName, userId, teamId);
  }
}
