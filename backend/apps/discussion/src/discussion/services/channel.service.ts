import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Discussion, DiscussionDocument, TeamSnapshot, Membership, MembershipDocument } from '../schema/discussion.schema';
import { DiscussionType, MemberShip, MemberRole } from '@app/contracts';
import { Types } from 'mongoose';

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
    ) { }

    /**
     * Creates a channel or category internally (used by other services like ServerService).
     * @param data The discussion data including teamId, name, and optional parentId.
     * @returns The created discussion document.
     */
    async createChannelInternal(data: Partial<Discussion> & { teamId: string; name: string, parentId?: string }) {
        const count = await this.discussionModel.countDocuments({ teamId: data.teamId, parentId: data.parentId });
        return await this.discussionModel.create({
            ...data,
            isGroup: true,
            position: count,
        });
    }

    async createChannel(data: { teamId: string; name: string; type: DiscussionType; ownerId: string; parentId?: string; teamSnapshot?: TeamSnapshot }) {
        const count = await this.discussionModel.countDocuments({ teamId: data.teamId, parentId: data.parentId });
        const discussion = await this.discussionModel.create({
            ...data,
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

    async createCategory(data: { teamId: string; name: string; ownerId: string; teamSnapshot?: TeamSnapshot }) {
        const count = await this.discussionModel.countDocuments({ teamId: data.teamId, type: DiscussionType.CATEGORY });
        const discussion = await this.discussionModel.create({
            ...data,
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

        // 1. Tìm các Membership của user này
        const memberships = await this.membershipModel
            .find({ userId, status: MemberShip.ACTIVE })
            .select('discussionId')
            .lean();

        const discussionIds = memberships.map(m => m.discussionId);

        // 2. Lấy thông tin Discussion tương ứng
        return await this.discussionModel
            .find({
                _id: { $in: discussionIds },
                isDeleted: { $ne: true }
            })
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();
    }
}
