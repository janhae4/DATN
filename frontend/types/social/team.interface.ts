// types/team.interface.ts
import { TeamStatus, MemberRole } from "../common/enums";

export interface Team {
  id: string; // uuid
  name: string;
  avatar?: string;
  ownerId: string; // uuid
  status: TeamStatus;
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}

export interface TeamMember {
  id: string; // uuid
  teamId: string; // uuid
  userId: string; // uuid
  role: MemberRole;
  isActive: boolean;
  joinedAt: string; // timestamp
}