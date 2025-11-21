import { db } from "@/public/mock-data/mock-data";
import { Project } from "@/types";

export const projectService = {
  getProjects: async (teamId?: string): Promise<Project[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (teamId) {
      return db.projects.filter((p) => p.teamId === teamId);
    }
    return db.projects;
  },

  getProjectById: async (id: string): Promise<Project | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return db.projects.find((p) => p.id === id);
  },

  createProject: async (project: Project): Promise<Project> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    db.projects.push(project);
    return project;
  },

  updateProject: async (
    id: string,
    updates: Partial<Project>
  ): Promise<Project | undefined> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      db.projects[index] = { ...db.projects[index], ...updates };
      return db.projects[index];
    }
    return undefined;
  },

  deleteProject: async (id: string): Promise<void> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const index = db.projects.findIndex((p) => p.id === id);
    if (index !== -1) {
      db.projects.splice(index, 1);
    }
  },
};
