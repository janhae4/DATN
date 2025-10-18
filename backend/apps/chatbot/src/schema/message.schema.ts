import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class MessageMetadata {
    @Prop({ type: Object })
    retrieved_context?: Record<string, any>;

    @Prop()
    error?: string;
}
export const MessageMetadataSchema = SchemaFactory.createForClass(MessageMetadata);


@Schema({ timestamps: { createdAt: 'timestamp' } })
export class Message {
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