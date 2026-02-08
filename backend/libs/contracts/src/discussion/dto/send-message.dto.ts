import { MemberShip } from "@app/contracts/enums/membership.enum";
import { TeamSnapshot } from "@app/contracts/team/dto/create-team.dto";

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
  replyTo?: ReplySnapshot;
}

class ReplySnapshot {
  messageId: string;
  content: string;
  senderName: string;
}

export interface SendMessageEventPayload {
  _id: string;
  discussionId: string;
  messageSnapshot: MessageSnapshot;
  teamSnapshot: TeamSnapshot;
  membersToNotify?: string[];


}
