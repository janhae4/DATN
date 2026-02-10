import { SenderSnapshotDto } from "./create-message.dto";

export class ReactionDto {
    emoji: string;
    userIds: string[];
}

export class AttachmentDto {
    type: 'image' | 'file' | 'video';
    name?: string;
    url: string;
    fileName: string;
    size?: number;
}

export class MessageSnapshot {
    _id: string;
    content: string;
    attachments?: AttachmentDto[];
    sender: SenderSnapshotDto;
    createdAt: string | Date;
    updatedAt?: string | Date;
    isDeleted?: boolean;
    reactions?: ReactionDto[];
}