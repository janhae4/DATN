import { ListCategoryEnum } from "../common/enums";

export interface List {
  id: string;
  name: string;
  position: number;
  projectId: string;
  limited?: number | null;
  category: ListCategoryEnum;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}