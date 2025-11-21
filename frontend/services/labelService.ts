import { db } from "@/public/mock-data/mock-data";
import { Label } from "@/types";

export const labelService = {
  getLabels: async (): Promise<Label[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.labels;
  },

  getLabelById: async (id: string): Promise<Label | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.labels.find((l) => l.id === id);
  },

  createLabel: async (label: Label): Promise<Label> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    db.labels.push(label);
    return label;
  },

  updateLabel: async (
    id: string,
    updates: Partial<Label>
  ): Promise<Label | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.labels.findIndex((l) => l.id === id);
    if (index !== -1) {
      db.labels[index] = { ...db.labels[index], ...updates };
      return db.labels[index];
    }
    return undefined;
  },

  deleteLabel: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.labels.findIndex((l) => l.id === id);
    if (index !== -1) {
      db.labels.splice(index, 1);
    }
  },
};
