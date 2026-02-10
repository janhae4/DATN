import { MemberRole } from '../common';

// Enums
export enum DiscussionType {
  DIRECT = 'DIRECT',
  TEXT = 'TEXT',
  VOICE = 'VOICE',
  CATEGORY = 'CATEGORY'
}

export enum MemberShip {
  ACTIVE = 'ACTIVE',
  LEFT = 'LEFT'
}

// Base Types
export interface AttachmentDto {
  type: 'image' | 'file' | 'video';
  name?: string;
  url: string;
  fileName: string;
  size?: number;
}

export interface SenderSnapshotDto {
  _id: string;
  name: string;
  avatar?: string;
  status: MemberShip;
}

export interface ParticipantDto {
  _id: string;
  name: string;
  avatar?: string;
  role: MemberRole;
  status: MemberShip;
}

export interface ReactionDto {
  emoji: string;
  userIds: string[];
}

export interface MessageSnapshot {
  _id: string;
  content: string;
  attachments?: AttachmentDto[];
  sender: SenderSnapshotDto;
  createdAt: string | Date;
  updatedAt?: string | Date;
  isDeleted?: boolean;
  reactions?: ReactionDto[];
  replyTo?: {
    messageId: string;
    content: string;
    senderName: string;
    attachments?: AttachmentDto[];
  };
}

// Channel & Category DTOs
export interface CreateChannelDto {
  teamId: string;
  serverId?: string;
  name: string;
  type: DiscussionType;
  parentId?: string;
  ownerId: string;
}

export interface CreateCategoryDto {
  teamId: string;
  serverId?: string;
  name: string;
  ownerId: string;
}

export interface UpdateChannelDto {
  id: string;
  name?: string;
  parentId?: string;
  position?: number;
  isDeleted?: boolean;
}

export interface ReorderChannelsDto {
  teamId: string;
  orders: { id: string; position: number; parentId?: string }[];
}

// Discussion DTOs
export interface CreateDirectDiscussionDto {
  partnerId: string;
}

export interface CreateChatDto {
  participants: ParticipantDto[];
  name?: string;
}

// Message DTOs
export interface CreateMessageDto {
  discussionId: string;
  userId: string;
  content?: string;
  teamId?: string;
  replyToId?: string;
  attachments?: AttachmentDto[];
}

export interface SendMessageEventPayload {
  _id: string;
  discussionId: string;
  messageSnapshot: MessageSnapshot;
  teamSnapshot: {
    id: string;
    name: string;
    avatar?: string;
  };
  participantIds?: string[];
  membersToNotify?: string[];
}

export interface ToggleReactionDto {
  messageId: string;
  emoji: string;
  userId: string;
}

// Response DTOs
export interface GetMessagesDto {
  page?: number;
  limit?: number;
  before?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ResponseMessageDto extends PaginatedResponse<MessageSnapshot> {
  nextCursor?: string;
  hasMore?: boolean;
}

// System constants
export const SENDER_SNAPSHOT_SYSTEM: SenderSnapshotDto = {
  _id: 'SYSTEM_ID',
  name: 'System',
  avatar: '',
  status: MemberShip.ACTIVE
};



export interface CreateServerDto {
  name: string;
  avatar?: string;
  teamId: string;
}

export interface ServerDto {
  id: string;
  _id?: string;
  name: string;
  avatar?: string;
  teamId: string;
  ownerId: string;
  isDeleted?: boolean;
}

export interface DiscussionDto {
  id: string;
  _id?: string;
  name: string;
  type: DiscussionType;
  serverId?: string;
  teamId: string;
  parentId?: string;
  position: number;
  isDeleted?: boolean;
}

export interface ServerMemberDto {
  userId: string;
  role: string;
  joinedAt: string;
  name: string;
  avatar?: string;
}