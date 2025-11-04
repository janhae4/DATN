import { Controller } from '@nestjs/common';
import { TeamService } from './team.service';
import {
  AddMember,
  ChangeRoleMember,
  CreateTeamDto,
  LeaveMember,
  NotificationEventDto,
  RemoveMember,
  TEAM_EXCHANGE,
  TEAM_PATTERN,
  TransferOwnership,
} from '@app/contracts';
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';
import { customErrorHandler } from '@app/common';
import { VerifyPermissionPayload } from '@app/contracts/team/dto/verify-permission.dto';

@Controller()
export class TeamController {
  constructor(private readonly teamService: TeamService) { }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_ALL,
    queue: TEAM_PATTERN.FIND_ALL,
    errorHandler: customErrorHandler
  })
  async findAll() {
    return await this.teamService.findAll();
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_BY_USER_ID,
    queue: TEAM_PATTERN.FIND_BY_USER_ID,
    errorHandler: customErrorHandler
  })
  async findByUserId(userId: string) {
    return await this.teamService.findByUserId(userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_BY_ID,
    queue: TEAM_PATTERN.FIND_BY_ID,
    errorHandler: customErrorHandler
  })
  async findById(payload: { id: string; userId: string }) {
    return await this.teamService.findById(payload.id, payload.userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_ROOMS_BY_USER_ID,
    queue: TEAM_PATTERN.FIND_ROOMS_BY_USER_ID,
    errorHandler: customErrorHandler
  })
  async findByName(userId: string) {
    return await this.teamService.findRoomsByUserId(userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.CREATE,
    queue: TEAM_PATTERN.CREATE,
    errorHandler: customErrorHandler
  })
  async create(createTeamDto: CreateTeamDto) {
    return await this.teamService.create(createTeamDto);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.ADD_MEMBER,
    queue: TEAM_PATTERN.ADD_MEMBER,
    errorHandler: customErrorHandler
  })
  async addMember(addMemberDto: AddMember) {
    return await this.teamService.addMembers(addMemberDto);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.REMOVE_MEMBER,
    queue: TEAM_PATTERN.REMOVE_MEMBER,
    errorHandler: customErrorHandler
  })
  async removeMember(payload: RemoveMember) {
    return await this.teamService.removeMember(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.REMOVE_TEAM,
    queue: TEAM_PATTERN.REMOVE_TEAM,
    errorHandler: customErrorHandler
  })
  async removeTeam(payload: { userId: string; teamId: string }) {
    return await this.teamService.removeTeam(payload.userId, payload.teamId);
  }


  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.LEAVE_TEAM,
    queue: TEAM_PATTERN.LEAVE_TEAM,
    errorHandler: customErrorHandler
  })
  async leaveTeam(payload: LeaveMember) {
    return await this.teamService.leaveTeam(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.TRANSFER_OWNERSHIP,
    queue: TEAM_PATTERN.TRANSFER_OWNERSHIP,
    errorHandler: customErrorHandler
  })
  async transferOwnership(payload: TransferOwnership) {
    return await this.teamService.transferOwnership(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.CHANGE_ROLE,
    queue: TEAM_PATTERN.CHANGE_ROLE,
    errorHandler: customErrorHandler
  })
  async changeRole(payload: ChangeRoleMember) {
    return await this.teamService.changeMemberRole(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.VERIFY_PERMISSION,
    queue: TEAM_PATTERN.VERIFY_PERMISSION,
    errorHandler: customErrorHandler
  })
  async verifyPermission(payload: VerifyPermissionPayload) {
    return await this.teamService.verifyPermission(payload.userId, payload.teamId, payload.roles);
  }


  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.SEND_NOTIFICATION,
    queue: TEAM_PATTERN.SEND_NOTIFICATION,
    errorHandler: customErrorHandler
  })
  async sendNotification(payload: { userId: string, teamId: string; message: NotificationEventDto }) {
    return await this.teamService.sendNotification(payload.userId, payload.teamId, payload.message);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_PARTICIPANTS,
    queue: TEAM_PATTERN.FIND_PARTICIPANTS,
    errorHandler: customErrorHandler
  })
  async findParticipants(teamId: string) {
    return await this.teamService.getMembersWithProfiles(teamId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
    queue: TEAM_PATTERN.FIND_PARTICIPANT_ROLES,
  })
  async findParticipantRoles(payload: { teamId: string ; userId: string }) {
    return await this.teamService.findParticipantRoles(payload.userId, payload.teamId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_PARTICIPANTS_IDS,
    queue: TEAM_PATTERN.FIND_PARTICIPANTS_IDS,
    errorHandler: customErrorHandler
  })
  async findParticipantsIds(teamId: string) {
    return await this.teamService.getMembersFromTeam(teamId);
  }
}