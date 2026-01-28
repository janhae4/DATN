import { SenderSnapshotDto } from "./create-message.dto";

export class ReactionDto {
    emoji: string;
    userIds: string[];
}

export class AttachmentDto {
    type: string;
    name?: string
    url?: string;
}

export class MessageSnapshot {
    _id: string;
    content: string;
    attachments?: AttachmentDto[];
    sender: SenderSnapshotDto;
    createdAt: Date;
    reactions?: ReactionDto[];
}