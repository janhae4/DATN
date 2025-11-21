import { db } from "@/public/mock-data/mock-data";
import { Epic } from "@/types";

export const epicService = {
  getEpics: async (projectId?: string): Promise<Epic[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Since Epic type doesn't have projectId, we return all for now
    // or we could filter if we had a way to link them.
    return db.epics;
  },

  getEpicById: async (id: string): Promise<Epic | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.epics.find((e) => e.id === id);
  },

  createEpic: async (epic: Epic): Promise<Epic> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    db.epics.push(epic);
    return epic;
  },

  updateEpic: async (
    id: string,
    updates: Partial<Epic>
  ): Promise<Epic | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.epics.findIndex((e) => e.id === id);
    if (index !== -1) {
      db.epics[index] = { ...db.epics[index], ...updates };
      return db.epics[index];
    }
    return undefined;
  },

  deleteEpic: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.epics.findIndex((e) => e.id === id);
    if (index !== -1) {
      db.epics.splice(index, 1);
    }
  },
};
