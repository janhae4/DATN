import { MemberShip } from "@app/contracts";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Attachment, AttachmentSchema, SenderSnapshot, SenderSnapshotSchema } from "./message.schema";

@Schema({ _id: false })
export class ParticipantRef {
  @Prop({ required: true })
  _id: string;

  @Prop({ type: String, enum: Object.values(MemberShip), default: MemberShip.ACTIVE })
  status: MemberShip;
}
export const ParticipantRefSchema = SchemaFactory.createForClass(ParticipantRef);

@Schema({ _id: false })
export class TeamSnapshot {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;
}

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

  @Prop({ type: [ParticipantRefSchema], default: [] })
  participants: ParticipantRef[];

  @Prop({ type: [ParticipantRefSchema], default: [] })
  groupAdminIds: ParticipantRef[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "Message" })
  latestMessage?: mongoose.Types.ObjectId;

  @Prop({ type: LatestMessageSnapshotSchema })
  latestMessageSnapshot?: LatestMessageSnapshot;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "Message", default: [] })
  pinnedMessages?: mongoose.Types.ObjectId[];

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const DiscussionSchema = SchemaFactory.createForClass(Discussion);
export type DiscussionDocument = Discussion & Document;
