export class ResponseStreamDto {
  socketId: string;
  type: string;
  content: string;
  discussionId: string;
  metadata: any;
  teamId?: string;
  membersToNotify?: string[];
}
