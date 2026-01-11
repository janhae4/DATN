import { Controller } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import {
  EVENTS,
  EVENTS_EXCHANGE,
  REDIS_EXCHANGE,
  REDIS_PATTERN,
  User,
} from '@app/contracts';
import type { AddMemberEventPayload, ChangeRoleMember, LeaveMemberEventPayload, RemoveMemberEventPayload, RemoveTeamEventPayload, TransferOwnership, TransferOwnershipEventPayload } from "@app/contracts"
import { customErrorHandler } from '@app/common';

@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) { }


  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.IS_TOKEN_USED,
    queue: REDIS_PATTERN.IS_TOKEN_USED,
    errorHandler: customErrorHandler
  })
  async isTokenUsed(payload: { userId: string; tokenHash: string }) {
    const { userId, tokenHash } = payload;
    return await this.redisService.isTokenUsed(userId, tokenHash);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.STORE_REFRESH_TOKEN,
    queue: REDIS_PATTERN.STORE_REFRESH_TOKEN,
    errorHandler: customErrorHandler
  })
  async storeRefreshToken(data: {
    userId: string;
    sessionId: string;
    hashedRefresh: string;
    exp: number;
  }) {
    const { userId, sessionId, hashedRefresh, exp } = data;
    return await this.redisService.storeRefreshToken(
      userId,
      sessionId,
      hashedRefresh,
      exp,
    );
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.STORE_GOOGLE_TOKEN,
    queue: REDIS_PATTERN.STORE_GOOGLE_TOKEN,
    errorHandler: customErrorHandler
  })
  async storeGoogleToken(data: {
    userId: string;
    accessToken: string;
    refreshToken: string;
  }) {
    const { userId, accessToken, refreshToken } = data;
    console.log('Google userID', userId);
    console.log('Google accessToken', accessToken);
    console.log('Google refreshToken', refreshToken);
    return await this.redisService.storeGoogleToken(
      userId,
      accessToken,
      refreshToken,
    );
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_STORED_REFRESH_TOKEN,
    queue: REDIS_PATTERN.GET_STORED_REFRESH_TOKEN,
    errorHandler: customErrorHandler
  })
  async getStoredRefreshToken(data: { userId: string; sessionId: string }) {
    console.log(data)
    const { userId, sessionId } = data;
    return await this.redisService.getStoredRefreshToken(userId, sessionId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_GOOGLE_TOKEN,
    queue: REDIS_PATTERN.GET_GOOGLE_TOKEN,
    errorHandler: customErrorHandler
  })
  async getGoogleToken(userId: string) {
    return await this.redisService.getGoogleToken(userId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.DELETE_REFRESH_TOKEN,
    queue: REDIS_PATTERN.DELETE_REFRESH_TOKEN,
    errorHandler: customErrorHandler
  })
  async deleteRefreshToken(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.deleteRefreshToken(userId, sessionId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.CLEAR_REFRESH_TOKENS,
    queue: REDIS_PATTERN.CLEAR_REFRESH_TOKENS,
    errorHandler: customErrorHandler
  })
  async clearRefreshTokens(userId: string) {
    return await this.redisService.clearRefreshTokens(userId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.SET_LOCK_KEY,
    queue: REDIS_PATTERN.SET_LOCK_KEY,
    errorHandler: customErrorHandler
  })
  async setLockKey(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.setLockKey(userId, sessionId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.DELETE_LOCK_KEY,
    queue: REDIS_PATTERN.DELETE_LOCK_KEY,
    errorHandler: customErrorHandler
  })
  async deleteLockKey(data: { userId: string; sessionId: string }) {
    const { userId, sessionId } = data;
    return await this.redisService.deleteLockKey(userId, sessionId);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LOGIN,
    queue: "event.login.redis",
    errorHandler: customErrorHandler
  })
  async login(payload: { user: User, memberRoles?: { teamId: string; role: string }[] }) {
    return await this.redisService.handleUserLogin(payload.user, payload.memberRoles);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.USER_UPDATED,
    queue: "event.user.updated.redis",
    errorHandler: customErrorHandler
  })
  async userUpdated(user: User) {
    return await this.redisService.userUpdated(user);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.CREATE_TEAM,
    queue: "event.create.team.redis",
    errorHandler: customErrorHandler
  })
  async createTeam(payload: any) {
    return await this.redisService.createTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.ADD_MEMBER,
    queue: "event.add.team.redis",
    errorHandler: customErrorHandler
  })
  async addMember(payload: AddMemberEventPayload) {
    return await this.redisService.addMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_MEMBER,
    queue: "event.remove.team.redis",
    errorHandler: customErrorHandler
  })
  async removeMember(payload: RemoveMemberEventPayload) {
    return await this.redisService.removeMember(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.REMOVE_TEAM,
    queue: "event.remove.team.redis",
    errorHandler: customErrorHandler
  })
  async removeTeam(payload: RemoveTeamEventPayload) {
    return await this.redisService.removeTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.RENAME_TEAM,
    queue: "event.rename.team.redis",
    errorHandler: customErrorHandler
  })
  async renameTeam(payload: any) {
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.LEAVE_TEAM,
    queue: "event.leave.team.redis",
    errorHandler: customErrorHandler
  })
  async leaveTeam(payload: LeaveMemberEventPayload) {
    return await this.redisService.leaveTeam(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.OWNERSHIP_TRANSFERRED,
    queue: "event.join.team.redis",
    errorHandler: customErrorHandler
  })
  async ownershipTransferred(payload: TransferOwnershipEventPayload) {
    return await this.redisService.ownershipTransferred(payload);
  }

  @RabbitSubscribe({
    exchange: EVENTS_EXCHANGE,
    routingKey: EVENTS.MEMBER_ROLE_CHANGED,
    queue: "event.change.role.team.redis",
    errorHandler: customErrorHandler
  })
  async changeRoleTeam(payload: ChangeRoleMember) {
    return await this.redisService.changeRoleTeam(payload);
  }


  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_USER_INFO,
    queue: REDIS_PATTERN.GET_USER_INFO,
    errorHandler: customErrorHandler
  })
  async getUserInfo(userIds: string[]) {
    return await this.redisService.getUserInfo(userIds);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_USER_ROLE,
    queue: REDIS_PATTERN.GET_USER_ROLE,
    errorHandler: customErrorHandler
  })
  async getUserRole(payload: { userId: string; teamId: string }) {
    const { userId, teamId } = payload;
    return await this.redisService.getUserRole(userId, teamId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_MANY_USERS_INFO,
    queue: REDIS_PATTERN.GET_MANY_USERS_INFO,
    errorHandler: customErrorHandler
  })
  async cacheUserProfile(userIds: string[]) {
    return await this.redisService.getManyUserInfo(userIds);
  }

  @RabbitSubscribe({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.SET_MANY_USERS_INFO,
    queue: REDIS_PATTERN.SET_MANY_USERS_INFO,
    errorHandler: customErrorHandler
  })
  async setManyUserInfo(users: User[]) {
    return await this.redisService.setManyUserInfo(users);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_TEAM_MEMBERS,
    queue: REDIS_PATTERN.GET_TEAM_MEMBERS,
    errorHandler: customErrorHandler
  })
  async getTeamMembers(teamId: string) {
    return await this.redisService.getTeamMembers(teamId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.GET_TEAM_MEMBERS_WITH_PROFILES,
    queue: REDIS_PATTERN.GET_TEAM_MEMBERS_WITH_PROFILES,
    errorHandler: customErrorHandler
  })
  async getTeamMembersWithProfiles(teamId: string) {
    return await this.redisService.getTeamMembersWithProfiles(teamId);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.SET_TEAM_MEMBERS,
    queue: REDIS_PATTERN.SET_TEAM_MEMBERS,
    errorHandler: customErrorHandler
  })
  async setTeamMembers(payload: { teamId: string; members: string[] }) {
    const { teamId, members } = payload;
    return await this.redisService.setTeamMembers(teamId, members);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.PUSH_MEETING_BUFFER,
    queue: REDIS_PATTERN.PUSH_MEETING_BUFFER,
    errorHandler: customErrorHandler
  })
  async pushToMeetingBuffer(payload: { roomId: string, userId: string, userName: string, content: string, timestamp: Date }) {
    const { roomId, userId, userName, content, timestamp } = payload;
    return await this.redisService.pushToMeetingBuffer(roomId, userId, userName, content, timestamp);
  }

  @RabbitRPC({
    exchange: REDIS_EXCHANGE,
    routingKey: REDIS_PATTERN.POP_MEETING_BUFFER,
    queue: REDIS_PATTERN.POP_MEETING_BUFFER,
    errorHandler: customErrorHandler
  })
  async popMeetingBuffer(roomId: string) {
    return await this.redisService.popMeetingBuffer(roomId);
  }

}