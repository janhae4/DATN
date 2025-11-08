import { MemberShip } from '@app/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';

@Schema({ _id: false })
export class RetrievedContext {
  @Prop({ required: true })
  source_id: string;
  @Prop({ required: true })
  source_name: string;
  @Prop({ required: true })
  chunk_id: number;
  @Prop()
  page_number?: number;
  @Prop({ required: true })
  score: number;
  @Prop()
  snippet?: string;
}
export const RetrievedContextSchema = SchemaFactory.createForClass(RetrievedContext);

@Schema({ _id: false })
export class MessageMetadata {
  @Prop({ type: [RetrievedContextSchema], default: [] })
  retrieved_context?: RetrievedContext[];

  @Prop()
  error?: string;
}
export const MessageMetadataSchema = SchemaFactory.createForClass(MessageMetadata);

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
export class AiMessage {
  _id?: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AiDiscussion',
    required: true,
    index: true
  })
  discussionId: string;

  @Prop({ type: SenderSnapshotSchema, required: true })
  sender: SenderSnapshot

  @Prop({ required: true })
  content: string;

  createdDate: Date

  @Prop({ type: MessageMetadataSchema })
  metadata?: MessageMetadata;
}

export const AiMessageSchema = SchemaFactory.createForClass(AiMessage);
