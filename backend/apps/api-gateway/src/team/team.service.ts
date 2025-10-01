import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { TEAM_CLIENT } from '@app/contracts/constants';
import { CreateTeamDto } from '@app/contracts/team/create-team.dto';
import { MemberDto } from '@app/contracts/team/member.dto';
import { TEAM_PATTERN } from '@app/contracts/team/team.pattern';

@Injectable()
export class TeamService {
  constructor(@Inject(TEAM_CLIENT) private readonly client: ClientProxy) {}

  findAll() {
    return this.client.send(TEAM_PATTERN.FIND_ALL, {});
  }

  findByOwnerId(ownerId: string) {
    return this.client.send(TEAM_PATTERN.FIND_BY_OWNER_ID, ownerId);
  }

  findById(id: string) {
    return this.client.send(TEAM_PATTERN.FIND_BY_ID, id);
  }

  create(createTeamDto: CreateTeamDto) {
    return this.client.send(TEAM_PATTERN.CREATE, createTeamDto);
  }

  addMember(teamId: string, member: MemberDto) {
    return this.client.send(TEAM_PATTERN.ADD_MEMBER, { teamId, member });
  }

  removeMember(teamId: string, userId: string, requesterId: string) {
    return this.client.send(TEAM_PATTERN.REMOVE_MEMBER, {
      teamId,
      userId,
      requesterId,
    });
  }

  promoteToAdmin(teamId: string, targetUserId: string, requesterId: string) {
    return this.client.send(TEAM_PATTERN.PROMOTE_TO_ADMIN, {
      teamId,
      targetUserId,
      requesterId,
    });
  }

  demoteFromAdmin(teamId: string, targetUserId: string, requesterId: string) {
    return this.client.send(TEAM_PATTERN.DEMOTE_FROM_ADMIN, {
      teamId,
      targetUserId,
      requesterId,
    });
  }
}
