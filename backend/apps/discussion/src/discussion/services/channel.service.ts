import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discussion, DiscussionDocument, TeamSnapshot, Membership, MembershipDocument } from '../schema/discussion.schema';
import { DiscussionType, MemberShip, MemberRole, USER_EXCHANGE, USER_PATTERNS } from '@app/contracts';
import { Types } from 'mongoose';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

/**
 * Service responsible for managing discussion channels and categories within a team.
 */
@Injectable()
export class ChannelService {
    private readonly logger = new Logger(ChannelService.name);

    constructor(
        @InjectModel(Discussion.name)
        private readonly discussionModel: Model<DiscussionDocument>,
        @InjectModel(Membership.name)
        private readonly membershipModel: Model<MembershipDocument>,
        private readonly amqp: AmqpConnection
    ) { }

    /**
     * Creates a channel or category internally (used by other services like ServerService).
     * @param data The discussion data including teamId, name, and optional parentId.
     * @returns The created discussion document.
     */
    async createChannelInternal(data: Partial<Discussion> & { teamId: string; name: string, parentId?: string, serverId?: string }) {
        const query: any = { teamId: data.teamId, parentId: data.parentId };
        if (data.serverId) query.serverId = data.serverId;

        const count = await this.discussionModel.countDocuments(query);
        return await this.discussionModel.create({
            ...data,
            serverId: data.serverId ? new Types.ObjectId(data.serverId) : undefined,
            isGroup: true,
            position: count,
        });
    }

    async createChannel(data: { teamId: string; name: string; type: DiscussionType; ownerId: string; parentId?: string; teamSnapshot?: TeamSnapshot; serverId?: string }) {
        const query: any = { teamId: data.teamId, parentId: data.parentId };
        if (data.serverId) query.serverId = data.serverId;

        const count = await this.discussionModel.countDocuments(query);
        const discussion = await this.discussionModel.create({
            ...data,
            serverId: data.serverId ? new Types.ObjectId(data.serverId) : undefined,
            isGroup: true,
            position: count,
        });

        await this.membershipModel.create({
            discussionId: discussion._id,
            userId: data.ownerId,
            role: MemberRole.OWNER,
            status: MemberShip.ACTIVE
        });

        return discussion;
    }

    async createCategory(data: { teamId: string; name: string; ownerId: string; teamSnapshot?: TeamSnapshot; serverId?: string }) {
        const query: any = { teamId: data.teamId, type: DiscussionType.CATEGORY };
        if (data.serverId) query.serverId = data.serverId;

        const count = await this.discussionModel.countDocuments(query);
        const discussion = await this.discussionModel.create({
            ...data,
            serverId: data.serverId ? new Types.ObjectId(data.serverId) : undefined,
            type: DiscussionType.CATEGORY,
            isGroup: true,
            position: count,
        });

        await this.membershipModel.create({
            discussionId: discussion._id,
            userId: data.ownerId,
            role: MemberRole.OWNER,
            status: MemberShip.ACTIVE
        });

        return discussion;
    }

    /**
     * Reorders channels and categories within a team.
     * @param teamId The ID of the team.
     * @param orders A list of channel IDs and their new positions/parents.
     */
    async reorderChannels(teamId: string, orders: { id: string; position: number; parentId?: string }[]) {
        const operations = orders.map(order => ({
            updateOne: {
                filter: { _id: new Types.ObjectId(order.id) as any, teamId },
                update: { $set: { position: order.position, parentId: order.parentId ? new Types.ObjectId(order.parentId) : undefined } }
            }
        }));
        await this.discussionModel.bulkWrite(operations as any);
        return { success: true };
    }

    /**
     * Retrieves all active (non-deleted) channels belonging to a specific team.
     * @param teamId The ID of the team.
     * @returns A list of discussion documents.
     */
    async getChannelsByTeam(teamId: string) {
        return await this.discussionModel.find({ teamId, isDeleted: { $ne: true } }).lean();
    }

    /**
     * Retrieves all active (non-deleted) channels belonging to a specific server.
     * @param serverId The ID of the server.
     * @returns A list of discussion documents.
     */
    async getChannelsByServer(serverId: string) {
        console.log('serverId when getChannelsByServer', serverId);
        return await this.discussionModel.find({
            serverId: new Types.ObjectId(serverId),
            isDeleted: { $ne: true }
        }).lean();
    }

    /**
     * Updates an existing channel's information.
     * @param id The ID of the channel to update.
     * @param update The update data.
     * @returns The updated discussion document.
     * @throws NotFoundException if the channel does not exist.
     */
    async updateChannel(id: string, update: Partial<Discussion>) {
        const channel = await this.discussionModel.findByIdAndUpdate(id, update, { new: true });
        if (!channel) throw new NotFoundException('Channel not found');
        return channel;
    }

