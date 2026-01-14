import {
  AddMember,
  ChangeRoleMember,
  CreateTeamDto,
  LeaveMember,
  MemberRole,
  RemoveMember,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  TransferOwnership,
} from '@app/contracts';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { unwrapRpcResult } from '../common/helper/rpc';
import { RmqClientService } from '@app/common';

@Injectable()
export class TeamService {
  private logger = new Logger(TeamService.name);
  constructor(private readonly amqpConnection: RmqClientService) { }

  async findAll() {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_ALL,
      payload: {},
    }))
  }

  async findByUserId(id: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_BY_USER_ID,
      payload: id,
    }));
  }

  async findById(id: string, userId: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_BY_ID,
      payload: { id, userId },
    }));
  }

  async findParticipants(userId: string, teamId: string) {
    this.logger.log('Finding participants for team:', teamId, 'by user:', userId);
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_PARTICIPANTS,
      payload: { userId, teamId },
    }));
  }

  async create(createTeamDto: CreateTeamDto) {
    console.log('Creating team with data:', createTeamDto);
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.CREATE,
      payload: createTeamDto,
    }));
  }

  async addMember(payload: AddMember) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.ADD_MEMBER,
      payload: payload,
    }));
  }

  async acceptInvitation(userId: string, teamId: string, notificationId: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.ACCEPT_INVITATION,
      payload: { userId, teamId, notificationId },
    }))
  }

  async declineInvitation(userId: string, teamId: string, notificationId: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.DECLINE_INVITATION,
      payload: { userId, teamId, notificationId },
    }))
  }

  async removeMember(payload: RemoveMember) {
    console.log("RemoveMember payload:", payload);
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.REMOVE_MEMBER,
      payload
    }));
  }

  async removeTeam(userId: string, teamId: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.REMOVE_TEAM,
      payload: { userId, teamId },
    }));
  }

  async leaveTeam(payload: LeaveMember) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.LEAVE_TEAM,
      payload: payload,
    }));
  }

  async kickMember(requesterId: string, targetId: string, teamId: string) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.KICK_MEMBER, // Giả sử PATTERN này tồn tại
      payload: {
        requesterId,
        targetId,
        teamId,
      },
    }));
  }

  async transferOwnership(payload: TransferOwnership) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.TRANSFER_OWNERSHIP,
      payload: payload,
    }));
  }

  async changeRole(payload: ChangeRoleMember) {
    if (payload.newRole === MemberRole.OWNER) {
      throw new ForbiddenException('Please use route /ownership instead');
    }
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.CHANGE_ROLE,
      payload: payload,
    }));
  }

  async verifyPermission(userId: string, teamId: string, allowedRoles: MemberRole[]) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId, roles: allowedRoles },
    }));
  }

  async verifyMemberPermission(userId: string, teamId: string, allowedRoles: MemberRole[]) {
    return unwrapRpcResult(await this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
      payload: { userId, teamId, roles: allowedRoles },
    }));
  }
}