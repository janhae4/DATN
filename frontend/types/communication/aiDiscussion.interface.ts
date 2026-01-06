// types/ai_discussion.interface.ts

export interface AiDiscussion {
  _id: string;
  name?: string;
  ownerId: string;
  teamId?: string;
  teamSnapshot?: any;
  latestMessageId?: string;
  latestMessageSnapshot?: any; 
  pinnedMessages?: any;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AiMessage {
  _id: string; 
  discussionId: string; 
  sender: any;
  content: string;
  createdDate?: string;
  metadata?: any;
  timestamp: string;
}