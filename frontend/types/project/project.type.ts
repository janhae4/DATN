// types/project.type.ts
import { ProjectVisibility } from '../common/enums';

export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  icon?: string;
  visibility: ProjectVisibility;
  teamId: string;
  backgroundImageUrl?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}