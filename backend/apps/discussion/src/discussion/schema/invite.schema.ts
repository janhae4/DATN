import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

@Schema({ timestamps: true })
export class Invite {
    @Prop({ required: true, unique: true })
    code: string;

    @Prop({ required: true })
    discussionId: string;

    @Prop({ required: true })
    teamId: string;

    @Prop({ required: true })
    creatorId: string;

    @Prop()
    expiresAt?: Date;

    @Prop({ default: 0 })
    maxUses?: number;

    @Prop({ default: 0 })
    uses: number;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
export type InviteDocument = Invite & Document;
