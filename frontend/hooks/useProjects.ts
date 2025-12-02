import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Project } from "@/types";
// Import các DTO từ service đã refactor
import { 
  projectService, 
  CreateProjectDto, 
  UpdateProjectDto 
} from "@/services/projectService";

export function useProjects(teamId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["projects", teamId];

  // 1. Fetch Projects
  const {
    data: projects = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => projectService.getProjects(teamId!),
    enabled: !!teamId, 
  });

  // 2. Create Project
  const createProjectMutation = useMutation({
    mutationFn: (newProject: CreateProjectDto) => projectService.createProject(newProject),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 3. Update Project
  const updateProjectMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateProjectDto }) =>
      projectService.updateProject(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["project"] }); 
    },
  });

  // 4. Delete Project
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
    updateProject: (id: string, updates: UpdateProjectDto) =>
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
