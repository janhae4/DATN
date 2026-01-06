import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "@/types";
import { 
  labelService, 
  CreateLabelDto, 
  UpdateLabelDto,
  GetLabelsDetailsDto 
} from "@/services/labelService";

export function useLabels(projectId: string) {
  const queryClient = useQueryClient();
  const queryKey = ["labels", projectId];

  // 1. Fetch Labels
  const {
    data: labels = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => labelService.getLabels(projectId),
    enabled: !!projectId,
  });

  // 2. Create Label Mutation
  const createLabelMutation = useMutation({
    mutationFn: (newLabel: Omit<CreateLabelDto, "projectId">) => 
      labelService.createLabel({ ...newLabel, projectId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 3. Update Label Mutation
  const updateLabelMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateLabelDto }) =>
      labelService.updateLabel(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 4. Delete Label Mutation
  const deleteLabelMutation = useMutation({
    mutationFn: (id: string) => labelService.deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    labels,
    isLoading,
    error: error as Error | null,

    // Mutations
    createLabel: createLabelMutation.mutateAsync,
    updateLabel: (id: string, updates: UpdateLabelDto) => 
      updateLabelMutation.mutateAsync({ id, updates }),
    deleteLabel: deleteLabelMutation.mutateAsync,

    // NEW: Expose the direct fetch function for label details by IDs
    getLabelsDetailsByIds: labelService.getLabelsDetailsByIds,

    // Loading states
    isCreating: createLabelMutation.isPending,
    isUpdating: updateLabelMutation.isPending,
    isDeleting: deleteLabelMutation.isPending,
  };
}