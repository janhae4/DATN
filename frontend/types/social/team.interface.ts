// types/team.interface.ts
import { User, UserSkill } from "../auth";
import { TeamStatus, MemberRole } from "../common/enums";

export interface Team {
  description: string;
  members: any;
  id: string;
  name: string;
  avatar?: string;
  ownerId: string;
  status: TeamStatus;
  createdAt: string;
  updatedAt: string;
}

export enum MemberStatus {
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  PENDING = 'PENDING',
  BANNED = 'BANNED',
  UNBANNED = 'UNBANNED',
  LEAVED = 'LEAVED',
  REMOVED = 'REMOVED'
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: MemberRole;
  isActive: boolean;
  joinedAt: string;
  cachedUser: User;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  email: string;
  bio: string;
  role: MemberRole;
  skills: UserSkill;
  joinedAt: string;
  teamId: string;
  isActive: boolean;
  status: MemberStatus;
}