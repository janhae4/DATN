import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, TaskLabel } from "@/types";
import {
  taskService,
  CreateTaskDto,
  UpdateTaskDto,
} from "@/services/taskService";
import { streamHelper } from "@/services/apiClient";

export function useTasks(projectId?: string) {
  const queryClient = useQueryClient();
  const tasksQueryKey = ["tasks", projectId];
  const labelsQueryKey = ["task-labels-project", projectId];

  // 1. Fetch Tasks
  const {
    data: tasks = [],
    isLoading: isLoadingTasks,
    error,
  } = useQuery<Task[]>({
    queryKey: tasksQueryKey,
    queryFn: () => taskService.getTasks(projectId!),
    enabled: !!projectId,
  });

  // 2. Fetch Project Labels
  const {
    data: projectLabels = [],
    isLoading: isLoadingLabels,
  } = useQuery<TaskLabel[]>({
    queryKey: labelsQueryKey,
    queryFn: () => taskService.getAllTaskLabelByProjectId(projectId!),
    enabled: !!projectId,
  });

  // --- MUTATIONS ---

  const suggestTaskByAiMutation = useMutation({
    mutationFn: ({ query, onChunk }: { query: string, onChunk: (chunk: string) => void }) => streamHelper('/tasks/suggest', { query }, onChunk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });

  // Create Task
  const createTaskMutation = useMutation({
    mutationFn: (newTask: CreateTaskDto) => taskService.createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });

  // Update Task
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskDto }) =>
      taskService.updateTask(id, updates),

    // Optimistic Update
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previousTasks = queryClient.getQueryData<Task[]>(tasksQueryKey);

      // Tìm label objects từ projectLabels để đắp vào UI ngay lập tức
      let optimisticLabels: TaskLabel[] | undefined = undefined;
      if (updates.labelIds && projectLabels.length > 0) {
        optimisticLabels = projectLabels.filter((label) =>
          updates.labelIds?.includes(label.id)
        );
      }

      queryClient.setQueryData<Task[]>(tasksQueryKey, (old) => {
        if (!old) return [];
        return old.map((task) =>
          task.id === id
            ? {
              ...task,
              ...updates,
              ...(optimisticLabels ? { labels: optimisticLabels } : {}),
            }
            : task
        );
      });

      return { previousTasks };
    },

    onError: (_err, _newTodo, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(tasksQueryKey, context.previousTasks);
      }
    },

    onSettled: (data, error, variables) => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: tasksQueryKey });
        queryClient.invalidateQueries({ queryKey: labelsQueryKey });
        queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
        queryClient.invalidateQueries({
          queryKey: ["task-labels", variables.id],
        });
      }, 50);
    },
  });

  // Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      queryClient.invalidateQueries({ queryKey: labelsQueryKey });
    },
  });

  return {
    tasks,
    projectLabels,
    isLoading: isLoadingTasks || isLoadingLabels,
    error: error as Error | null,
    createTask: createTaskMutation.mutateAsync,
    suggestTaskByAi: suggestTaskByAiMutation.mutateAsync,
    updateTask: (id: string, updates: UpdateTaskDto) =>
      updateTaskMutation.mutateAsync({ id, updates }),
    deleteTask: deleteTaskMutation.mutateAsync,
  };
}

// --- THÊM ĐOẠN NÀY VÀO CUỐI FILE ---

// Hook lấy chi tiết 1 Task (Dùng cho TaskMetaBox / Modal)
export function useTask(taskId: string | null) {
  const {
    data: task,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => taskService.getTaskById(taskId!),
    enabled: !!taskId,
  });

  return {
    task,
    isLoading,
    error: error as Error | null,
  };
}