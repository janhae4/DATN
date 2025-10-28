import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Message } from './message.schema';
import { Participant, ParticipantSchema } from './participant.schema';

@Schema({ timestamps: true })
export class Conversation extends Document{
  @Prop({ trim: true })
  name: string;

  @Prop()
  ownerId: string;

  @Prop()
  teamId: string;

  @Prop({ default: false })
  isGroupChat: boolean;

  @Prop({ type: [ParticipantSchema], default: [] })
  participants: Participant[];

  @Prop([])
  groupAdmins: string[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Message' })
  latestMessage: Message | MongooseSchema.Types.ObjectId;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
