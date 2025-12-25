// types/video-chat.ts

export enum RefType {
  TASK = 'TASK',
  TEAM = 'TEAM',
  DOC = 'DOC',
  PROJECT = 'PROJECT',
}

export enum CallRole {
  HOST = 'HOST',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  BANNED = 'BANNED',
}

export interface CreateCallPayload {
  userId?: string;
  teamId: string;
  refId?: string;      
  refType?: RefType;    
}

export interface KickUserPayload {
  requesterId: string;  // ID người kick (Host/Admin)
  targetUserId: string; // ID người bị kick
  roomId: string;
}

export interface CallResponse {
  action: 'JOIN' | 'CREATED';
  roomId: string;
  role?: CallRole;
}