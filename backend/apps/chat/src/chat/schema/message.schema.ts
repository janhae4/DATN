import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Conversation } from './conversation.schema';
import { Participant, ParticipantSchema } from './participant.schema';

@Schema({ _id: false })
class Attachment {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  type: string;

  @Prop()
  fileName: string;
}

@Schema({ _id: false })
class Reaction {
  @Prop({ type: ParticipantSchema, required: true })
  user: Participant;

  @Prop()
  emoji: string;
}

@Schema({ _id: false })
class Reader {
  @Prop()
  id: string;

  @Prop()
  readAt: Date;
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: ParticipantSchema, required: true })
  sender: Participant;

  @Prop({ trim: true })
  content: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
  })
  conversation: Conversation;

  @Prop({ type: [SchemaFactory.createForClass(Reader)], default: [] })
  readBy: Reader[];

  @Prop({ type: [SchemaFactory.createForClass(Attachment)] })
  attachments: Attachment[];

  @Prop({ type: [SchemaFactory.createForClass(Reaction)] })
  reactions: Reaction[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
MessageSchema.index({content: 'text'})
