import { ParticipantDto } from "@app/contracts/discussion/dto/participant.dto";
import { EventUserSnapshot } from "@app/contracts/team/dto/create-team.dto";
import { MemberRole } from "@app/contracts/team/dto/member.dto";
import { TeamSnapshot } from "apps/chatbot/src/schema/ai-discussion.schema";

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
  id: string;
  sender: EventUserSnapshot;
  content: string;
  timestamp: Date;
  metadata: MessageMetadataDto;
}

export class SendAiMessageEventPayload {
  discussionId: string
  teamSnapshot: TeamSnapshot;
  message: AiMessageSnapshot
}

export class MessageUserChatbot {
  id?: string;
  userId: string;
  message: string;
  role: 'ai' | 'user';
  teamId?: string;
  metadata?: MessageMetadataDto;
}

export const SENDER_SNAPSHOT_AI: EventUserSnapshot = {
  id: 'AI_ID',
  name: 'Ai Assistant',
  avatar: '',
}