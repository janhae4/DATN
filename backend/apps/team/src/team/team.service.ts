import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, EntityManager, Not, In, FindOptionsWhere } from 'typeorm';
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
  SOCKET_EXCHANGE,
  TEAM_PATTERN,
  NotificationEventDto,
  TeamMember,
  EventUserSnapshot,
  TeamSnapshot,
  LeaveMemberEventPayload,
  REDIS_EXCHANGE,
  REDIS_PATTERN,
  MemberStatus,
  TeamAction,
  NOTIFICATION_EXCHANGE,
  NOTIFICATION_PATTERN,
  NotificationType,
} from '@app/contracts';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RemoveTeamEventPayload } from '@app/contracts/team/dto/remove-team.dto';
import { unwrapRpcResult } from '@app/common';

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

  private async _getUserProfiles(
    userIds: string[],
  ): Promise<Map<string, EventUserSnapshot>> {
    if (!userIds || userIds.length === 0) {
      return new Map();
    }
    try {
      const profiles = await this.amqp.request<EventUserSnapshot[]>({
        exchange: REDIS_EXCHANGE,
        routingKey: REDIS_PATTERN.GET_MANY_USERS_INFO,
        payload: userIds,
        timeout: 2000,
      });
      return new Map(profiles.map((p) => [p.id, p]));
    } catch (error) {
      this.logger.warn(`Failed to fetch user profiles from cache: ${error.message}`);
      return new Map();
    }
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
      where: { teamId },
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

  async create(createTeamDto: CreateTeamDto): Promise<{ id: string, name: string }> {
    const { name, memberIds = [], ownerId } = createTeamDto;
    this.logger.log(`Validating members for new team "${name}"...`);


    const ownerProfile = unwrapRpcResult(await this.amqp.request<User>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_ONE,
      payload: ownerId,
      timeout: 2000,
    }));

    if (!ownerProfile) {
      throw new BadRequestException('Owner not found.');
    }

    const savedTeam = await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const memberRepo = manager.getRepository(TeamMember);

      const newTeam = teamRepo.create({
        name,
        ownerId,
      });
      const saved = await teamRepo.save(newTeam);

      const ownerMember = memberRepo.create({
        team: saved,
        userId: ownerId,
        role: MemberRole.OWNER,
        status: MemberStatus.ACCEPTED,
      });
      await memberRepo.save(ownerMember);
      saved.members = [ownerMember];
      return saved;
    });

    console.log(savedTeam.members.length)

    const teamSnapshot: TeamSnapshot = {
      id: savedTeam.id,
      name: savedTeam.name,
      avatar: savedTeam.avatar,
    };

    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.CREATE_TEAM, {
      teamSnapshot,
      owner: ownerProfile,
      members: [ownerProfile],
    } as CreateTeamEventPayload);

    if (memberIds && memberIds.length > 0) {
      console.log(memberIds);
      const membersToInvite = memberIds.filter(id => id !== ownerId);
      if (membersToInvite.length > 0) {
        this.logger.log(`Inviting ${membersToInvite.length} members to new team...`);
        await this.addMembers({
          teamId: savedTeam.id,
          requesterId: ownerId,
          memberIds: membersToInvite
        });
      }
    }

    this.logger.log(`Team [${savedTeam.id}] created successfully.`);

    return {
      id: savedTeam.id,
      name: savedTeam.name,
    };
  }


  async addMembers(addMemberDto: AddMember): Promise<Team> {
    const { memberIds, requesterId, teamId } = addMemberDto;

    this.logger.log(
      `User [${requesterId}] adding ${memberIds.length} members to team [${teamId}].`,
    );

    const usersFromCache: User[] = unwrapRpcResult(await this.amqp.request<EventUserSnapshot[]>({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
      payload: { userIds: [...memberIds, requesterId] },
      timeout: 2000,
    }));


    const updatedTeam = await this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);
      const team = await this._getTeamForModification(teamId, manager);
      this._verifyPermission({
        team,
        requesterId,
        allowedRoles: [MemberRole.ADMIN, MemberRole.OWNER],
        action: 'add_member',
      });

      const existingMemberships = await memberRepo.find({
        where: {
          teamId: team.id,
          userId: In(usersFromCache.map(u => u.id)),
        },
        withDeleted: true
      });

      const membersToInsert: TeamMember[] = [];
      const membersToRestore: TeamMember[] = [];
      for (const user of usersFromCache) {
        const existing = existingMemberships.find(m => m.userId === user.id);

        if (existing) {
          if (existing.deletedAt) {
            existing.deletedAt = null;
            existing.status = MemberStatus.PENDING;
            existing.role = MemberRole.MEMBER;
            membersToRestore.push(existing);
          } else {
            this.logger.warn(`User ${user.id} is already in team.`);
          }
        } else {
          const newMember = memberRepo.create({
            userId: user.id,
            role: MemberRole.MEMBER,
            status: MemberStatus.PENDING,
            teamId: team.id
          });
          membersToInsert.push(newMember);
        }
      }
      if (membersToInsert.length > 0) await memberRepo.save(membersToInsert);
      if (membersToRestore.length > 0) await memberRepo.save(membersToRestore);
      const validNewMembers = [...membersToInsert, ...membersToRestore];
      if (validNewMembers.length === 0) return team;
      team.members.push(...validNewMembers);
      return team;
    });

    const newMemberIds = usersFromCache.map(u => u.id);
    const memberIdsToNotify = [
      ...updatedTeam.members.map(m => m.userId),
      ...newMemberIds
    ].filter(id => id !== requesterId);

    const uniqueNotifyIds = [...new Set(memberIdsToNotify)];

    this.logger.log(`Members added to team [${teamId}]. Emitting event.`);

    const eventPayload: AddMemberEventPayload = {
      members: usersFromCache,
      requesterId,
      requesterName: usersFromCache.find(u => u.id === requesterId)!.name,
      teamId,
      teamName: updatedTeam.name,
      memberIdsToNotify: uniqueNotifyIds,
      metadata: {
        teamId,
        action: TeamAction.MEMBER_INVITED
      }
    };

    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.ADD_MEMBER, eventPayload);

    return updatedTeam;
  }

  async acceptInvitation(userId: string, teamId: string, notificationId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);
      const member = await memberRepo.findOne({ where: { teamId, userId } })
      if (!member) throw new NotFoundException(`You are not invited to this team.`)
      member.status = MemberStatus.ACCEPTED;
      this.amqp.publish(NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN.UPDATE, { notificationId, data: { type: NotificationType.SUCCESS } });
      await memberRepo.save(member);
      return { "success": true }
    })
  }

  async declineInvitation(userId: string, teamId: string, notificationId: string) {
    return await this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);
      const member = await memberRepo.findOne({ where: { teamId, userId } })
      if (!member) throw new NotFoundException(`You are not invited to this team.`)
      member.status = MemberStatus.DECLINED;
      this.amqp.publish(NOTIFICATION_EXCHANGE, NOTIFICATION_PATTERN.UPDATE, { notificationId, data: { type: NotificationType.FAILED } });
      await memberRepo.save(member);
      return { "success": true }
    })
  }

  async removeMember(payload: RemoveMember & { teamId: string; requesterId: string }): Promise<Team> {
    const { memberIds, teamId, requesterId } = payload;
    this.logger.log(`Removing ${memberIds.length} members from team [${teamId}] by [${requesterId}]...`);

    const updatedTeam = await this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);
      const team = await this._getTeamForModification(teamId, manager);

      this._verifyPermission({
        team,
        requesterId,
        targetUserIds: memberIds,
        allowedRoles: [MemberRole.ADMIN, MemberRole.OWNER],
        action: 'remove_member',
      });


      const membersToRemove = team.members.filter((m) =>
        memberIds.includes(m.userId),
      );

      if (membersToRemove.length === 0) throw new NotFoundException(`None of the provided member IDs were found in the team.`);
      await memberRepo.softRemove(membersToRemove);
      team.members = team.members.filter((m) => !memberIds.includes(m.userId));
      return team;
    });

    this.logger.log(`Members removed from team [${teamId}]. Emitting event.`);

    const userIds = updatedTeam.members.map(m => m.userId);
    const members: User[] = unwrapRpcResult(
      await this.amqp.request({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
        payload: { userIds },
        timeout: 1000,
      })
    )

    const eventPayload: RemoveMemberEventPayload = {
      teamId,
      teamName: updatedTeam.name,
      requesterId,
      requesterName: members.find(m => m.id === requesterId)!.name,
      members,
      memberIdsToNotify: members.filter(m => m.id !== requesterId).map(m => m.id),
      metadata: {
        teamId,
        action: 'MEMBER_REMOVED',
      }
    };

    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.REMOVE_MEMBER, eventPayload);

    return updatedTeam;
  }

  async removeTeam(userId: string, teamId: string) {
    let requesterName = 'Unknown';
    try {
      const requesterProfile = await this.amqp.request<EventUserSnapshot>({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
        payload: { userId: [userId] },
        timeout: 1000,
      });
      if (requesterProfile) {
        requesterName = requesterProfile.name;
      }
    } catch (e) {
      this.logger.warn(`Could not fetch requester name for event: ${e.message}`);
    }

    let removedTeam: Team;
    let teamName: string;
    let memberIdsToNotify: string[];

    await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const team = await this._getTeamForModification(teamId, manager);
      this._verifyPermission({
        team,
        requesterId: userId,
        allowedRoles: [MemberRole.OWNER],
        action: 'remove_team',
      });

      teamName = team.name;
      memberIdsToNotify = team.members.map((m) => m.userId);

      removedTeam = await teamRepo.remove(team);
    });

    this.amqp.publish(
      EVENTS_EXCHANGE,
      EVENTS.REMOVE_TEAM,
      {
        requesterId: userId,
        requesterName,
        teamId,
        teamName: teamName!,
        memberIdsToNotify: memberIdsToNotify!,
      } as RemoveTeamEventPayload,
    );

    return removedTeam!;
  }

  async changeMemberRole(payload: ChangeRoleMember): Promise<Team> {
    const { teamId, targetId, requesterId, newRole } = payload;
    this.logger.log(
      `User [${requesterId}] changing role for [${targetId}] to ${newRole} in team [${teamId}].`,
    );

    let requesterName = 'Unknown';
    let targetName = 'Unknown';
    try {
      const profileMap = await this._getUserProfiles([requesterId, targetId]);
      requesterName = profileMap.get(requesterId)?.name || 'Unknown';
      targetName = profileMap.get(targetId)?.name || 'Unknown';
    } catch (e) {
      this.logger.warn(`Could not fetch names for event: ${e.message}`);
    }

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

      if (
        requesterId === targetId &&
        requester.role === MemberRole.OWNER &&
        newRole !== MemberRole.OWNER
      ) {
        throw new ForbiddenException('Owner cannot demote themselves.');
      }
      if (
        memberToUpdate.role === MemberRole.OWNER &&
        requester.role !== MemberRole.OWNER
      ) {
        throw new ForbiddenException(
          "Only the Owner can change another Owner's role.",
        );
      }

      memberToUpdate.role = newRole;
      await memberRepo.save(memberToUpdate);

      eventPayload = {
        teamId,
        teamName: team.name,
        newRole,
        requesterId,
        requesterName,
        targetId,
        targetName,
      };

      finalTeamState = team;
    });

    try {
      this.amqp.publish(
        EVENTS_EXCHANGE,
        EVENTS.MEMBER_ROLE_CHANGED,
        eventPayload!,
      );
    } catch (err) {
      this.logger.error(
        `Failed to publish MEMBER_ROLE_CHANGED event for team ${teamId}`,
        err,
      );
    }

    return finalTeamState!;
  }

  async leaveTeam(payload: LeaveMember): Promise<Team> {
    const { teamId, requesterId } = payload;
    this.logger.log(`User [${requesterId}] leaving team [${teamId}].`);

    let requesterSnapshot: EventUserSnapshot;
    try {
      const profile = await this.amqp.request<EventUserSnapshot>({
        exchange: USER_EXCHANGE,
        routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
        payload: { userIds: [requesterId] },
        timeout: 1000,
      });
      requesterSnapshot = profile || { id: requesterId, name: 'Unknown' };
    } catch (e) {
      this.logger.warn(`Could not fetch requester snapshot for event: ${e.message}`);
      requesterSnapshot = { id: requesterId, name: 'Unknown' };
    }

    let finalTeamState: Team;
    let eventPayload: LeaveMemberEventPayload;

    await this.dataSource.transaction(async (manager) => {
      const memberRepo = manager.getRepository(TeamMember);
      const team = await this._getTeamForModification(teamId, manager);

      const memberLeaving = team.members.find((m) => m.userId === requesterId);

      if (!memberLeaving) {
        throw new NotFoundException(`You are not a member of this team.`);
      }

      if (memberLeaving.role === MemberRole.OWNER) {
        throw new ForbiddenException(
          'As the team owner, you cannot leave. Please delete the team or transfer ownership.',
        );
      }

      await memberRepo.remove(memberLeaving);

      team.members = team.members.filter((m) => m.userId !== requesterId);

      const memberIdsToNotify = team.members.map((m) => m.userId);

      eventPayload = {
        teamId,
        teamName: team.name,
        memberIdsToNotify,
        requester: requesterSnapshot,
      };

      finalTeamState = team;
    });

    this.amqp.publish(EVENTS_EXCHANGE, EVENTS.LEAVE_TEAM, eventPayload!);
    return finalTeamState!;
  }

  async transferOwnership(payload: TransferOwnership): Promise<Team> {
    const { teamId, requesterId, newOwnerId } = payload;
    this.logger.log(
      `Ownership transfer initiated by [${requesterId}] for team [${teamId}] to new owner [${newOwnerId}].`,
    );

    if (requesterId === newOwnerId) {
      throw new BadRequestException('You are already the owner of this team.');
    }

    let requesterName = 'Unknown';
    let newOwnerName = 'Unknown';
    try {
      const profileMap = await this._getUserProfiles([requesterId, newOwnerId]);
      requesterName = profileMap.get(requesterId)?.name || 'Unknown';
      newOwnerName = profileMap.get(newOwnerId)?.name || 'Unknown';
    } catch (e) {
      this.logger.warn(`Could not fetch names for event: ${e.message}`);
    }

    let updatedTeam: Team;
    let eventPayload: TransferOwnershipEventPayload;

    await this.dataSource.transaction(async (manager) => {
      const teamRepo = manager.getRepository(Team);
      const memberRepo = manager.getRepository(TeamMember);
      const team = await this._getTeamForModification(teamId, manager);

      if (team.ownerId !== requesterId) {
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
        await memberRepo.save(oldOwner);
      }
      newOwner.role = MemberRole.OWNER;
      await memberRepo.save(newOwner);

      team.ownerId = newOwnerId;
      updatedTeam = await teamRepo.save(team);

      eventPayload = {
        newOwnerId,
        requesterId,
        teamId,
        teamName: team.name,
        newOwnerName,
        requesterName,
      } as TransferOwnershipEventPayload;
    });

    this.logger.log(
      `Ownership of team [${teamId}] successfully transferred to [${newOwnerId}]. Emitting event.`,
    );
    this.amqp.publish(
      EVENTS_EXCHANGE,
      EVENTS.OWNERSHIP_TRANSFERRED,
      eventPayload!,
    );

    return updatedTeam!;
  }

  async getTeamMembers(requesterId: string, teamId: string) {
    const requester = await this.memberRepo.findOne({
      where: { userId: requesterId, teamId }
    });

    if (!requester) {
      throw new ForbiddenException("You are not a member of this team.");
    }

    if (requester.status !== MemberStatus.ACCEPTED) {
      throw new ForbiddenException("You are not a member of this team.");
    }

    const whereCondition: FindOptionsWhere<TeamMember> = {
      teamId: teamId,
    };

    const isManager = [MemberRole.ADMIN, MemberRole.OWNER].includes(requester.role);

    if (!isManager) {
      whereCondition.status = MemberStatus.ACCEPTED;
    }

    const members = await this.memberRepo.find({
      where: whereCondition,
      order: {
        role: 'ASC',
        joinedAt: 'ASC'
      }
    });
    console.log("Members length", members.length);
    const userIds = members.map(m => m.userId);
    console.log("UserIds", userIds.length);
    const users: User[] = unwrapRpcResult(await this.amqp.request({
      exchange: USER_EXCHANGE,
      routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
      payload: { userIds }
    }));

    const result = users.map((u) => {
      const member = members.find(m => m.userId === u.id);
      return {
        ...member,
        id: u.id,
        name: u.name,
        email: u.email,
        avatar: u.avatar,
      } as TeamMember | Partial<User>
    });
    return result;
  }

  async getMembersWithProfiles(teamId: string) {
    this.logger.log(`Getting members and profiles for team ${teamId}`);

    let membersFromDb: TeamMember[];
    try {
      membersFromDb = await this.memberRepo.find({
        where: { team: { id: teamId } },
        select: ['id', 'userId', 'role', 'joinedAt'],
      });
    } catch (dbError) {
      this.logger.error(`Failed to fetch members from DB for ${teamId}`, dbError);
      throw new BadRequestException('Could not retrieve team members.');
    }

    if (membersFromDb.length === 0) {
      return [];
    }

    const memberIds = membersFromDb.map((m) => m.userId);

    // 1. Thử lấy từ Cache trước
    let usersFromCache: EventUserSnapshot[] = [];
    try {
      usersFromCache = await this.amqp.request<EventUserSnapshot[]>({
        exchange: REDIS_EXCHANGE,
        routingKey: REDIS_PATTERN.GET_MANY_USERS_INFO,
        payload: memberIds,
        timeout: 2000,
      });
    } catch (cacheError) {
      this.logger.warn(
        `Failed to get profiles from cache for ${teamId}.`,
        cacheError,
      );
    }

    // 2. Tìm những ID bị thiếu trong Cache
    const foundInCacheIds = new Set(usersFromCache.map((u) => u.id));
    const missingIds = memberIds.filter((id) => !foundInCacheIds.has(id));

    let usersFromDb: User[] = [];

    // 3. Nếu thiếu, gọi sang User Service để lấy
    if (missingIds.length > 0) {
      this.logger.log(`Cache miss for ${missingIds.length} users. Fetching from User Service...`);
      try {
        const result = await this.amqp.request<User[]>({
          exchange: USER_EXCHANGE,
          routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
          payload: { userIds: missingIds },
        });
        usersFromDb = Array.isArray(result) ? result : (result ? [result] : []);

        // 4. Cập nhật lại vào Cache để lần sau nhanh hơn
        if (usersFromDb.length > 0) {
          this.amqp.publish(REDIS_EXCHANGE, REDIS_PATTERN.SET_MANY_USERS_INFO, {
            users: usersFromDb,
          });
        }
      } catch (rpcError) {
        this.logger.error(`Failed to fetch users from User Service`, rpcError);
      }
    }

    // 5. Gộp danh sách từ Cache và DB
    const allFoundUsers: EventUserSnapshot[] = [
      ...usersFromCache,
      ...usersFromDb.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        email: u.email,
      })),
    ];

    // Tạo Map để lookup nhanh
    const profileMap = new Map(allFoundUsers.map((p) => [p.id, p]));

    const combinedMembers = membersFromDb.map((member) => {
      const profile = profileMap.get(member.userId);

      return {
        id: member.userId,
        name: profile?.name || 'Unknown',
        avatar: profile?.avatar || '',
        bio: '',
        role: member.role,
        email: profile?.email || '',
        skills: [],
        joinedAt: member.joinedAt,
        isActive: false,
        teamId: teamId,
      };
    });

    return combinedMembers;
  }

  async findAll() {
    return await this.teamRepo.find();
  }

  async findById(id: string, userId: string) {
    const team = await this.teamRepo.findOne({
      where: { id }
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const isMember = await this.dataSource.getRepository(TeamMember).count({
      where: {
        teamId: id,
        userId: userId,
        status: MemberStatus.ACCEPTED,
        isActive: true
      }
    });

    if (!isMember) {
      throw new ForbiddenException('You do not have permission to view this team');
    }

    return team;
  }

  async findParticipants(id: string) {
    return await this.memberRepo.findBy({ team: { id } });
  }

  async findByUserId(userId: string) {
    console.log('Finding teams for user in service:', userId);
    return await this.teamRepo.find({
      where: {
        members: { userId, status: MemberStatus.ACCEPTED },
      }
    });
  }

  async findRoomsByUserId(userId: string) {
    const teams = await this.teamRepo.createQueryBuilder("team")
      .innerJoin("team.members", "member")
      .where("member.userId = :userId", { userId })
      .select(["team.id"])
      .getMany();

    return teams.map((t) => t.id);
  }

  async findParticipantRoles(userId: string, teamId: string) {
    return unwrapRpcResult(await this.amqp.request<{ teamId: string; role: MemberRole }[]>({
      exchange: REDIS_EXCHANGE,
      routingKey: REDIS_PATTERN.GET_USER_ROLE,
      payload: { userId, teamId },
      timeout: 2000,
    }))
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
    console.log("UserId", userId, "TeamId", teamId, "Roles", roles);
    const team = await this.teamRepo.findOne({
      where: { id: teamId, members: { userId, status: MemberStatus.ACCEPTED } },
      relations: ['members'],
    })
    console.log(team)
    if (!team) {
      throw new ForbiddenException(`You are not a member of this team.`);
    }
    const requester = team.members.find((m) => m.userId === userId);
    console.log('Role', requester?.role)
    if (!requester || !roles.includes(requester.role)) {
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    }
  }
}
