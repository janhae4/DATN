import { MemberShip, MemberRole, DiscussionType } from "@app/contracts";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Attachment, AttachmentSchema, SenderSnapshot, SenderSnapshotSchema } from "./message.schema";

// Membership = links user to discussion 
@Schema({ timestamps: true })
export class Membership {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true })
  discussionId: mongoose.Types.ObjectId;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ type: String, enum: Object.values(MemberShip), default: MemberShip.ACTIVE })
  status: MemberShip;

  @Prop({ type: String, enum: Object.values(MemberRole), default: MemberRole.MEMBER })
  role: MemberRole;

  @Prop({ default: false })
  isAdmin: boolean; 
}
export const MembershipSchema = SchemaFactory.createForClass(Membership);
MembershipSchema.index({ discussionId: 1, userId: 1 }, { unique: true });

// ReadReceipt = tracks progress of reading 
@Schema({ timestamps: true })
export class ReadReceipt {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', required: true, index: true })
  discussionId: mongoose.Types.ObjectId;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  lastReadAt: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Message' })
  lastMessageId: mongoose.Types.ObjectId;
}
export const ReadReceiptSchema = SchemaFactory.createForClass(ReadReceipt);
ReadReceiptSchema.index({ discussionId: 1, userId: 1 }, { unique: true });



// Team snapshot = team basic info
@Schema({ _id: false })
export class TeamSnapshot {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;
}

// Latest message snapshot = latest message basic info ( show in sidebar)
@Schema({ _id: false })
export class LatestMessageSnapshot {
  @Prop({ required: true })
  _id: string;

  @Prop()
  content: string;

  @Prop({ type: [AttachmentSchema], default: [] })
  attachments?: Attachment[];

  @Prop({ type: SenderSnapshotSchema, required: true })
  sender: SenderSnapshot;

  @Prop()
  createdAt: Date;
}
export const LatestMessageSnapshotSchema = SchemaFactory.createForClass(LatestMessageSnapshot);


// Discussion = group or direct message
@Schema({ timestamps: true })
export class Discussion {
  @Prop({ trim: true })
  name: string;

  @Prop()
  ownerId: string;

  @Prop({ index: true })
  teamId?: string;

  @Prop({ type: TeamSnapshot })
  teamSnapshot?: TeamSnapshot;

  @Prop({ default: false })
  isGroup: boolean;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Discussion' })
  parentId?: string;

  @Prop({ type: String, enum: DiscussionType, default: DiscussionType.TEXT })
  type: DiscussionType;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Message" })
  latestMessage?: mongoose.Types.ObjectId;

  @Prop({ type: LatestMessageSnapshotSchema })
  latestMessageSnapshot?: LatestMessageSnapshot;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "Message", default: [] })
  pinnedMessages?: mongoose.Types.ObjectId[];

  @Prop({ default: 0 })
  position: number;

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const DiscussionSchema = SchemaFactory.createForClass(Discussion);
export type DiscussionDocument = Discussion & Document;
export type MembershipDocument = Membership & Document;
export type ReadReceiptDocument = ReadReceipt & Document;
