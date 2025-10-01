import { Controller } from '@nestjs/common';
import { TeamService } from './team.service';
import { MessagePattern } from '@nestjs/microservices';
import { CreateTeamDto } from '../../../../libs/contracts/src/team/create-team.dto';
import {
  MEMBER_ROLE,
  MemberDto,
} from '../../../../libs/contracts/src/team/member.dto';
import { TEAM_PATTERN } from '@app/contracts/team/team.pattern';

@Controller()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @MessagePattern(TEAM_PATTERN.FIND_ALL)
  async findAll() {
    return await this.teamService.findAll();
  }

  @MessagePattern(TEAM_PATTERN.FIND_BY_OWNER_ID)
  async findByOwnerId(ownerId: string) {
    return await this.teamService.findByOwnerId(ownerId);
  }

  @MessagePattern(TEAM_PATTERN.FIND_BY_ID)
  async findById(id: string) {
    return await this.teamService.findById(id);
  }

  @MessagePattern(TEAM_PATTERN.CREATE)
  async create(createTeamDto: CreateTeamDto) {
    return await this.teamService.create(createTeamDto);
  }

  @MessagePattern(TEAM_PATTERN.ADD_MEMBER)
  async addMember(teamId: string, member: MemberDto) {
    return await this.teamService.addMember(teamId, member);
  }

  @MessagePattern(TEAM_PATTERN.REMOVE_MEMBER)
  async removeMember(teamId: string, userId: string, requesterId: string) {
    return await this.teamService.removeMember(teamId, userId, requesterId);
  }

  @MessagePattern(TEAM_PATTERN.PROMOTE_TO_ADMIN)
  async promoteToAdmin(
    teamId: string,
    targetUserId: string,
    requesterId: string,
  ) {
    return await this.teamService.changeRole(
      teamId,
      targetUserId,
      MEMBER_ROLE.ADMIN,
      requesterId,
    );
  }

  @MessagePattern(TEAM_PATTERN.DEMOTE_FROM_ADMIN)
  async demoteFromAdmin(
    teamId: string,
    targetUserId: string,
    requesterId: string,
  ) {
    return await this.teamService.changeRole(
      teamId,
      targetUserId,
      MEMBER_ROLE.MEMBER,
      requesterId,
    );
  }
}
