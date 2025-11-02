import { MemberShip } from '@app/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';

@Schema({ _id: false })
export class Attachment {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  fileName: string;
}
export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

@Schema({ _id: false })
export class SenderSnapshot {
  @Prop({ required: true })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar?: string;

  @Prop({ type: String, enum: Object.values(MemberShip), default: MemberShip.ACTIVE })
  status: MemberShip;
}
export const SenderSnapshotSchema = SchemaFactory.createForClass(SenderSnapshot);

@Schema({ timestamps: true })
export class Message {
  @Prop({type: SenderSnapshotSchema, required: true })
  sender: SenderSnapshot;

  @Prop({ trim: true, required: true })
  content: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
    required: true,
  })
  discussionId: mongoose.Types.ObjectId;

  @Prop({ type: [String], default: [] })
  readByIds: string[];

  @Prop({ type: [SchemaFactory.createForClass(Attachment)] })
  attachments: Attachment[];

  @Prop({
    type: [
      {
        userId: String,
        emoji: String,
      },
    ],
  })
  reactions: { userId: string; emoji: string }[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

