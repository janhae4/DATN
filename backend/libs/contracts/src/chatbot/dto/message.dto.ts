import { SenderSnapshotDto } from "@app/contracts/discussion/dto/create-message.dto";
import { EventUserSnapshot, TeamSnapshot } from "@app/contracts/team/dto/create-team.dto";

export class RetrievedContextDto {
  source_id: string;
  source_name: string;
  chunk_id: number;
  page_number?: number;
  score: number;
  snippet?: string;
}
export class MessageMetadataDto {
  retrieved_context?: RetrievedContextDto[];
  error?: string;
}

export class AiMessageSnapshot {
  _id: string;
  sender: SenderSnapshotDto;
  content: string;
  createdAt: Date;
  metadata: MessageMetadataDto;
}

export class SendAiMessageEventPayload {
  sender: SenderSnapshotDto
  message: string
  discussionId?: string
  teamId?: string
  metadata?: MessageMetadataDto
}

export class MessageUserChatbot {
  discussionId?: string;
  userId: string;
  message: string;
  teamId?: string;
  metadata?: MessageMetadataDto;
  summarizeFileName?: string;
  socketId?: string
}

export const SENDER_SNAPSHOT_AI: EventUserSnapshot = {
  id: 'AI_ID',
  name: 'Ai Assistant',
  avatar: '',
}

export class AiDiscussionDto {
  _id?: string;
  name: string;
  teamId?: string;
  teamSnapshot?: TeamSnapshot;
  ownerId?: string;
  latestMessage?: string;
  latestMessageSnapshot?: AiMessageSnapshot;
}