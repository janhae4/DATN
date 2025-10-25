import { Controller } from '@nestjs/common';
import { TeamService } from './team.service';
import {
  AddMember,
  ChangeRoleMember,
  CreateTeamDto,
  LeaveMember,
  RemoveMember,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  TransferOwnership,
} from '@app/contracts';
import { RabbitPayload, RabbitRPC } from '@golevelup/nestjs-rabbitmq';

@Controller()
export class TeamController {
  constructor(private readonly teamService: TeamService) { }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_ALL,
    queue: TEAM_PATTERN.FIND_ALL,
  })
  async findAll() {
    return await this.teamService.findAll();
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_BY_USER_ID,
    queue: TEAM_PATTERN.FIND_BY_USER_ID,
  })
  async findByUserId(@RabbitPayload() userId: string) {
    return await this.teamService.findByUserId(userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_BY_ID,
    queue: TEAM_PATTERN.FIND_BY_ID,
  })
  async findById(@RabbitPayload() payload: { id: string; userId: string }) {
    return await this.teamService.findById(payload.id, payload.userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.CREATE,
    queue: TEAM_PATTERN.CREATE,
  })
  async create(@RabbitPayload() createTeamDto: CreateTeamDto) {
    return await this.teamService.create(createTeamDto);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.ADD_MEMBER,
    queue: TEAM_PATTERN.ADD_MEMBER,
  })
  async addMember(@RabbitPayload() addMemberDto: AddMember) {
    return await this.teamService.addMembers(addMemberDto);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.REMOVE_MEMBER,
    queue: TEAM_PATTERN.REMOVE_MEMBER,
  })
  async removeMember(@RabbitPayload() payload: RemoveMember) {
    return await this.teamService.removeMember(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.LEAVE_TEAM,
    queue: TEAM_PATTERN.LEAVE_TEAM,
  })
  async leaveTeam(@RabbitPayload() payload: LeaveMember) {
    return await this.teamService.leaveTeam(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.TRANSFER_OWNERSHIP,
    queue: TEAM_PATTERN.TRANSFER_OWNERSHIP,
  })
  async transferOwnership(@RabbitPayload() payload: TransferOwnership) {
    return await this.teamService.transferOwnership(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.CHANGE_ROLE,
    queue: TEAM_PATTERN.CHANGE_ROLE,
  })
  async changeRole(@RabbitPayload() payload: ChangeRoleMember) {
    return await this.teamService.changeMemberRole(payload);
  }
}