import { Prop, Schema } from "@nestjs/mongoose";

@Schema({ _id: false })
export class Participant {
    @Prop({ required: true, index: true, type: String })
    _id: string;
    @Prop({ required: true })
    name: string;

    @Prop()
    avatar?: string;

    @Prop({ required: true })
    role: string;
}