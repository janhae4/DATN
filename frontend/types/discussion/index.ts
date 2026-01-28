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
  url?: string;
  fileName?: string;
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
  createdAt: Date;
  reactions?: ReactionDto[];
}

// Channel & Category DTOs
export interface CreateChannelDto {
  teamId: string;
  name: string;
  type: DiscussionType;
  parentId?: string;
  ownerId: string;
}

export interface CreateCategoryDto {
  teamId: string;
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
  senderId: string;
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
  teamSnapshot: any; 
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

export interface ResponseMessageDto {
  data: MessageSnapshot[];
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