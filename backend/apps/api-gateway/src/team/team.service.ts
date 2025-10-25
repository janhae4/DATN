import {
  AddMember,
  ChangeRoleMember,
  CreateTeamDto,
  LeaveMember,
  MEMBER_ROLE,
  RemoveMember,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  TransferOwnership,
} from '@app/contracts';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class TeamService {
  constructor(private readonly amqpConnection: AmqpConnection) { }

  findAll() {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_ALL,
      payload: {},
    });
  }

  findByUserId(id: string) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_BY_USER_ID,
      payload: id,
    });
  }

  findById(id: string, userId: string) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.FIND_BY_ID,
      payload: { id, userId },
    });
  }

  create(createTeamDto: CreateTeamDto) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.CREATE,
      payload: createTeamDto,
    });
  }

  addMember(payload: AddMember) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.ADD_MEMBER,
      payload: payload,
    });
  }

  removeMember(payload: RemoveMember) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.REMOVE_MEMBER,
      payload: payload,
    });
  }

  leaveTeam(payload: LeaveMember) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.LEAVE_TEAM,
      payload: payload,
    });
  }

  kickMember(requesterId: string, targetId: string, teamId: string) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.KICK_MEMBER, // Giả sử PATTERN này tồn tại
      payload: {
        requesterId,
        targetId,
        teamId,
      },
    });
  }

  transferOwnership(payload: TransferOwnership) {
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.TRANSFER_OWNERSHIP,
      payload: payload,
    });
  }

  changeRole(payload: ChangeRoleMember) {
    if (payload.newRole === MEMBER_ROLE.OWNER) {
      throw new ForbiddenException('Please use route /ownership instead');
    }
    return this.amqpConnection.request({
      exchange: TEAM_EXCHANGE,
      routingKey: TEAM_PATTERN.CHANGE_ROLE,
      payload: payload,
    });
  }
}