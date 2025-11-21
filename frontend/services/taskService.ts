import { db } from "@/public/mock-data/mock-data";
import { Task } from "@/types";

export const taskService = {
  getTasks: async (projectId: string): Promise<Task[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.tasks.filter((t) => t.projectId === projectId);
  },

  getTaskById: async (id: string): Promise<Task | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.tasks.find((t) => t.id === id);
  },

  createTask: async (task: Task): Promise<Task> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    db.tasks.push(task);
    return task;
  },

  updateTask: async (
    id: string,
    updates: Partial<Task>
  ): Promise<Task | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      db.tasks[index] = { ...db.tasks[index], ...updates };
      return db.tasks[index];
    }
    return undefined;
  },

  deleteTask: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.tasks.findIndex((t) => t.id === id);
    if (index !== -1) {
      db.tasks.splice(index, 1);
    }
  },
};
