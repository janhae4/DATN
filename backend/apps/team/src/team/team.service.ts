import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager } from 'typeorm';
import {
  Team,
  MemberRole,
  USER_PATTERNS,
  EVENTS,
  User,
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
  TeamMember,
  EventUserSnapshot,
  TeamSnapshot,
  LeaveMemberEventPayload,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RemoveTeamEventPayload } from '@app/contracts/team/dto/remove-team.dto';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(Team)
    private teamRepo: Repository<Team>,
    @InjectRepository(TeamMember)
    private memberRepo: Repository<TeamMember>,
    private readonly amqp: AmqpConnection,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) { }

  async create(createTeamDto: CreateTeamDto): Promise<{ id: string, name: string }> {
    const { name, memberIds = [], ownerId } = createTeamDto;
    this.logger.log(`Validating members for new team "${name}"...`);

    const allUserIdsToValidate = Array.from(new Set([...memberIds, ownerId]));

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

    this.logger.log(`Creating a new team named "${name}"...`);

    return await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const memberRepo = manager.getRepository(TeamMember);

      const newTeam = teamRepo.create({
        name,
        ownerId,
      });
      const savedTeam = await teamRepo.save(newTeam);

      const { cachedUsers, savedMembers } = await this._addMembersToDb(
        memberRepo,
        savedTeam,
        allUserIdsToValidate,
        userMap,
        ownerId
      );

      const teamSnapshot: TeamSnapshot = {
        id: savedTeam.id,
        name: savedTeam.name,
        avatar: savedTeam.avatar,
      }

      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.CREATE_TEAM, {
        teamSnapshot,
        owner: cachedUsers.find((u) => u.id === ownerId)!,
        members: cachedUsers.filter((u) => u.id !== ownerId),
      } as CreateTeamEventPayload);

      savedTeam.members = savedMembers;
      return {
        id: savedTeam.id,
        name: savedTeam.name,
      };
    });
  }

  async addMembers(addMemberDto: AddMember): Promise<Team> {
    const { memberIds, requesterId, teamId } = addMemberDto;

    this.logger.log(
      `User [${requesterId}] adding ${memberIds.length} members to team [${teamId}].`,
    );

    return this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);

      const team = await this._getTeamForModification(teamId, manager);
      this._verifyPermission({
        team,
        requesterId,
        allowedRoles: [MemberRole.ADMIN, MemberRole.OWNER],
        action: 'add_member',
      });

      console.log(team.members)

      const existingMemberIds = new Set(team.members.map((m) => m.userId));
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
        const missingIds = newMemberIds.filter((id) => !foundIds.has(id));
        throw new BadRequestException(
          `The following user IDs do not exist: ${missingIds.join(', ')}`,
        );
      }

      const userMap = new Map(usersFromDb.map((u) => [u.id, u]));
      const { cachedUsers, savedMembers } = await this._addMembersToDb(
        memberRepo,
        team,
        newMemberIds,
        userMap,
      );

      const memberIdsToNotify = savedMembers
        .filter((m) => m.userId !== requesterId)
        .map((m) => m.userId);

      const requester = team.members.find((m) => m.userId === requesterId);
      const requesterName = requester ? requester.cachedUser?.name : '';

      this.logger.log(`Members added to team [${teamId}]. Emitting event.`);
      const eventPayload: AddMemberEventPayload = {
        members: cachedUsers,
        requesterId,
        requesterName,
        teamId,
        memberIdsToNotify,
        teamName: team.name,
      };
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.ADD_MEMBER, eventPayload);
      team.members.push(...savedMembers);
      return team;
    });
  }

  async _addMembersToDb(
    memberRepo: Repository<TeamMember>,
    team: Team,
    newMemberIds: string[],
    userMap: Map<string, User>,
    ownerId?: string
  ): Promise<{ cachedUsers: EventUserSnapshot[]; savedMembers: TeamMember[] }> {
    const cachedUsers: EventUserSnapshot[] = []
    const membersToCreate = newMemberIds.map((id) => {
      const user = userMap.get(id)!;

      const cachedData = {
        name: user.name,
        avatar: user.avatar,
      };

      cachedUsers.push({ ...cachedData, id })

      return memberRepo.create({
        team,
        userId: id,
        role: id === ownerId ? MemberRole.OWNER : MemberRole.MEMBER,
        cachedUser: { ...cachedData, email: user.email },
      });
    });

    const savedMembers = await memberRepo.save(membersToCreate);
    return { cachedUsers, savedMembers }
  }

  async removeMember(payload: RemoveMember): Promise<Team> {
    const { memberIds, teamId, requesterId } = payload;
    let eventPayload: RemoveMemberEventPayload;

    return this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const memberRepo = manager.getRepository(TeamMember);

      const team = await this._getTeamForModification(teamId, manager);

      this._verifyPermission({
        team,
        requesterId,
        targetUserIds: memberIds,
        allowedRoles: [MemberRole.ADMIN, MemberRole.OWNER],
        action: 'remove_member',
      });

      const membersToRemove = team.members.filter((m) => memberIds.includes(m.id));

      if (membersToRemove.length === 0) {
        throw new NotFoundException(
          `None of the provided member IDs were found in the team.`,
        );
      }

      const removedMembersSnapshot: EventUserSnapshot[] = membersToRemove.map((m) => ({
        id: m.userId,
        name: m.cachedUser?.name || 'Unknown',
        avatar: m.cachedUser?.avatar,
      }));

      await memberRepo.remove(membersToRemove);

      team.members = team.members.filter((m) => !memberIds.includes(m.id));

      const requester = team.members.find((m) => m.userId === requesterId);
      const requesterName = requester ? requester.cachedUser?.name : 'Unknown';

      const memberIdsToNotify = team.members
        .filter((m) => m.userId !== requesterId)
        .map((m) => m.userId);

      this.logger.log(`Member removed from team [${teamId}]. Emitting event.`);
      const eventPayload: RemoveMemberEventPayload = {
        teamId,
        teamName: team.name,
        requesterId,
        requesterName,
        members: removedMembersSnapshot,
        memberIdsToNotify
      };
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.REMOVE_MEMBER, eventPayload);

      return team;
    });
  }

  async removeTeam(userId: string, teamId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);
      this._verifyPermission({
        team,
        requesterId: userId,
        allowedRoles: [MemberRole.OWNER],
        action: 'remove_team',
      })
      const removedTeam = await teamRepo.remove(team)

      const requester = team.members.find((m) => m.userId === userId);
      const requesterName = requester ? requester.cachedUser?.name : 'Unknown';

      this.amqp.publish(
        EVENTS_EXCHANGE,
        EVENTS.REMOVE_TEAM,
        {
          requesterId: userId,
          requesterName,
          teamId,
          teamName: team.name,
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

    let eventPayload: ChangeRoleMember;
    let finalTeamState: Team;

    await this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);
      const team = await this._getTeamForModification(teamId, manager);

      this._verifyPermission({
        team,
        requesterId,
        targetUserIds: [targetId],
        allowedRoles: [MemberRole.OWNER, MemberRole.ADMIN],
        action: 'change_role',
      });

      const memberToUpdate = team.members.find((m) => m.userId === targetId);
      const requester = team.members.find((m) => m.userId === requesterId);

      if (!memberToUpdate || !requester) {
        throw new NotFoundException(
          `Member ${targetId} or requester ${requesterId} not found in team.`,
        );
      }

      if (requesterId === targetId && requester.role === MemberRole.OWNER && newRole !== MemberRole.OWNER) {
        throw new ForbiddenException('Owner cannot demote themselves.');
      }
      if (memberToUpdate.role === MemberRole.OWNER && requester.role !== MemberRole.OWNER) {
        throw new ForbiddenException('Only the Owner can change another Owner\'s role.');
      }

      memberToUpdate.role = newRole;
      await memberRepo.save(memberToUpdate);

      const requesterName = requester.cachedUser?.name || 'Unknown';
      eventPayload = {
        teamId,
        teamName: team.name,
        newRole,
        requesterId,
        requesterName,
        targetId,
        targetName: memberToUpdate.cachedUser?.name,
      };

      finalTeamState = team;
    });

    try {
      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.MEMBER_ROLE_CHANGED, eventPayload!);
    } catch (err) {
      this.logger.error(`Failed to publish MEMBER_ROLE_CHANGED event for team ${teamId}`, err);
    }

    return finalTeamState!;
  }

  async leaveTeam(payload: LeaveMember) {
    const { teamId, requesterId } = payload;
    this.logger.log(`User [${requesterId}] leaving team [${teamId}].`);

    return this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);
      const team = await this._getTeamForModification(teamId, manager);

      const memberLeaving = team.members.find((m) => m.userId === requesterId);

      if (!memberLeaving) {
        throw new NotFoundException(`You are not a member of this team.`);
      }

      if (memberLeaving.role === MemberRole.OWNER) {
        this.logger.warn(
          `Owner [${requesterId}] attempted to leave team [${teamId}].`,
        );
        throw new ForbiddenException(
          'As the team owner, you cannot leave. Please delete the team or transfer ownership.',
        );
      }

      await memberRepo.remove(memberLeaving);

      const memberIdsToNotify = team.members
        .filter((m) => m.userId !== requesterId)
        .map((m) => m.userId);

      const requester = team.members.find((m) => m.userId === requesterId);
      const requesterSnapshot: EventUserSnapshot = {
        id: requester?.id || '',
        name: requester?.cachedUser?.name || '',
        avatar: requester?.cachedUser?.avatar
      }

      team.members = team.members.filter((m) => m.userId !== requesterId);

      const eventPayload: LeaveMemberEventPayload = {
        teamId,
        teamName: team.name,
        memberIdsToNotify,
        requester: requesterSnapshot
      }

      this.amqp.publish(EVENTS_EXCHANGE, EVENTS.LEAVE_TEAM, eventPayload);
      return team;
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

      const oldOwner = team.members.find((m) => m.userId === requesterId);
      const newOwner = team.members.find((m) => m.userId === newOwnerId);

      if (!newOwner) {
        throw new NotFoundException(
          `User with ID [${newOwnerId}] is not a member of this team.`,
        );
      }

      if (oldOwner) {
        oldOwner.role = MemberRole.ADMIN;
      }
      newOwner.role = MemberRole.OWNER;
      team.ownerId = newOwnerId;

      const updatedTeam = await teamRepo.save(team);

      this.logger.log(
        `Ownership of team [${teamId}] successfully transferred to [${newOwnerId}]. Emitting event.`,
      );

      const newOwnerName = newOwner ? newOwner.cachedUser?.name : 'Unknown';
      const requesterName = oldOwner ? oldOwner.cachedUser?.name : 'Unknown';
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

    const members = await manager.find(TeamMember, {
      where: { team: { id: teamId } }
    });

    team.members = members;

    return team;
  }

  private _verifyPermission(options: {
    team: Team;
    requesterId: string;
    allowedRoles: MemberRole[];
    targetUserIds?: string[];
    action: 'add_member' | 'remove_member' | 'change_role' | 'remove_team';
  }): void {
    const { team, requesterId, allowedRoles, targetUserIds, action } = options;
    const requester = team.members.find((m) => m.userId === requesterId);

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
        if (requester.role === MemberRole.ADMIN) {
          const targetUser = team.members.find((m) => m.userId === targetId);
          if (!targetUser) {
            this.logger.warn(
              `Verification check: Target user ${targetId} not found in team ${team.id}.`,
            );
            continue;
          }
          if (targetUser.role === MemberRole.ADMIN) {
            throw new ForbiddenException(
              `An admin cannot remove another admin (user: ${targetId}).`,
            );
          }
        }
      }

      if (action === 'change_role') {
        console.log(team.members)
        const targetUser = team.members.find((m) => m.userId === targetId);
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
    const team = await this.teamRepo.createQueryBuilder("team")
      .leftJoinAndSelect("team.members", "member")
      .where("team.id = :id", { id: id })
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select("1")
          .from(TeamMember, "m")
          .where("m.teamId = :id", { id })
          .andWhere("m.userId = :userId", { userId })
          .getQuery();
        return `EXISTS (${subQuery})`;
      })
      .getOne();
    console.log(team)
    return team;
  }
  async findParticipants(id: string) {
    return await this.memberRepo.findBy({ team: { id } });
  }

  async findByUserId(userId: string) {
    return await this.teamRepo.createQueryBuilder("team")
      .innerJoin("team.members", "member")
      .where("member.userId = :userId", { userId })
      .getMany();
  }

  async findRoomsByUserId(userId: string) {
    const teams = await this.teamRepo.createQueryBuilder("team")
      .innerJoin("team.members", "member")
      .where("member.userId = :userId", { userId })
      .select(["team.id"])
      .getMany();

    return teams.map((t) => t.id);
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

  async verifyPermission(userId: string, teamId: string, roles: MemberRole[]) {
    const team = await this.findById(teamId, userId);
    if (!team) {
      throw new NotFoundException(`You are not a member of this team.`);
    }
    const requester = team.members.find((m) => m.userId === userId);
    if (!requester || !roles.includes(requester.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }
  }

  async handleUserUpdated(user: User) {
    this.logger.log(`Syncing profile for user ${user.id} (name: ${user.name})...`);

    const newCachedData = {
      name: user.name,
      avatar: user.avatar,
    };

    return await this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);

      const updateResult = await memberRepo.update(
        { userId: user.id },
        { cachedUser: newCachedData }
      );

      this.logger.log(
        `Synced user ${user.id}. Affected ${updateResult.affected} team member records.`,
      );
      return updateResult;
    })
  }
}
