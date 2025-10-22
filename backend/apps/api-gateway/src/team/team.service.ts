import {
  AddMember,
  ChangeRoleMember,
  CreateTeamDto,
  LeaveMember,
  MEMBER_ROLE,
  RemoveMember,
  TEAM_CLIENT,
  TEAM_PATTERN,
  TransferOwnership,
} from '@app/contracts';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TeamService {
  constructor(@Inject(TEAM_CLIENT) private readonly client: ClientProxy) {}

  findAll() {
    return this.client.send(TEAM_PATTERN.FIND_ALL, {});
  }

  findByUserId(id: string) {
    return this.client.send(TEAM_PATTERN.FIND_BY_USER_ID, id);
  }

  findById(id: string, userId: string) {
    return this.client.send(TEAM_PATTERN.FIND_BY_ID, { id, userId });
  }

  create(createTeamDto: CreateTeamDto) {
    return this.client.send(TEAM_PATTERN.CREATE, createTeamDto);
  }

  addMember(payload: AddMember) {
    return this.client.send(TEAM_PATTERN.ADD_MEMBER, payload);
  }

  removeMember(payload: RemoveMember) {
    return this.client.send(TEAM_PATTERN.REMOVE_MEMBER, payload);
  }

  leaveTeam(payload: LeaveMember) {
    return this.client.send(TEAM_PATTERN.LEAVE_TEAM, payload);
  }

  kickMember(requesterId: string, targetId: string, teamId: string) {
    return this.client.send(TEAM_PATTERN.KICK_MEMBER, {
      requesterId,
      targetId,
      teamId,
    });
  }

  transferOwnership(payload: TransferOwnership) {
    return this.client.send(TEAM_PATTERN.TRANSFER_OWNERSHIP, payload);
  }

  changeRole(payload: ChangeRoleMember) {
    if (payload.newRole === MEMBER_ROLE.OWNER) {
      throw new ForbiddenException('Please use route /ownership instead');
    }
    return this.client.send(TEAM_PATTERN.CHANGE_ROLE, payload);
  }
}
