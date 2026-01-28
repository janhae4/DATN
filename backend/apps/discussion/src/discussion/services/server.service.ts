import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discussion, DiscussionDocument, Membership, MembershipDocument } from '../schema/discussion.schema';
import { Invite, InviteDocument } from '../schema/invite.schema';
import {
    CreateTeamEventPayload,
    MemberRole,
    MemberShip,
    RemoveTeamEventPayload,
    AddMemberEventPayload,
    RemoveMemberEventPayload,
    LeaveMemberEventPayload,
    TransferOwnershipEventPayload,
    ChangeRoleMember,
    DiscussionType,
    PermissionKey
} from '@app/contracts';
import { MessageService } from './message.service';
import { ChannelService } from './channel.service';
import { PermissionService } from './permission.service';

@Injectable()
export class ServerService {
    private readonly logger = new Logger(ServerService.name);

    constructor(
        @InjectModel(Discussion.name)
        private readonly discussionModel: Model<DiscussionDocument>,
        @InjectModel(Invite.name)
        private readonly inviteModel: Model<InviteDocument>,
        @InjectModel(Membership.name)
        private readonly membershipModel: Model<MembershipDocument>,
        private readonly messageService: MessageService,
        private readonly channelService: ChannelService,
        private readonly permissionService: PermissionService,
    ) { }

    /**
     * Initializes a "Server"
     */
    async initServer(payload: CreateTeamEventPayload) {
        const { owner, members, teamSnapshot } = payload;
        const { id: teamId, name: teamName } = teamSnapshot;

        const existingChannels = await this.discussionModel.countDocuments({ teamId });
        if (existingChannels > 0) {
            this.logger.warn(`Server for team ${teamId} (${teamName}) already initialized. skipping.`);
            return await this.discussionModel.findOne({ teamId, name: 'general' });
        }

        this.logger.log(`Initializing server for team: ${teamName}`);

        const [textCategory, voiceCategory] = await Promise.all([
            this.channelService.createChannelInternal({
                teamId,
                name: "TEXT CHANNELS",
                ownerId: owner.id,
                teamSnapshot,
                type: DiscussionType.CATEGORY,
                position: 0
            }),
            this.channelService.createChannelInternal({
                teamId,
                name: "VOICE CHANNELS",
                ownerId: owner.id,
                teamSnapshot,
                type: DiscussionType.CATEGORY,
                position: 1
            })
        ]);

        const [generalChannel, notificationChannel, waitingRoom] = await Promise.all([
            this.channelService.createChannelInternal({
                teamId,
                name: "general",
                ownerId: owner.id,
                teamSnapshot,
                type: DiscussionType.TEXT,
                parentId: (textCategory._id as any).toString(),
                position: 0
            }),
            this.channelService.createChannelInternal({
                teamId,
                name: "notification",
                ownerId: owner.id,
                teamSnapshot,
                type: DiscussionType.TEXT,
                parentId: (textCategory._id as any).toString(),
                position: 1
            }),
            this.channelService.createChannelInternal({
                teamId,
                name: "Waiting room",
                ownerId: owner.id,
                teamSnapshot,
                type: DiscussionType.VOICE,
                parentId: (voiceCategory._id as any).toString(),
                position: 0
            })
        ]);

        // 2. Tạo Membership quy mô lớn cho tất cả thành viên vào các channel này
        const allChannels = [textCategory, voiceCategory, generalChannel, notificationChannel, waitingRoom];
        const allUserInfos = [
            { id: owner.id, role: MemberRole.OWNER, isAdmin: true },
            ...members.map(m => ({ id: m.id, role: MemberRole.MEMBER, isAdmin: false }))
        ];

        const membershipDocs: any[] = [];
        for (const channel of allChannels) {
            for (const user of allUserInfos) {
                membershipDocs.push({
                    discussionId: channel._id,
                    userId: user.id,
                    role: user.role,
                    isAdmin: user.isAdmin,
                    status: MemberShip.ACTIVE
                });
            }
        }

        await this.membershipModel.insertMany(membershipDocs);

        await this.messageService.sendSystemMessage(
            generalChannel,
            `${owner.name} has initiallized server "${teamName}". Welcome everybody!`
        );

        return generalChannel;
    }

    /**
     * API implementation for creating a server manually.
     */
    async createServer(payload: CreateTeamEventPayload) {
        return await this.initServer(payload);
    }

    /**
     * Deletes (soft-delete) all discussions related to a team
     */
    async deleteServer(payload: RemoveTeamEventPayload) {
        const { teamId, requesterName, teamName, requesterId } = payload;
        this.logger.log(`Deleting server [${teamId}] by user [${requesterId}]`);

        await this.discussionModel.updateMany(
            { teamId },
            { $set: { isDeleted: true } }
        );

        const mainChannel = await this.discussionModel.findOne({ teamId, type: DiscussionType.TEXT });
        if (mainChannel) {
            await this.messageService.sendSystemMessage(mainChannel, `Server "${teamName}" has been deleted.`);
        }
    }

