import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Participant } from './pariticipant.schema';
import { ParticipantSchema } from './conversation.schema';

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
export const RetrievedContextSchema =
  SchemaFactory.createForClass(RetrievedContext);

@Schema({ _id: false })
export class MessageMetadata {
  @Prop({ type: [RetrievedContextSchema], default: [] })
  retrieved_context?: RetrievedContext[];

  @Prop()
  error?: string;
}
export const MessageMetadataSchema =
  SchemaFactory.createForClass(MessageMetadata);

@Schema({ timestamps: { createdAt: 'timestamp' } })
export class Message {
  @Prop({ type: ParticipantSchema, required: true })
  sender: Participant

  @Prop({
    type: String,
    enum: ['user', 'ai', 'system'],
    required: true,
  })
  role: string;

  @Prop({ required: true })
  content: string;

  timestamp: Date;

  @Prop({ type: MessageMetadataSchema })
  metadata?: MessageMetadata;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
