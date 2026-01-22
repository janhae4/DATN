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
    errorHandler: customErrorHandler,
  })
  async findAll() {
    return await this.teamService.findAll();
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_BY_USER_ID,
    queue: TEAM_PATTERN.FIND_BY_USER_ID,
    errorHandler: customErrorHandler,
  })
  async findByUserId(userId: string) {
    return await this.teamService.findByUserId(userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_BY_ID,
    queue: TEAM_PATTERN.FIND_BY_ID,
    errorHandler: customErrorHandler,
  })
  async findById(payload: { id: string; userId: string }) {
    return await this.teamService.findById(payload.id, payload.userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_ROOMS_BY_USER_ID,
    queue: TEAM_PATTERN.FIND_ROOMS_BY_USER_ID,
    errorHandler: customErrorHandler,
  })
  async findByName(userId: string) {
    return await this.teamService.findRoomsByUserId(userId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.CREATE,
    queue: TEAM_PATTERN.CREATE,
    errorHandler: customErrorHandler,
  })
  async create(createTeamDto: CreateTeamDto) {
    return await this.teamService.create(createTeamDto);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.ADD_MEMBER,
    queue: TEAM_PATTERN.ADD_MEMBER,
    errorHandler: customErrorHandler,
  })
  async addMember(addMemberDto: AddMember) {
    return await this.teamService.addMembers(addMemberDto);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.ACCEPT_INVITATION,
    queue: TEAM_PATTERN.ACCEPT_INVITATION,
    errorHandler: customErrorHandler,
  })
  async acceptInvitation(payload: { userId: string; teamId: string, notificationId: string }) {
    return await this.teamService.acceptInvitation(payload.userId, payload.teamId, payload.notificationId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.DECLINE_INVITATION,
    queue: TEAM_PATTERN.DECLINE_INVITATION,
    errorHandler: customErrorHandler,
  })
  async declineInvitation(payload: { userId: string; teamId: string, notificationId: string }) {
    return await this.teamService.declineInvitation(payload.userId, payload.teamId, payload.notificationId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.REMOVE_MEMBER,
    queue: TEAM_PATTERN.REMOVE_MEMBER,
    errorHandler: customErrorHandler,
  })
  async removeMember(payload: RemoveMember) {
    return await this.teamService.removeMember(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.REMOVE_TEAM,
    queue: TEAM_PATTERN.REMOVE_TEAM,
    errorHandler: customErrorHandler,
  })
  async removeTeam(payload: { userId: string; teamId: string }) {
    return await this.teamService.removeTeam(payload.userId, payload.teamId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.LEAVE_TEAM,
    queue: TEAM_PATTERN.LEAVE_TEAM,
    errorHandler: customErrorHandler,
  })
  async leaveTeam(payload: LeaveMember) {
    return await this.teamService.leaveTeam(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.TRANSFER_OWNERSHIP,
    queue: TEAM_PATTERN.TRANSFER_OWNERSHIP,
    errorHandler: customErrorHandler,
  })
  async transferOwnership(payload: TransferOwnership) {
    return await this.teamService.transferOwnership(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.CHANGE_ROLE,
    queue: TEAM_PATTERN.CHANGE_ROLE,
    errorHandler: customErrorHandler,
  })
  async changeRole(payload: ChangeRoleMember) {
    return await this.teamService.changeMemberRole(payload);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.SEND_NOTIFICATION,
    queue: TEAM_PATTERN.SEND_NOTIFICATION,
    errorHandler: customErrorHandler,
  })
  async sendNotification(payload: {
    userId: string;
    teamId: string;
    message: NotificationEventDto;
  }) {
    return await this.teamService.sendNotification(
      payload.userId,
      payload.teamId,
      payload.message,
    );
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_PARTICIPANTS,
    queue: TEAM_PATTERN.FIND_PARTICIPANTS,
    errorHandler: customErrorHandler,
  })
  async findParticipants(payload: { userId: string; teamId: string }) {
    return await this.teamService.getTeamMembers(payload.userId, payload.teamId);
  }

  @RabbitRPC({
    exchange: TEAM_EXCHANGE,
    routingKey: TEAM_PATTERN.FIND_PARTICIPANT,
    queue: TEAM_PATTERN.FIND_PARTICIPANT,
    errorHandler: customErrorHandler,
  })
  async findParticipantsIds(payload: { teamId: string, userId: string }) {
    return await this.teamService.getTeamMember(payload.userId, payload.teamId);
  }
}