    /**
     * Permanently deletes all discussions and messages related to a team
     */
    async permanentDeleteServer(teamId: string) {
        this.logger.log(`Permanently deleting server and all data for team: ${teamId}`);
        const discussions = await this.discussionModel.find({ teamId }).select('_id').lean();
        const discussionIds = discussions.map(d => (d._id as any).toString());
        if (discussionIds.length > 0) {
            await this.messageService.deleteMessagesByDiscussionIds(discussionIds);
            await this.discussionModel.deleteMany({ teamId });
        }
        return { success: true, deletedDiscussions: discussionIds.length };
    }

    /**
     * Generates a unique invite link/code for a server/discussion.
     */
    async generateInvite(payload: { teamId: string; discussionId: string; creatorId: string; maxUses?: number; expiresInDays?: number }) {
        const { teamId, discussionId, creatorId, maxUses = 0, expiresInDays } = payload;
        const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null;

        const existingInvite = await this.inviteModel.findOne({
            teamId,
            discussionId,
            creatorId,
            maxUses,
            expiresAt: expiresAt ? { $gt: new Date() } : null
        });

        if (existingInvite) return existingInvite;

        let code: string;
        do {
            code = Math.random().toString(36).substring(2, 10).toUpperCase();
        } while (await this.inviteModel.exists({ code }));

        return await this.inviteModel.create({
            code,
            teamId,
            discussionId,
            creatorId,
            maxUses,
            expiresAt
        });
    }

    /**
     * Retrieves invite details with server info
     */
    async getInviteByCode(code: string) {
        const invite = await this.inviteModel.findOne({ code }).lean();
        if (!invite) {
            throw new NotFoundException('Invite code not found.');
        }

        const discussion = await this.discussionModel.findOne({ teamId: invite.teamId }).select('teamSnapshot').lean();
        const memberships = await this.membershipModel.find({ discussionId: discussion?._id }).select('userId').lean();

        return {
            ...invite,
            serverName: discussion?.teamSnapshot?.name || 'Unknown Server',
            serverAvatar: discussion?.teamSnapshot?.avatar,
            participantIds: memberships.map(m => m.userId)
        };
    }

    /**
     * Validates an invite code and adds the user to the server discussions.
     */
    async joinServer(payload: { code: string; userId: string }) {
        const { code, userId } = payload;

        const invite = await this.inviteModel.findOne({ code });

        if (!invite) {
            throw new NotFoundException('Invite code not found or invalid.');
        }
        if (invite.expiresAt && invite.expiresAt < new Date()) {
            throw new NotFoundException('Invite code has expired.');
        }

        if ((invite.maxUses ?? 0) > 0 && invite.uses >= (invite.maxUses ?? 0)) {
            throw new NotFoundException('Invite code has reached its maximum usage.');
        }

        const discussions = await this.discussionModel.find({ teamId: invite.teamId, isDeleted: { $ne: true } }).select('_id').lean();

        const membershipDocs = discussions.map(d => ({
            discussionId: d._id,
            userId,
            role: MemberRole.MEMBER,
            status: MemberShip.ACTIVE
        }));

        for (const doc of membershipDocs) {
            await this.membershipModel.findOneAndUpdate(
                { discussionId: doc.discussionId, userId: doc.userId },
                { $setOnInsert: doc },
                { upsert: true }
            );
        }

        await this.inviteModel.updateOne({ _id: invite._id }, { $inc: { uses: 1 } });

        return {
            success: true,
            teamId: invite.teamId,
            discussionId: invite.discussionId
        };
    }

    /**
     * Updates a member's role across all discussions in a team
     */
    async updateMemberRole(payload: { teamId: string; userId: string; role: MemberRole; requesterId: string }) {
        const { teamId, userId, role, requesterId } = payload;

        const serverDiscussion = await this.discussionModel.findOne({ teamId, parentId: { $exists: false } });
        if (!serverDiscussion) {
            throw new NotFoundException('Server not found');
        }

        await this.permissionService.validatePermission(
            serverDiscussion._id.toString(),
            requesterId,
            PermissionKey.MANAGE_ROLES
        );

        // Update role trong Membership collection của tất cả channel thuộc server
        const discussions = await this.discussionModel.find({ teamId }).select('_id').lean();
        const discussionIds = discussions.map(d => d._id);

        await this.membershipModel.updateMany(
            { discussionId: { $in: discussionIds }, userId },
            { $set: { role } }
        );

        return { success: true };
    }

