import { Controller } from '@nestjs/common';
import { EVENTS, EVENTS_EXCHANGE, DISCUSSION_EXCHANGE, DISCUSSION_PATTERN } from '@app/contracts';
import type { CreateTeamEventPayload, RemoveTeamEventPayload, AddMemberEventPayload, User, MemberRole } from '@app/contracts';
import { ServerService } from '../services/server.service';
import { MessageService } from '../services/message.service';
import { customErrorHandler } from '@app/common';
import { RabbitSubscribe, RabbitRPC } from '@golevelup/nestjs-rabbitmq';

@Controller()
export class ServerController {
    constructor(
        private readonly serverService: ServerService,
        private readonly messageService: MessageService
    ) { }

    /**
     * Subscriber for the CREATE_TEAM event.
     * Initializes the discussion structure (channels, categories) for a newly created team.
     * @param payload Contains the team snapshot, owner, and initial members.
     */
    @RabbitSubscribe({
        exchange: EVENTS_EXCHANGE,
        routingKey: EVENTS.CREATE_TEAM,
        queue: "events.create.team.chat",
        errorHandler: customErrorHandler,
    })
    async handleCreateTeam(payload: CreateTeamEventPayload) {
        return await this.serverService.initServer(payload);
    }

    /**
     * Subscriber for the REMOVE_TEAM event.
     * Handles the soft-deletion of all discussions/channels associated with a team.
     * @param payload Contains details about the team being removed and the requester.
     */
    @RabbitSubscribe({
        exchange: EVENTS_EXCHANGE,
        routingKey: EVENTS.REMOVE_TEAM,
        queue: "events.remove.team.chat",
        errorHandler: customErrorHandler,
    })
    async handleRemoveTeam(payload: RemoveTeamEventPayload) {
        return await this.serverService.deleteServer(payload);
    }

    /**
     * RPC handler to soft-delete all discussions associated with a team.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.DELETE_SERVER,
        queue: DISCUSSION_PATTERN.DELETE_SERVER,
        errorHandler: customErrorHandler,
    })
    async handleDeleteServer(payload: RemoveTeamEventPayload) {
        return await this.serverService.deleteServer(payload);
    }

    /**
     * RPC handler to permanently delete all data related to a team server.
     * Use with caution as this deletes both discussions and all historical messages.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.PERMANENT_DELETE_SERVER,
        queue: DISCUSSION_PATTERN.PERMANENT_DELETE_SERVER,
        errorHandler: customErrorHandler,
    })
    async handlePermanentDeleteServer(payload: { teamId: string }) {
        return await this.serverService.permanentDeleteServer(payload.teamId);
    }

    /**
     * Subscriber for the ADD_MEMBER event.
     * Syncs new team members to all existing discussions within the team.
     * @param payload Contains the list of members added and the team ID.
     */
    @RabbitSubscribe({
        exchange: EVENTS_EXCHANGE,
        routingKey: EVENTS.ADD_MEMBER,
        queue: 'events.add.member.chat',
        errorHandler: customErrorHandler,
    })
    async handleAddMember(payload: AddMemberEventPayload) {
        return await this.serverService.addMembers(payload);
    }

    /**
     * Subscriber for the USER_UPDATED event.
     * Updates cached user information (name, avatar) in historical messages and snapshots.
     * @param user Partial user object containing updated fields.
     */
    @RabbitSubscribe({
        exchange: EVENTS_EXCHANGE,
        routingKey: EVENTS.USER_UPDATED,
        queue: 'events.user.updated.chat',
        errorHandler: customErrorHandler,
    })
    async handleUserUpdated(user: Partial<User>) {
        return await this.messageService.updateUser(user);
    }

