import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, Types } from "mongoose";
import { MessageMetadata, SenderSnapshot, SenderSnapshotSchema } from "./message.schema";

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

  @Prop({ required: true })
  content: string;

  @Prop({ type: MessageMetadata, required: false })
  metadata?: MessageMetadata;

  @Prop({ type: SenderSnapshotSchema, required: true })
  sender: SenderSnapshot;

  @Prop()
  createdAt: Date;
}
export const LatestMessageSnapshotSchema = SchemaFactory.createForClass(LatestMessageSnapshot);


@Schema({ timestamps: true })
export class AiDiscussion {
  _id?: Types.ObjectId;

  @Prop({ trim: true })
  name: string;

  @Prop()
  ownerId: string;

  @Prop({ index: true })
  teamId?: string;

  @Prop({ type: TeamSnapshot })
  teamSnapshot?: TeamSnapshot;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "AiMessage" })
  latestMessage?: mongoose.Types.ObjectId;

  @Prop({ type: LatestMessageSnapshotSchema })
  latestMessageSnapshot?: LatestMessageSnapshot;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: "AiMessage", default: [] })
  pinnedMessages?: mongoose.Types.ObjectId[];

  @Prop({ default: false })
  isDeleted?: boolean;
}

export const AiDiscussionSchema = SchemaFactory.createForClass(AiDiscussion);
export type AiDiscussionDocument = AiDiscussion & Document;