    /**
     * Retrieves all unique servers (team snapshots) that a specific user belongs to.
     */
    async getUserServerList(userId: string) {
        this.logger.log(`Fetching server list for user: ${userId}`);
        // Query memberships for the user
        const memberships = await this.membershipModel.find({ userId, status: MemberShip.ACTIVE }).select('discussionId').lean();
        const discussionIds = memberships.map(m => m.discussionId);

        this.logger.debug(`Found ${discussionIds.length} memberships for user ${userId}`);

        // Aggregate unique servers from the discussions
        const discussions = await this.discussionModel.aggregate([
            {
                $match: {
                    _id: { $in: discussionIds },
                    teamId: { $exists: true },
                    isDeleted: { $ne: true },
                    teamSnapshot: { $exists: true, $ne: null }
                }
            },
            {
                $group: {
                    _id: '$teamId',
                    teamSnapshot: { $first: '$teamSnapshot' }
                }
            },
            { $replaceRoot: { newRoot: '$teamSnapshot' } }
        ]);

        this.logger.log(`Found ${discussions.length} unique servers for user ${userId}`);
        return discussions;
    }

    /**
     * Updates server settings (name, avatar) in all discussions belonging to a team.
     */
    async updateServer(payload: { teamId: string; name?: string; avatar?: string }) {
        const { teamId, name, avatar } = payload;

        const update: any = {};
        if (name) update['teamSnapshot.name'] = name;
        if (avatar) update['teamSnapshot.avatar'] = avatar;

        if (Object.keys(update).length === 0) return { success: true };

        await this.discussionModel.updateMany({ teamId }, { $set: update });

        return { success: true };
    }

    /**
     * Sync Membership: Add Members
     */
    async addMembers(payload: AddMemberEventPayload) {
        const { members, teamId, requesterId, requesterName } = payload;

        const discussions = await this.discussionModel.find({ teamId, isDeleted: { $ne: true } }).select('_id').lean();

        const membershipDocs: any[] = [];
        for (const d of discussions) {
            for (const m of members) {
                membershipDocs.push({
                    discussionId: d._id,
                    userId: m.id,
                    role: MemberRole.MEMBER,
                    status: MemberShip.ACTIVE
                });
            }
        }

        for (const doc of membershipDocs) {
            await this.membershipModel.findOneAndUpdate(
                { discussionId: doc.discussionId, userId: doc.userId },
                { $setOnInsert: doc },
                { upsert: true }
            );
        }

        const generalChannel = await this.discussionModel.findOne({ teamId, name: 'general' });
        if (generalChannel) {
            const names = members.map(m => m.name).join(', ');
            await this.messageService.sendSystemMessage(generalChannel, `${requesterName} added ${names} to the server.`);
        }
    }

    async leaveTeam(payload: LeaveMemberEventPayload) {
        const { teamId, requester } = payload;
        const discussions = await this.discussionModel.find({ teamId }).select('_id').lean();
        const discussionIds = discussions.map(d => d._id);

        await this.membershipModel.updateMany(
            { discussionId: { $in: discussionIds }, userId: requester.id },
            { $set: { status: MemberShip.LEFT } }
        );

        return { success: true };
    }

    async getDeletedServers(userId: string) {
        const memberships = await this.membershipModel.find({ userId }).select('discussionId').lean();
        const discussionIds = memberships.map(m => m.discussionId);

        const discussions = await this.discussionModel.aggregate([
            { $match: { _id: { $in: discussionIds }, teamId: { $exists: true }, isDeleted: true, teamSnapshot: { $exists: true, $ne: null } } },
            { $group: { _id: '$teamId', teamSnapshot: { $first: '$teamSnapshot' } } },
            { $replaceRoot: { newRoot: '$teamSnapshot' } }
        ]);
        return discussions;
    }

    async restoreServer(teamId: string) {
        await this.discussionModel.updateMany({ teamId }, { $set: { isDeleted: false } });
        return { success: true };
    }

    /**
     * Efficiently retrieves unique members of a server with pagination.
     * Uses aggregation to avoid memory bottlenecks with large member counts.
     */
    async getServerMembers(payload: { teamId: string, page: number, limit: number }) {
        const { teamId, page = 1, limit = 20 } = payload;
        const skip = (page - 1) * limit;

        const discussions = await this.discussionModel.find({ teamId, isDeleted: { $ne: true } }).select('_id').lean();
        const discussionIds = discussions.map(d => d._id);

        if (discussionIds.length === 0) return { data: [], total: 0 };

        const result = await this.membershipModel.aggregate([
            { $match: { discussionId: { $in: discussionIds }, status: MemberShip.ACTIVE } },
            {
                $group: {
                    _id: '$userId',
                    role: { $first: '$role' },
                    isAdmin: { $first: '$isAdmin' },
                    joinedAt: { $min: '$createdAt' }
                }
            },
            {
                $facet: {
                    data: [
                        { $sort: { joinedAt: 1 } },
                        { $skip: skip },
                        { $limit: limit }
                    ],
                    total: [
                        { $count: 'count' }
                    ]
                }
            }
        ]);

        const data = result[0].data;
        const total = result[0].total[0]?.count || 0;

        return {
            data: data.map((item: any) => ({
                userId: item._id,
                role: item.role,
                isAdmin: item.isAdmin,
                joinedAt: item.joinedAt
            })),
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
}
