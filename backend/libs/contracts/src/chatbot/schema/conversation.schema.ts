import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Message, MessageSchema } from './message.schema';
import { ParticipantDto } from '@app/contracts';
import { Participant } from './pariticipant.schema';

export type ConversationDocument = Conversation & Document;
export const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ required: false, index: true })
  team_id?: string;

  @Prop({ required: false, index: true })
  title?: string;

  @Prop({ type: [ParticipantSchema], default: [] })
  participants: Participant[];

  @Prop({ type: [MessageSchema], default: [] })
  messages: Message[];
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