    /**
     * Soft-deletes a channel by setting the isDeleted flag.
     * @param id The ID of the channel to delete.
     * @returns The updated discussion document marked as deleted.
     */
    async deleteChannel(id: string) {
        return await this.discussionModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    }

    /**
     * Permanently deletes a channel from the database.
     * @param id The ID of the channel to delete.
     * @returns The deleted discussion document, or null if not found.
     */
    async permanentDelete(id: string) {
        return await this.discussionModel.findByIdAndDelete(id);
    }

    /**
     * Retrieves a single channel by its ID.
     * @param id The ID of the channel.
     * @returns The discussion document.
     * @throws NotFoundException if the channel does not exist.
     */
    async getChannelById(id: string) {
        const channel = await this.discussionModel.findById(id).lean();
        if (!channel) throw new NotFoundException('Channel not found');
        return channel;
    }

    /**
     * Retrieves a paginated list of all discussions (channels, group chats, DMs) 
     * that a specific user is participating in.
     * @param userId The ID of the user.
     * @param page Page number for pagination.
     * @param limit Items per page.
     * @returns A list of discussion documents.
     */
    async getDiscussionsForUser(userId: string, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const memberships = await this.membershipModel
            .find({ userId, status: MemberShip.ACTIVE })
            .select('discussionId')
            .lean();

        const discussionIds = memberships.map(m => m.discussionId);

        const total = await this.discussionModel.countDocuments({
            _id: { $in: discussionIds },
            type: DiscussionType.DIRECT,
            isDeleted: { $ne: true }
        });

        const totalPages = Math.ceil(total / limit);

        const discussions = await this.discussionModel
            .find({
                _id: { $in: discussionIds },
                type: DiscussionType.DIRECT,
                isDeleted: { $ne: true }
            })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const partnerIds = new Set<string>();
        discussions.forEach(d => {
            const ids = d.name.split('_');
            const pid = ids.find(id => id !== userId);
            if (pid) partnerIds.add(pid);
        });

        let usersMap = new Map<string, any>();
        if (partnerIds.size > 0) {
            try {
                const users = await this.amqp.request<any[]>({
                    exchange: USER_EXCHANGE,
                    routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
                    payload: { userIds: Array.from(partnerIds) },
                });
                if (users) {
                    users.forEach(u => usersMap.set(u.id || u._id, u));
                }
            } catch (e) {
                this.logger.error('Failed to fetch partner details', e);
            }
        }

        const data = discussions.map(d => {
            const ids = d.name.split('_');
            const partnerId = ids.find(id => id !== userId);
            const otherUser = partnerId ? usersMap.get(partnerId) : null;

            return {
                ...d,
                partnerId,
                otherUser: otherUser ? {
                    _id: otherUser.id || otherUser._id,
                    name: otherUser.name,
                    avatar: otherUser.avatar,
                    email: otherUser.email
                } : null
            };
        });

        return {
            data,
            page,
            limit,
            total,
            totalPages
        };
    }

    /**
     * Creates or retrieves an existing direct message discussion between two users.
     * @param senderId The ID of the user initiating the DM.
     * @param partnerId The ID of the other user.
     * @returns The direct discussion document.
     */
    async createDirectDiscussion(senderId: string, partnerId: string) {
        const existingDM = await this.discussionModel.findOne({
            type: DiscussionType.DIRECT,
            isGroup: false,
            isDeleted: { $ne: true },
            $or: [
                { name: `${senderId}_${partnerId}` },
                { name: `${partnerId}_${senderId}` }
            ]
        }).lean();

        if (existingDM) {
            this.logger.log(`Found existing DM: ${existingDM._id}`);
            return existingDM;
        }

        const discussionDoc = await this.discussionModel.create({
            name: `${senderId}_${partnerId}`,
            type: DiscussionType.DIRECT,
            isGroup: false,
        });

        await this.membershipModel.insertMany([
            {
                discussionId: discussionDoc._id,
                userId: senderId,
                role: MemberRole.MEMBER,
                status: MemberShip.ACTIVE
            },
            {
                discussionId: discussionDoc._id,
                userId: partnerId,
                role: MemberRole.MEMBER,
                status: MemberShip.ACTIVE
            }
        ]);

        // Return with partner info
        let otherUser: any = null;
        try {
            const users = await this.amqp.request<any[]>({
                exchange: USER_EXCHANGE,
                routingKey: USER_PATTERNS.FIND_MANY_BY_IDs,
                payload: { userIds: [partnerId] },
            });
            if (users && users.length > 0) {
                const u = users[0];
                otherUser = {
                    _id: u.id || u._id,
                    name: u.name,
                    avatar: u.avatar,
                    email: u.email
                };
            }
        } catch (e) {
            this.logger.error('Failed to fetch partner details for new DM', e);
        }

        const result = {
            ...discussionDoc.toObject(),
            partnerId,
            otherUser
        };

        this.logger.log(`Created new DM: ${discussionDoc._id} between ${senderId} and ${partnerId}`);
        return result;
    }
}
