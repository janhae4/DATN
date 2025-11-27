// types/call.interface.ts
import { CallType } from "../common/enums";

export interface Call {
  id: string; // uuid
  roomId: string;
  type: CallType;
  teamId?: string; // uuid
  startedById: string; // uuid
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
  endedAt?: string; // timestamp
}

export interface CallParticipant {
  id: string; // uuid
  callId: string; // uuid
  userId: string; // uuid
  joinedAt: string; // timestamp
  leftAt?: string; // timestamp
}