// types/label.interface.ts

export interface Label {
  id: string; // uuid
  name: string;
  color?: string;
  projectId: string; // uuid (Thuộc về project)
  createdAt: string; // timestamp
  updatedAt: string; // timestamp
}