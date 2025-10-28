export class ResponseStreamDto {
  socketId: string;
  type: string;
  content: string;
  conversationId: string;
  metadata: any;
  teamId?: string;
}
