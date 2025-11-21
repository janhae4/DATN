// types/ai_discussion.interface.ts

export interface AiDiscussion {
  id: string; // uuid
  name?: string;
  ownerId: string; // uuid
  teamId?: string; // uuid
  teamSnapshot?: any; // jsonb
  latestMessageId?: string; // uuid
  latestMessageSnapshot?: any; // jsonb
  pinnedMessages?: any; // jsonb
  isDeleted: boolean;
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}

export interface AiMessage {
  id: string; // uuid
  discussionId: string; // uuid
  sender: any; // jsonb
  content: string;
  createdDate?: string; // timestamp
  metadata?: any; // jsonb
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}