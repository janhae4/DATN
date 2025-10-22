import { MEMBER_ROLE } from '@app/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class Participant {
  @Prop({ required: true, type: String })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  avatar: string;

  @Prop({
    type: String,
    enum: MEMBER_ROLE,
    default: MEMBER_ROLE.MEMBER,
  })
  role: MEMBER_ROLE;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);
