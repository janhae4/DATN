import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";
import { projectService } from "@/services/projectService";

export function useProjects(teamId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["projects", teamId];

  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => projectService.getProjects(teamId),
    enabled: !!teamId,
  });

  const createProjectMutation = useMutation({
    mutationFn: (project: Project) => projectService.createProject(project),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Project> }) =>
      projectService.updateProject(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    projects,
    isLoading,
    error: error as Error | null,
    createProject: createProjectMutation.mutateAsync,
    updateProject: (id: string, updates: Partial<Project>) =>
      updateProjectMutation.mutateAsync({ id, updates }),
    deleteProject: deleteProjectMutation.mutateAsync,
  };
}

export function useProject(projectId: string) {
  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectService.getProjectById(projectId),
    enabled: !!projectId,
  });

  return {
    project: project || null,
    isLoading,
    error: error as Error | null,
  };
}
