import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, In, JsonContains } from 'typeorm';
import {
  Team,
  MEMBER_ROLE,
  USER_PATTERNS,
  EVENTS,
  User,
  MemberDto,
  CreateTeamDto,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ChangeRoleMember,
  LeaveMember,
  AddMember,
  RemoveMember,
  TransferOwnership,
  AddMemberEventPayload,
  RemoveMemberEventPayload,
  TransferOwnershipEventPayload,
  CreateTeamEventPayload,
  USER_EXCHANGE,
  EVENTS_EXCHANGE,
  SendMessageEventPayload,
  SOCKET_EXCHANGE,
  TEAM_PATTERN,
  NotificationEventDto,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RemoveTeamEventPayload } from '@app/contracts/team/dto/remove-team.dto';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    private readonly amqp: AmqpConnection,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  async create(createTeamDto: CreateTeamDto): Promise<Team> {
    const { name, memberIds = [], ownerId } = createTeamDto;
    this.logger.log(`Validating members for new team "${name}"...`);

    const allUserIdsToValidate = Array.from(new Set([...memberIds, ownerId]));
    console.log(allUserIdsToValidate);
    const usersFromDb = await this.amqp.request<User[]>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
      payload: allUserIdsToValidate,
    })

    if (usersFromDb.length !== allUserIdsToValidate.length) {
      const foundIds = new Set(usersFromDb.map((u) => u.id));
      const missingIds = allUserIdsToValidate.filter((id) => !foundIds.has(id));
      throw new BadRequestException(
        `The following user IDs do not exist: ${missingIds.join(', ')}`,
      );
    }

    const userMap = new Map(usersFromDb.map((u) => [u.id, u]));
    const finalMembers: MemberDto[] = allUserIdsToValidate.map((id) => {
      const realUser = userMap.get(id)!;
      return {
        id: realUser.id,
        name: realUser.name,
        avatar: realUser.avatar,
        role: id === ownerId ? MEMBER_ROLE.OWNER : MEMBER_ROLE.MEMBER,
      };
    });

    this.logger.log(`Creating a new team named "${name}"...`);

    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);

      const teamData = {
        name,
        ownerId: createTeamDto.ownerId,
        members: finalMembers,
      };

      const newTeam = teamRepo.create(teamData);
      const savedTeam = await teamRepo.save(newTeam);

      this.logger.log(`Team [${savedTeam.id}] created. Emitting event.`);
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.CREATE_TEAM, {
        ownerId: savedTeam.ownerId,
        ownerName: userMap.get(ownerId)?.name,
        members: finalMembers,
        name: savedTeam.name,
        teamId: savedTeam.id,
        createdAt: savedTeam.createdAt,
      } as CreateTeamEventPayload);

      return savedTeam;
    });
  }

  async addMembers(addMemberDto: AddMember): Promise<Team> {
    const { memberIds, requesterId, teamId } = addMemberDto;

    this.logger.log(
      `User [${requesterId}] adding ${memberIds.length} members to team [${teamId}].`,
    );

    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);

      this._verifyPermission({
        team,
        requesterId,
        allowedRoles: [MEMBER_ROLE.ADMIN, MEMBER_ROLE.OWNER],
        action: 'add_member',
      });

      const existingMemberIds = new Set(team.members.map((m) => m.id));
      const newMemberIds = memberIds.filter((id) => !existingMemberIds.has(id));

      if (newMemberIds.length === 0) {
        this.logger.log(
          `No new members to add to team ${teamId}. All provided member IDs are already member`,
        );
        return team;
      }

      const usersFromDb = await this.amqp.request<User[]>({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
        payload: newMemberIds,
      })

      if (usersFromDb.length !== newMemberIds.length) {
        const foundIds = new Set(usersFromDb.map((u) => u.id));
        const missingIds = memberIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(
          `The following user IDs do not exist: ${missingIds.join(', ')}`,
        );
      }

      const userMap = new Map(usersFromDb.map((u) => [u.id, u]));
      const finalMembers: MemberDto[] = newMemberIds.map((id) => {
        const realUser = userMap.get(id)!;
        return {
          id: realUser.id,
          name: realUser.name,
          avatar: realUser.avatar,
          role: MEMBER_ROLE.MEMBER,
        };
      });

      team.members.push(...finalMembers);
      const updatedTeam = await teamRepo.save(team);

      const requester = team.members.find((m) => m.id === requesterId);
      const requesterName = requester ? requester.name : '';

      this.logger.log(`Members added to team [${teamId}]. Emitting event.`);
      const eventPayload: AddMemberEventPayload = {
        members: finalMembers,
        requesterId,
        requesterName,
        teamId,
        teamName: team.name,
      };
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.ADD_MEMBER, eventPayload);
      return updatedTeam;
    });
  }

  async removeMember(payload: RemoveMember): Promise<Team> {
    const { teamId, memberIds, requesterId } = payload;
    console.log(teamId, memberIds, requesterId);

    this.logger.log(
      `User [${requesterId}] removing ${memberIds.length} member from team [${teamId}].`,
    );

    if (memberIds.includes(requesterId)) {
      throw new BadRequestException(
        "To leave the team, please use the 'leave team' endpoint.",
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);

      this._verifyPermission({
        team,
        requesterId,
        targetUserIds: memberIds,
        allowedRoles: [MEMBER_ROLE.ADMIN, MEMBER_ROLE.OWNER],
        action: 'remove_member',
      });

      const requester = team.members.find((m) => m.id === requesterId);
      const requesterName = requester ? requester.name : 'Unknown';

      const initialMemberIds = new Set(team.members.map((m) => m.id));

      team.members = team.members.filter((m) => !memberIds.includes(m.id));

      const removedIds = team.members.filter((id) =>
        initialMemberIds.has(id.id),
      );
      if (removedIds.length === 0) {
        throw new NotFoundException(
          `None of the provided member IDs were found in the team.`,
        );
      }

      const updatedTeam = await teamRepo.save(team);
      this.logger.log(`Member removed from team [${teamId}]. Emitting event.`);
      const eventPayload: RemoveMemberEventPayload = {
        teamId,
        teamName: team.name,
        requesterId,
        requesterName,
        memberIds,
      };
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.REMOVE_MEMBER, eventPayload);

      return updatedTeam;
    });
  }

  async removeTeam(userId: string, teamId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);
      this._verifyPermission({
        team,
        requesterId: userId,
        allowedRoles: [MEMBER_ROLE.OWNER],
        action: 'remove_team',
      })
      const removedTeam = await teamRepo.remove(team)

      const requester = team.members.find((m) => m.id === userId);
      const requesterName = requester ? requester.name : 'Unknown';

      this.amqp.publish(
        EVENTS_EXCHANGE,
        EVENTS.REMOVE_TEAM,
        {
          requesterId: userId,
          requesterName,
          teamId,
          teamName: team.name,
          memberIds: team.members.map((m) => m.id),
        } as RemoveTeamEventPayload
      )
      return removedTeam
    })
  }

  async changeMemberRole(payload: ChangeRoleMember): Promise<Team> {
    const { teamId, targetId, requesterId, newRole } = payload;
    this.logger.log(
      `User [${requesterId}] changing role for [${targetId}] to ${newRole} in team [${teamId}].`,
    );

    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);

      this._verifyPermission({
        team,
        requesterId,
        targetUserIds: [targetId],
        allowedRoles: [MEMBER_ROLE.OWNER, MEMBER_ROLE.ADMIN],
        action: 'change_role',
      });

      const memberToUpdate = team.members.find((m) => m.id === targetId);
      if (!memberToUpdate) {
        throw new NotFoundException(
          `Member with ID ${targetId} not found in team.`,
        );
      }

      memberToUpdate.role = newRole;
      const updatedTeam = await teamRepo.save(team);

      const requester = team.members.find((m) => m.id === requesterId);

      const requesterName = requester ? requester.name : 'Unknown';
      this.logger.log(
        `Member role changed in team [${teamId}]. Emitting event.`,
      );
      const eventPayload: ChangeRoleMember = {
        teamId,
        teamName: team.name,
        newRole,
        requesterId,
        requesterName,
        targetId,
        targetName: memberToUpdate.name,
      };
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.MEMBER_ROLE_CHANGED, eventPayload);

      return updatedTeam;
    });
  }

  async leaveTeam(payload: LeaveMember) {
    const { teamId, requesterId } = payload;
    this.logger.log(`User [${requesterId}] leaving team [${teamId}].`);

    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);

      const memberLeaving = team.members.find((m) => m.id === requesterId);

      if (!memberLeaving) {
        throw new NotFoundException(`You are not a member of this team.`);
      }

      if (memberLeaving.role === MEMBER_ROLE.OWNER) {
        this.logger.warn(
          `Owner [${requesterId}] attempted to leave team [${teamId}].`,
        );
        throw new ForbiddenException(
          'As the team owner, you cannot leave. Please delete the team or transfer ownership.',
        );
      }

      team.members = team.members.filter((m) => m.id !== requesterId);
      const memberIds = team.members.reduce((ids, member) => {
        if ([MEMBER_ROLE.ADMIN, MEMBER_ROLE.OWNER].includes(member.role)) {
          ids.push(member.id);
        }
        return ids;
      }, [] as string[]);

      const updatedTeam = await teamRepo.save(team);
      const eventPayload: LeaveMember = {
        teamId,
        teamName: team.name,
        requesterId,
        requesterName: memberLeaving.name,
        memberIds,
      };
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.LEAVE_TEAM, eventPayload);
      return updatedTeam;
    });
  }

  async transferOwnership(payload: TransferOwnership): Promise<Team> {
    const { teamId, requesterId, newOwnerId } = payload;
    this.logger.log(
      `Ownership transfer initiated by [${requesterId}] for team [${teamId}] to new owner [${newOwnerId}].`,
    );

    if (requesterId === newOwnerId) {
      throw new BadRequestException('You are already the owner of this team.');
    }

    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);

      if (team.ownerId !== requesterId) {
        this.logger.warn(
          `Permission denied: Non-owner [${requesterId}] attempted to transfer ownership.`,
        );
        throw new ForbiddenException(
          'Only the current team owner can transfer ownership.',
        );
      }

      const oldOwner = team.members.find((m) => m.id === requesterId);
      const newOwner = team.members.find((m) => m.id === newOwnerId);

      if (!newOwner) {
        throw new NotFoundException(
          `User with ID [${newOwnerId}] is not a member of this team.`,
        );
      }

      if (oldOwner) {
        oldOwner.role = MEMBER_ROLE.ADMIN;
      }
      newOwner.role = MEMBER_ROLE.OWNER;
      team.ownerId = newOwnerId;

      const updatedTeam = await teamRepo.save(team);

      this.logger.log(
        `Ownership of team [${teamId}] successfully transferred to [${newOwnerId}]. Emitting event.`,
      );

      const newOwnerName = newOwner ? newOwner.name : 'Unknown';
      const requesterName = oldOwner ? oldOwner.name : 'Unknown';
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.OWNERSHIP_TRANSFERRED, {
        newOwnerId,
        requesterId,
        teamId,
        teamName: team.name,
        newOwnerName,
        requesterName,
      } as TransferOwnershipEventPayload);

      return updatedTeam;
    });
  }

  private async _getTeamForModification(
    teamId: string,
    manager: EntityManager,
  ): Promise<Team> {
    const team = await manager.findOne(Team, {
      where: { id: teamId },
      lock: { mode: 'pessimistic_write' },
    });
    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found.`);
    }
    return team;
  }

  private _verifyPermission(options: {
    team: Team;
    requesterId: string;
    allowedRoles: MEMBER_ROLE[];
    targetUserIds?: string[];
    action: 'add_member' | 'remove_member' | 'change_role' | 'remove_team';
  }): void {
    const { team, requesterId, allowedRoles, targetUserIds, action } = options;
    const requester = team.members.find((m) => m.id === requesterId);

    if (!requester || !allowedRoles.includes(requester.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }

    if (!targetUserIds || targetUserIds.length === 0) {
      return;
    }

    if (action === 'remove_member' || action === 'change_role') {
      if (targetUserIds.includes(team.ownerId)) {
        if (action === 'remove_member') {
          throw new ForbiddenException('The team owner cannot be removed.');
        }
        if (action === 'change_role') {
          throw new ForbiddenException(
            "The team owner's role cannot be changed.",
          );
        }
      }
    }

    for (const targetId of targetUserIds) {
      if (action === 'remove_member') {
        if (requester.role === MEMBER_ROLE.ADMIN) {
          const targetUser = team.members.find((m) => m.id === targetId);
          if (!targetUser) {
            this.logger.warn(
              `Verification check: Target user ${targetId} not found in team ${team.id}.`,
            );
            continue;
          }
          if (targetUser.role === MEMBER_ROLE.ADMIN) {
            throw new ForbiddenException(
              `An admin cannot remove another admin (user: ${targetId}).`,
            );
          }
        }
      }

      if (action === 'change_role') {
        const targetUser = team.members.find((m) => m.id === targetId);
        if (!targetUser) {
          throw new NotFoundException(
            `User with ID ${targetId} is not a member of this team.`,
          );
        }
      }
    }
  }

  async findAll() {
    return await this.teamRepo.find();
  }

  async findById(id: string, userId: string) {
    return await this.teamRepo.createQueryBuilder("team")
      .where("team.id = :id", { id: id })
      .andWhere("team.members @> :memberQuery", {
        memberQuery: JSON.stringify([{ id: userId }]),
      })
      .getOne();
  }

  async findByUserId(userId: string) {
    return await this.teamRepo.find({
      where: { members: { id: userId } },
    });
  }

  async findRoomsByUserId(userId: string) {
    const team = await this.teamRepo.createQueryBuilder("team")
      .where("team.members @> :memberQuery", {
        memberQuery: JSON.stringify([{ id: userId }]),
      })
      .select(["team.id"])
      .getMany();
    return team.map((t) => t.id);
  }

  async sendNotification(userId: string, teamId: string, message: NotificationEventDto) {
    const team = await this.teamRepo.findOne({
      where: { id: teamId, members: { id: userId } },
    })
    if (!team) {
      throw new NotFoundException(`You are not a member of this team.`);
    }
    const members = team.members.map((member) => member.id)
    this.amqp.publish(SOCKET_EXCHANGE, TEAM_PATTERN.SEND_NOTIFICATION, { members, message });
  }
}
