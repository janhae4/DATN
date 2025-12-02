import { taskService } from "@/services/taskService";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useTaskLabels(taskId: string | null) {
  const {
    data: taskLabels_data = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task-labels", taskId],
    queryFn: () => taskService.getLabelsByTaskId(taskId!),
    enabled: !!taskId,
  });

  return {
    taskLabels_data,
    isLoading,
    error: error as Error | null,
  };
}

export function useDeleteTaskLabel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, labelId }: { taskId: string; labelId: string }) =>
      taskService.deleteLabelFromTask(taskId, labelId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["task-labels", taskId] });
    },
  });
}

