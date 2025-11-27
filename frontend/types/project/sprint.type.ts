// types/sprint.type.ts
import { SprintStatus } from "../common/enums";

export type Sprint = {
  id: string;
  title: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  projectId: string;
  status: SprintStatus;
  createdAt: string;
  updatedAt: string;
};