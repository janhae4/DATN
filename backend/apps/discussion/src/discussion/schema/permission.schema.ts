import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { MemberRole, PermissionKey } from "@app/contracts";

@Schema({ timestamps: true })
export class PermissionOverride {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true })
    discussionId: mongoose.Types.ObjectId;

    @Prop({ required: false, index: true })
    userId?: string;

    @Prop({ required: false, enum: MemberRole, index: true })
    role?: string;

    @Prop({ type: [String], enum: PermissionKey, default: [] })
    allow: PermissionKey[];

    @Prop({ type: [String], enum: PermissionKey, default: [] })
    deny: PermissionKey[];
}

export const PermissionOverrideSchema = SchemaFactory.createForClass(PermissionOverride);
PermissionOverrideSchema.index({ discussionId: 1, userId: 1 }, { unique: true, sparse: true });
PermissionOverrideSchema.index({ discussionId: 1, role: 1 }, { unique: true, sparse: true });

export type PermissionOverrideDocument = PermissionOverride & Document;
