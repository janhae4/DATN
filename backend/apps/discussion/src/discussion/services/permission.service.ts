import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PermissionOverride, PermissionOverrideDocument } from '../schema/permission.schema';
import { Discussion, DiscussionDocument, Membership, MembershipDocument } from '../schema/discussion.schema';
import { MemberRole, PermissionKey } from '@app/contracts';

@Injectable()
export class PermissionService {

    constructor(
        @InjectModel(PermissionOverride.name)
        private readonly overrideModel: Model<PermissionOverrideDocument>,
        @InjectModel(Discussion.name)
        private readonly discussionModel: Model<DiscussionDocument>,
        @InjectModel(Membership.name)
        private readonly membershipModel: Model<MembershipDocument>,
    ) { }

    /**
     * Validates if a user has a specific permission in a discussion.
     */
    async checkPermission(discussionId: string, userId: string, permission: PermissionKey): Promise<boolean> {
        const discussion = await this.discussionModel.findById(discussionId).lean();
        if (!discussion) return false;

        // 1. Owner always has permission
        if (discussion.ownerId === userId) return true;

        // 2. Check membership and role via simplified Membership collection
        const membership = await this.membershipModel.findOne({ discussionId, userId }).lean();
        if (!membership) return false;

        // 3. User is Admin of this group/server
        if (membership.isAdmin || membership.role === MemberRole.ADMIN || membership.role === MemberRole.OWNER) return true;

        // 4. Check User Override cụ thể (Ưu tiên nhất)
        const userOverride = await this.overrideModel.findOne({ discussionId, userId }).lean();
        if (userOverride) {
            if (userOverride.deny.includes(permission)) return false;
            if (userOverride.allow.includes(permission)) return true;
        }

        // 5. Kiểm tra Role Override
        const roleOverride = await this.overrideModel.findOne({ discussionId, role: membership.role }).lean();
        if (roleOverride) {
            if (roleOverride.deny.includes(permission)) return false;
            if (roleOverride.allow.includes(permission)) return true;
        }

        return this.getDefaultPermission(membership.role as MemberRole, permission);
    }

    /**
     * Enforces permission check by throwing ForbiddenException if failed.
     */
    async validatePermission(discussionId: string, userId: string, permission: PermissionKey) {
        const hasPermission = await this.checkPermission(discussionId, userId, permission);
        if (!hasPermission) {
            throw new ForbiddenException(`You do not have permission: ${permission}`);
        }
    }

    /**
     * Updates or creates permission overrides.
     * Only for Owner and Admin.
     */
    async updatePermission(payload: { discussionId: string; requesterId: string; override: any }) {
        const { discussionId, requesterId, override } = payload;

        await this.validatePermission(discussionId, requesterId, PermissionKey.MANAGE_ROLES);

        const { userId, role, allow, deny } = override;

        await this.overrideModel.findOneAndUpdate(
            {
                discussionId,
                ...(userId ? { userId } : { role })
            },
            {
                $set: { allow, deny }
            },
            {
                upsert: true,
                new: true
            }
        );

        return { success: true };
    }

    private getDefaultPermission(role: MemberRole, permission: PermissionKey): boolean {
        if (role === MemberRole.OWNER || role === MemberRole.ADMIN) return true;
        if (permission === PermissionKey.VIEW_CHANNELS || permission === PermissionKey.SEND_MESSAGES) {
            return true;
        }

        return false;
    }
}
