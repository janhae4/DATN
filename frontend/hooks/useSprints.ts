import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sprint, SprintStatus } from "@/types";
import {
  sprintService,
  CreateSprintDto,
  UpdateSprintDto,
} from "@/services/sprintService";
import { toast } from "sonner";

export function useSprints(projectId: string, teamId: string, status?: SprintStatus[]) {
  const queryClient = useQueryClient();
  const queryKey = ['sprints', projectId, teamId, status];

  const {
    data: sprints = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => sprintService.getSprints(projectId!, teamId!, status),
    enabled: !!projectId && !!teamId,
    placeholderData: (prev) => prev,
  });

  const createSprintMutation = useMutation({
    mutationFn: (newSprint: CreateSprintDto) => sprintService.createSprint(newSprint),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      toast.success("Sprint created successfully");
    },
  });

  const updateSprintMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateSprintDto }) =>
      sprintService.updateSprint(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSprints = queryClient.getQueryData<Sprint[]>(queryKey);
      queryClient.setQueryData<Sprint[]>(queryKey, (old) => {
        return old?.map((s) => (s.id === id ? { ...s, ...updates } : s));
      });
      return { previousSprints };
    },

    onError: (err, variables, context) => {
      if (context?.previousSprints) {
        queryClient.setQueryData(queryKey, context.previousSprints);
      }
      toast.error("Failed to update sprint");
    },
    onSettled: (updatedSprint) => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
      if (updatedSprint?.id) {
        queryClient.invalidateQueries({ queryKey: ["sprint", updatedSprint.id] });
      }
    },
  });
  const deleteSprintMutation = useMutation({
    mutationFn: (id: string) => sprintService.deleteSprint(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });
      const previousSprints = queryClient.getQueryData<Sprint[]>(queryKey);

      queryClient.setQueryData<Sprint[]>(queryKey, (old) => {
        return old?.filter((s) => s.id !== id);
      });

      return { previousSprints };
    },
    onError: (err, id, context) => {
      if (context?.previousSprints) {
        queryClient.setQueryData(queryKey, context.previousSprints);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', projectId] });
    },
  });

  return {
    sprints,
    isLoading,
    error: error as Error | null,

    createSprint: createSprintMutation.mutateAsync,
    updateSprint: (id: string, updates: UpdateSprintDto) =>
      updateSprintMutation.mutateAsync({ id, updates }),
    deleteSprint: deleteSprintMutation.mutateAsync,

    isCreating: createSprintMutation.isPending,
    isUpdating: updateSprintMutation.isPending,
    isDeleting: deleteSprintMutation.isPending,
  };
}

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