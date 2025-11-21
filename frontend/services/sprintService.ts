import { db } from "@/public/mock-data/mock-data";
import { Sprint } from "@/types";

export const sprintService = {
  getSprints: async (projectId: string): Promise<Sprint[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.sprints.filter((s) => s.projectId === projectId);
  },

  getSprintById: async (id: string): Promise<Sprint | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.sprints.find((s) => s.id === id);
  },

  createSprint: async (sprint: Sprint): Promise<Sprint> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    db.sprints.push(sprint);
    return sprint;
  },

  updateSprint: async (
    id: string,
    updates: Partial<Sprint>
  ): Promise<Sprint | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.sprints.findIndex((s) => s.id === id);
    if (index !== -1) {
      db.sprints[index] = { ...db.sprints[index], ...updates };
      return db.sprints[index];
    }
    return undefined;
  },

  deleteSprint: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.sprints.findIndex((s) => s.id === id);
    if (index !== -1) {
      db.sprints.splice(index, 1);
    }
  },
};
