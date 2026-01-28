import { Injectable } from '@nestjs/common';
import {

  CreateDirectDiscussionDto,
  CreateMessageDto,
  DISCUSSION_EXCHANGE,
  DISCUSSION_PATTERN,
  GetMessageDiscussionDto,
  RequestPaginationDto,
  SearchMessageDto,
  CreateTeamEventPayload,
  RemoveTeamEventPayload,
  AddMemberEventPayload,
  RemoveMemberEventPayload,
  LeaveMemberEventPayload,
  DiscussionType,
  MemberRole,
  MemberShip,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { PermissionOverrideDto } from './dto/update-permission.dto';
import { unwrapRpcResult } from '../common/helper/rpc';
import { CreateDiscussionMessageDto } from './dto/create-discussion-message.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class DiscussionService {
  private readonly rpcTimeout = 10000;

  constructor(
    private readonly amqp: AmqpConnection,
    private readonly userService: UserService,
  ) { }

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
      payload: { discussionId, userId, page: paginationDto.page, limit: paginationDto.limit },
      timeout: this.rpcTimeout,
    })
  }

  async getDiscussionByTeamId(userId: string, teamId: string) {
    const result = await this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_TEAM_ID,
      payload: { teamId, userId },
      timeout: this.rpcTimeout,
    });
    console.log(result)
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

  toggleReaction(userId: string, messageId: string, emoji: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.TOGGLE_REACTION,
      payload: { userId, messageId, emoji },
      timeout: this.rpcTimeout,
    })
  }

  // Server Management
  async createServer(payload: CreateTeamEventPayload) {
    const result = await this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.CREATE_SERVER,
      payload,
      timeout: this.rpcTimeout,
    });
    return unwrapRpcResult(result);
  }

  deleteServer(payload: RemoveTeamEventPayload) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.DELETE_SERVER,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  permanentDeleteServer(teamId: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.PERMANENT_DELETE_SERVER,
      payload: { teamId },
      timeout: this.rpcTimeout,
    })
  }

  updateServer(payload: { teamId: string; name?: string; avatar?: string }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.UPDATE_SERVER,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  getUserServerList(userId: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_USER_SERVER_LIST,
      payload: { userId },
      timeout: this.rpcTimeout,
    })
  }

  getDeletedServers(userId: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_DELETED_SERVERS,
      payload: { userId },
      timeout: this.rpcTimeout,
    })
  }

  restoreServer(teamId: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.RESTORE_SERVER,
      payload: { teamId },
      timeout: this.rpcTimeout,
    })
  }

  async getServerMembers(payload: { teamId: string, page: number, limit: number }) {
    const rpcResult = await this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_SERVER_MEMBERS,
      payload,
      timeout: this.rpcTimeout,
    });

    const result = unwrapRpcResult(rpcResult);
    if (!result || !result.data || result.data.length === 0) return result;

    const userIds = result.data.map((m: any) => m.userId);
    const usersRpcResult = await this.userService.findManyByIds(userIds);
    const users = unwrapRpcResult(usersRpcResult) || [];

    const userMap = new Map<string, any>(users.map((u: any) => [u.id, u]));

    result.data = result.data.map((m: any) => {
      const user = userMap.get(m.userId);
      return {
        ...m,
        name: user?.name || `User ${m.userId.substring(0, 5)}`,
        avatar: user?.avatar || null,
      };
    });

    return result;
  }

  // Channel Management
  createChannel(payload: { teamId: string; name: string; type: DiscussionType; ownerId: string; parentId?: string }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.CREATE_CHANNEL,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  createCategory(payload: { teamId: string; name: string; ownerId: string }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.CREATE_CATEGORY,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  updateChannel(payload: { id: string; name?: string; type?: DiscussionType }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.UPDATE_CHANNEL,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  deleteChannel(channelId: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.DELETE_CHANNEL,
      payload: { channelId },
      timeout: this.rpcTimeout,
    })
  }

  reorderChannels(payload: { teamId: string; orders: { id: string; position: number; parentId?: string }[] }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.REORDER_CHANNELS,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  getChannelsByTeam(teamId: string, userId?: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_DISCUSSION_BY_TEAM_ID,
      payload: { teamId, userId },
      timeout: this.rpcTimeout,
    })
  }

  // Member Management
  addMembers(payload: AddMemberEventPayload) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.ADD_MEMBER,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  removeMember(payload: RemoveMemberEventPayload) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.REMOVE_MEMBER,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  leaveTeam(payload: LeaveMemberEventPayload) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.LEAVE_TEAM,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  // Invite System
  generateInvite(payload: { teamId: string; discussionId: string; creatorId: string; maxUses?: number; expiresInDays?: number }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GENERATE_INVITE,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  joinServer(payload: { code: string; userId: string }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.JOIN_SERVER,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  getInvite(code: string) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_INVITE,
      payload: { code },
      timeout: this.rpcTimeout,
    })
  }

  updateMemberRole(payload: { teamId: string; userId: string; role: MemberRole; requesterId: string }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.UPDATE_MEMBER_ROLE,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  updatePermission(payload: { discussionId: string; requesterId: string; override: PermissionOverrideDto }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.UPDATE_PERMISSION,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  // User Sync
  updateUser(payload: { id: string; name?: string; avatar?: string }) {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.UPDATE_USER,
      payload,
      timeout: this.rpcTimeout,
    })
  }

  // Admin
  getAllMessages() {
    return this.amqp.request({
      exchange: DISCUSSION_EXCHANGE,
      routingKey: DISCUSSION_PATTERN.GET_ALL_MESSAGES,
      payload: {},
      timeout: this.rpcTimeout,
    })
  }
}
