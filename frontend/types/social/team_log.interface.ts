// types/team_log.interface.ts
import { TeamAction } from "../common/enums";

export interface TeamLog {
  id: string; // uuid
  teamId: string; // uuid
  userId?: string; // uuid
  projectId?: string; // uuid
  action: TeamAction;
  description?: string;
  metadata?: any; // jsonb
  createdAt: string; // timestamp
}