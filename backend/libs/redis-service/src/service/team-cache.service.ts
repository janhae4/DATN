import { Injectable, Logger } from '@nestjs/common';
import { AddMemberEventPayload, ChangeRoleMember, CreateTeamEventPayload, ForbiddenException, LeaveMemberEventPayload, MemberDto, MemberRole, MemberStatus, RemoveMemberEventPayload, RemoveTeamEventPayload, TEAM_EXCHANGE, TEAM_PATTERN, TransferOwnershipEventPayload } from '@app/contracts';
import { RedisService } from '../redis-service.service';
import { RmqClientService } from '@app/common';
export interface CachedMemberState {
    role: MemberRole;
    status: MemberStatus;
    isActive: boolean;
    joinedAt: Date;
}
const TTL_24_HOURS = 86400;

@Injectable()
export class TeamCacheService {
    private readonly logger = new Logger(TeamCacheService.name);

    constructor(
        private readonly redisService: RedisService,
        private readonly amqp: RmqClientService
    ) { }

    private getTeamRolesKey(teamId: string) {
        return `team:roles:${teamId}`;
    }

    private getTeamMembersKey(teamId: string) {
        return `team:members:${teamId}`;
    }

    async createTeam(payload: CreateTeamEventPayload) {
        const { members, teamSnapshot, owner } = payload;
        const teamId = teamSnapshot.id;

        const teamRolesKey = this.getTeamRolesKey(teamId);
        const pipe = this.redisService.getClient().pipeline();

        const roleMap: Record<string, string> = {
            [owner.id]: MemberRole.OWNER,
        };

        const allUsers = [owner, ...members];
        for (const member of allUsers) {
            if (member.id !== owner.id) {
                roleMap[member.id] = MemberRole.MEMBER;
            }
        }

        pipe.hset(teamRolesKey, roleMap);
        pipe.expire(teamRolesKey, TTL_24_HOURS);

        try {
            await pipe.exec();
            this.logger.log(`Cached team ${teamId} roles successfully.`);
        } catch (error) {
            this.logger.error(`Failed to cache team ${teamId}`, error);
        }
    }

    async addMember(teamId: string, userId: string) {
        if (!teamId || !userId) return;

        const teamRolesKey = this.getTeamRolesKey(teamId);
        await this.redisService.getClient().hset(teamRolesKey, userId, MemberRole.MEMBER);
        this.logger.log(`Added 1 members to team cache: ${teamId}`);
    }

    async removeMember(teamId: string, memberIds: string[]) {
        if (!teamId || !memberIds) return;
        const teamRolesKey = this.getTeamRolesKey(teamId);
        await this.redisService.getClient().hdel(teamRolesKey, ...memberIds);
        this.logger.log(`Removed ${memberIds.length} members from team cache: ${teamId}`);
    }

    async changeRoleTeam(teamId: string, userId: string, newRole: MemberRole) {
        if (!teamId || !userId || !newRole) return;

        const teamRolesKey = this.getTeamRolesKey(teamId);
        const pipe = this.redisService.getClient().pipeline();
        pipe.hset(teamRolesKey, userId, newRole);
        pipe.expire(teamRolesKey, TTL_24_HOURS);

        await pipe.exec();
        this.logger.log(`Changed role for ${userId} in team ${teamId} to ${newRole}`);
    }

    async leaveTeam(teamId: string, userId: string) {
        if (!teamId || !userId) return;
        const teamRolesKey = this.getTeamRolesKey(teamId);
        await this.redisService.getClient().hdel(teamRolesKey, userId);
    }

    async removeTeam(teamId: string) {
        if (!teamId) return;
        const teamRolesKey = this.getTeamRolesKey(teamId);
        await this.redisService.getClient().del(teamRolesKey);
        this.logger.log(`Removed team cache ${teamId}`);
    }

    async ownershipTransferred(teamId: string, newOwnerId: string, requesterId: string) {
        if (!teamId) return;

        const teamRolesKey = this.getTeamRolesKey(teamId);

        const pipe = this.redisService.getClient().pipeline();

        pipe.hset(teamRolesKey, requesterId, MemberRole.MEMBER);
        pipe.hset(teamRolesKey, newOwnerId, MemberRole.OWNER);

        pipe.expire(teamRolesKey, TTL_24_HOURS);

        await pipe.exec();
        this.logger.log(`Transferred ownership of team ${teamId} to ${newOwnerId}`);
    }


    async setTeamMember(teamId: string, userId: string, member: CachedMemberState) {
        const key = this.getTeamMembersKey(teamId);
        const data: CachedMemberState = {
            role: member.role,
            status: member.status,
            isActive: member.isActive,
            joinedAt: member.joinedAt
        };
        await this.redisService.getClient().hset(key, userId, JSON.stringify(data));
        await this.redisService.getClient().expire(key, 86400);
    }

    async setManyTeamMembers(teamId: string, membersMap: Record<string, CachedMemberState>) {
        const key = this.getTeamMembersKey(teamId);
        const pipe = this.redisService.getClient().pipeline();

        Object.keys(membersMap).forEach(userId => {
            pipe.hset(key, userId, JSON.stringify(membersMap[userId]));
        });

        pipe.expire(key, 86400);
        await pipe.exec();
    }

    async getTeamMember(teamId: string, userId: string, fetcherRPC?: () => Promise<CachedMemberState | null>) {
        const key = this.getTeamMembersKey(teamId);
        const rawData = await this.redisService.getClient().hget(key, userId);

        if (rawData) return JSON.parse(rawData);
        const fetcher = fetcherRPC || (() => this.amqp.request({
            exchange: TEAM_EXCHANGE,
            routingKey: TEAM_PATTERN.FIND_PARTICIPANT,
            payload: { teamId, userId },
        }));

        const freshData = await fetcher();
        if (freshData) {
            await this.setTeamMember(teamId, userId, freshData);
        }
        return freshData || null;
    }

    async getAllTeamRoles(teamId: string): Promise<Record<string, CachedMemberState>> {
        const key = this.getTeamMembersKey(teamId);
        const all = await this.redisService.getClient().hgetall(key);

        const result: Record<string, CachedMemberState> = {};
        Object.keys(all).forEach((userId) => {
            result[userId] = JSON.parse(all[userId]);
        });
        return result;
    }

    async checkPermission(
        teamId: string,
        userId: string,
        allowedRoles: MemberRole[] = [MemberRole.MEMBER, MemberRole.OWNER, MemberRole.ADMIN],
    ): Promise<void> {
        const memberState = await this.getTeamMember(teamId, userId);
        console.log(memberState);
        if (!memberState || memberState.status !== MemberStatus.ACCEPTED) {
            throw new ForbiddenException('You are not a member of this team.');
        }

        if (!allowedRoles.includes(memberState.role as MemberRole)) {
            throw new ForbiddenException('You do not have permission to view this team.');
        }
    }
}