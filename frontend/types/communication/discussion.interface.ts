// types/discussion.interface.ts

export interface Discussion {
  id: string; // uuid
  name?: string;
  ownerId: string; // uuid
  teamId?: string; // uuid
  teamSnapshot?: any; // jsonb
  isGroup: boolean;
  participants?: any; // jsonb
  groupAdminIds?: any; // jsonb
  latestMessageId?: string; // uuid
  latestMessageSnapshot?: any; // jsonb
  pinnedMessages?: any; // jsonb
  isDeleted: boolean;
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}

export interface Message {
  id: string; // uuid
  sender: any; // jsonb (nên định nghĩa rõ User snapshot)
  content: string;
  discussionId: string; // uuid
  readByIds?: any; // jsonb
  attachments?: any; // jsonb
  reactions?: any; // jsonb
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}