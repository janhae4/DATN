import { TeamSnapshot } from "@app/contracts";
import { MemberShip } from "./participant.dto";

class AttachmentDto {
  url: string;
  type: string;
  fileName?: string;
}

class SenderSnapshot {
  _id: string;
  name: string;
  avatar?: string;
  status: MemberShip
}

class MessageSnapshot {
  _id: string;
  content: string;
  attachments?: AttachmentDto[]
  sender: SenderSnapshot;
  createdAt: Date;
} 

export interface SendMessageEventPayload {
  _id: string;
  discussionId: string;
  messageSnapshot: MessageSnapshot;
  teamSnapshot: TeamSnapshot;
  participantIds?: string[];
  membersToNotify?: string[]
}
