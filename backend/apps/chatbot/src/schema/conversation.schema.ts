import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Message, MessageSchema } from './message.schema';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: true, index: true })
  user_id: string;

  @Prop()
  title?: string;

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