    /**
     * RPC handler to generate a unique invite link/code for a server or channel.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GENERATE_INVITE,
        queue: DISCUSSION_PATTERN.GENERATE_INVITE,
        errorHandler: customErrorHandler,
    })
    async handleGenerateInvite(payload: { teamId: string; discussionId: string; creatorId: string; maxUses?: number; expiresInDays?: number }) {
        return await this.serverService.generateInvite(payload);
    }

    /**
     * RPC handler to validate an invite code and join a server/team.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.JOIN_SERVER,
        queue: DISCUSSION_PATTERN.JOIN_SERVER,
        errorHandler: customErrorHandler,
    })
    async handleJoinServer(payload: { code: string; userId: string }) {
        return await this.serverService.joinServer(payload);
    }

    /**
     * RPC handler to retrieve an invite by its code.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET_INVITE,
        queue: DISCUSSION_PATTERN.GET_INVITE,
        errorHandler: customErrorHandler,
    })
    async handleGetInvite(payload: { code: string }) {
        return await this.serverService.getInviteByCode(payload.code);
    }

    /**
     * RPC handler to retrieve the list of servers a user is participating in.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET_USER_SERVER_LIST,
        queue: DISCUSSION_PATTERN.GET_USER_SERVER_LIST,
        errorHandler: customErrorHandler,
    })
    async handleGetUserServerList(payload: { userId: string }) {
        return await this.serverService.getUserServerList(payload.userId);
    }

    /**
     * RPC handler to manually update server settings (name, avatar).
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.UPDATE_SERVER,
        queue: DISCUSSION_PATTERN.UPDATE_SERVER,
        errorHandler: customErrorHandler,
    })
    async handleUpdateServer(payload: { teamId: string; name?: string; avatar?: string }) {
        return await this.serverService.updateServer(payload);
    }

    /**
     * Subscriber for the TEAM_UPDATED event.
     * Automatically synchronizes server name/avatar changes across all discussions.
     */
    @RabbitSubscribe({
        exchange: EVENTS_EXCHANGE,
        routingKey: EVENTS.TEAM_UPDATED,
        queue: "events.update.team.chat",
        errorHandler: customErrorHandler,
    })
    async handleTeamUpdated(payload: { teamId: string, name?: string, avatar?: string }) {
        return await this.serverService.updateServer(payload);
    }

    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.UPDATE_MEMBER_ROLE,
        queue: DISCUSSION_PATTERN.UPDATE_MEMBER_ROLE,
        errorHandler: customErrorHandler,
    })
    async handleUpdateMemberRole(payload: { teamId: string; userId: string; role: MemberRole; requesterId: string }) {
        return await this.serverService.updateMemberRole(payload);
    }

    /**
     * RPC handler to manually create/initialize a server structure.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.CREATE_SERVER,
        queue: DISCUSSION_PATTERN.CREATE_SERVER,
        errorHandler: customErrorHandler,
    })
    async handleCreateServer(payload: CreateTeamEventPayload) {
        return await this.serverService.createServer(payload);
    }

    /**
     * RPC handler for a member to leave a team.
     */
    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.LEAVE_TEAM,
        queue: DISCUSSION_PATTERN.LEAVE_TEAM,
        errorHandler: customErrorHandler,
    })
    async handleLeaveTeam(payload: any) {
        return await this.serverService.leaveTeam(payload);
    }

    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET_DELETED_SERVERS,
        queue: DISCUSSION_PATTERN.GET_DELETED_SERVERS,
        errorHandler: customErrorHandler,
    })
    async handleGetDeletedServers(payload: { userId: string }) {
        return await this.serverService.getDeletedServers(payload.userId);
    }

    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.RESTORE_SERVER,
        queue: DISCUSSION_PATTERN.RESTORE_SERVER,
        errorHandler: customErrorHandler,
    })
    async handleRestoreServer(payload: { teamId: string }) {
        return await this.serverService.restoreServer(payload.teamId);
    }

    @RabbitRPC({
        exchange: DISCUSSION_EXCHANGE,
        routingKey: DISCUSSION_PATTERN.GET_SERVER_MEMBERS,
        queue: DISCUSSION_PATTERN.GET_SERVER_MEMBERS,
        errorHandler: customErrorHandler,
    })
    async handleGetServerMembers(payload: { teamId: string, page: number, limit: number }) {
        return await this.serverService.getServerMembers(payload);
    }
}
