import { ParticipantDto } from "./participant.dto";

export class AttachmentDto {
    url: string;
    type: string;
    fileName?: string;
}

export class ReactionDto {
    userId: string;
    emoji: string;
}

export interface SendMessageEventPayload {
    conversationId: string;
    content: string;
    sender: ParticipantDto;
    participants: ParticipantDto[];
    attachments: AttachmentDto[];
    reactions: ReactionDto[];
    createdAt: Date;
}