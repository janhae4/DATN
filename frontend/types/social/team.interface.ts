// types/team.interface.ts
import { TeamStatus, MemberRole } from "../common/enums";

export interface Team {
  id: string; 
  name: string;
  avatar?: string;
  ownerId: string; 
  status: TeamStatus;
  createdAt: string; 
  updatedAt: string; 
}

export interface TeamMember {
  id: string; 
  teamId: string;
  userId: string; 
  role: MemberRole;
  isActive: boolean;
  joinedAt: string; 
}   