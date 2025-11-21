import { useState, useEffect, useCallback } from "react";
import { Project } from "@/types";
import { projectService } from "@/services/projectService";

export function useProjects(teamId?: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getProjects(teamId);
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (project: Project) => {
    try {
      const newProject = await projectService.createProject(project);
      setProjects((prev) => [...prev, newProject]);
      return newProject;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const updatedProject = await projectService.updateProject(id, updates);
      if (updatedProject) {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? updatedProject : p))
        );
      }
      return updatedProject;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await projectService.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const data = await projectService.getProjectById(projectId);
      setProject(data || null);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    isLoading,
    error,
    fetchProject,
  };
}
