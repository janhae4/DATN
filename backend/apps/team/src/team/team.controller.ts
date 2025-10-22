import { Controller } from '@nestjs/common';
import { TeamService } from './team.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddMember,
  ChangeRoleMember,
  CreateTeamDto,
  LeaveMember,
  RemoveMember,
  TEAM_PATTERN,
  TransferOwnership,
} from '@app/contracts';

@Controller()
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @MessagePattern(TEAM_PATTERN.FIND_ALL)
  async findAll() {
    return await this.teamService.findAll();
  }

  @MessagePattern(TEAM_PATTERN.FIND_BY_USER_ID)
  async findByUserId(@Payload() userId: string) {
    return await this.teamService.findByUserId(userId);
  }

  @MessagePattern(TEAM_PATTERN.FIND_BY_ID)
  async findById(@Payload() payload: { id: string; userId: string }) {
    return await this.teamService.findById(payload.id, payload.userId);
  }

  @MessagePattern(TEAM_PATTERN.CREATE)
  async create(@Payload() createTeamDto: CreateTeamDto) {
    return await this.teamService.create(createTeamDto);
  }

  @MessagePattern(TEAM_PATTERN.ADD_MEMBER)
  async addMember(@Payload() addMemberDto: AddMember) {
    return await this.teamService.addMembers(addMemberDto);
  }

  @MessagePattern(TEAM_PATTERN.REMOVE_MEMBER)
  async removeMember(@Payload() payload: RemoveMember) {
    return await this.teamService.removeMember(payload);
  }

  @MessagePattern(TEAM_PATTERN.LEAVE_TEAM)
  async leaveTeam(@Payload() payload: LeaveMember) {
    return await this.teamService.leaveTeam(payload);
  }

  @MessagePattern(TEAM_PATTERN.TRANSFER_OWNERSHIP)
  async transferOwnership(@Payload() payload: TransferOwnership) {
    return await this.teamService.transferOwnership(payload);
  }

  @MessagePattern(TEAM_PATTERN.CHANGE_ROLE)
  async changeRole(@Payload() payload: ChangeRoleMember) {
    return await this.teamService.changeMemberRole(payload);
  }
}
