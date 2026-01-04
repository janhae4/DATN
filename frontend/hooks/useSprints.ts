import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sprint } from "@/types";
import {
  sprintService,
  CreateSprintDto,
  UpdateSprintDto,
} from "@/services/sprintService";

export function useSprints(projectId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["sprints", projectId];

  const {
    data: sprints = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => sprintService.getSprints(projectId!),
    // Chỉ fetch khi có projectId
    enabled: !!projectId, 
  });

  // 2. Create Sprint Mutation
  const createSprintMutation = useMutation({
    mutationFn: (newSprint: CreateSprintDto) => sprintService.createSprint(newSprint),
    onSuccess: () => {
      // Invalidate để load lại danh sách mới
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 3. Update Sprint Mutation
  const updateSprintMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSprintDto }) =>
      sprintService.updateSprint(id, updates),
    onSuccess: (updatedSprint) => {
      queryClient.invalidateQueries({ queryKey });
      if (updatedSprint?.id) {
         queryClient.invalidateQueries({ queryKey: ["sprint", updatedSprint.id] });
      }
    },
  });

  // 4. Delete Sprint Mutation
  const deleteSprintMutation = useMutation({
    mutationFn: (id: string) => sprintService.deleteSprint(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    sprints,
    isLoading,
    error: error as Error | null,

    // Actions
    createSprint: createSprintMutation.mutateAsync,
    updateSprint: (id: string, updates: UpdateSprintDto) =>
      updateSprintMutation.mutateAsync({ id, updates }),
    deleteSprint: deleteSprintMutation.mutateAsync,

    // Loading states (Hữu ích để hiện spinner khi đang submit)
    isCreating: createSprintMutation.isPending,
    isUpdating: updateSprintMutation.isPending,
    isDeleting: deleteSprintMutation.isPending,
  };
}

// Hook lấy chi tiết 1 Sprint (Optional - Nếu cần dùng)
export function useSprint(sprintId: string | null) {
  const {
    data: sprint,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sprint", sprintId],
    queryFn: () => sprintService.getSprintById(sprintId!),
    enabled: !!sprintId,
  });

  return {
    sprint,
    isLoading,
    error: error as Error | null,
  };
}