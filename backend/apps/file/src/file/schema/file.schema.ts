import { FileStatus } from '@app/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FileDocument = File & Document;

@Schema({ timestamps: true, _id: false })
export class File {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ required: true, index: true })
    storageKey: string;

    @Prop({ required: true })
    originalName: string;

    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ index: true })
    teamId?: string;

    @Prop()
    mimetype: string;

    @Prop()
    size: number;

    @Prop({ type: String, enum: FileStatus, default: FileStatus.PENDING })
    status: string;

    @Prop({ type: String, default: null })
    pendingNewName?: string;
}

export const FileSchema = SchemaFactory.createForClass(File);