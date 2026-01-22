import { FileStatus, FileType } from '@app/contracts';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FileDocument = File & Document;

@Schema({ timestamps: true, _id: false })
export class File {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ index: true })
    storageKey: string;

    @Prop({ required: true })
    originalName: string;

    @Prop({ type: String, enum: FileType, default: FileType.FILE, index: true })
    type: FileType;

    @Prop({ type: String, ref: 'File', default: null, index: true })
    parentId: string | null;

    @Prop({ required: true, index: true })
    userId: string;

    @Prop({ index: true })
    projectId?: string;

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

FileSchema.index({ userId: 1, parentId: 1, type: 1 });