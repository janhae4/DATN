import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ timestamps: true })
export class Server {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, index: true })
    teamId: string;

    @Prop({ required: true })
    ownerId: string;

    @Prop()
    avatar?: string;

    @Prop({ default: false })
    isDeleted?: boolean;
}

export const ServerSchema = SchemaFactory.createForClass(Server);
export type ServerDocument = Server & Document;
