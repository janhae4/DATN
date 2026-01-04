import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Pagination, Task, TaskLabel } from "@/types";
import {
  taskService,
  CreateTaskDto,
  UpdateTaskDto,
  GetTasksParams,
} from "@/services/taskService";
import { streamHelper } from "@/services/apiClient";
import { toast } from "sonner";

export function useTasks(filters?: GetTasksParams) {
  const queryClient = useQueryClient();
  const tasksQueryKey = ["tasks", filters];
  const labelsQueryKey = ["task-labels-project", filters?.projectId];

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingTasks,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: tasksQueryKey,
    queryFn: async ({ pageParam }) => {
      return taskService.getTasks({
        ...filters!,
        page: pageParam as number
      });
    },
    initialPageParam: filters?.page || 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!filters?.projectId,
  });

  const tasks = data?.pages.flatMap((page) => page.data) || [];

  const {
    data: projectLabels = [],
    isLoading: isLoadingLabels,
  } = useQuery<TaskLabel[]>({
    queryKey: labelsQueryKey,
    queryFn: () => taskService.getAllTaskLabelByProjectId(filters?.projectId!),
    enabled: !!filters?.projectId,
  });

  // --- MUTATIONS ---

  const suggestTaskByAiMutation = useMutation({
    mutationFn: ({ data, onChunk }: { data: { query: string; projectId: string; teamId: string, sprintId: string }, onChunk: (chunk: string) => void }) => streamHelper('/tasks/suggest-stream', data, onChunk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });

  // Create Task
  const createTaskMutation = useMutation({
    mutationFn: (newTask: CreateTaskDto) => taskService.createTask(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });

  const createTasksMutation = useMutation({
    mutationFn: ({ tasks, epic, sprintId }: { tasks: CreateTaskDto[], epic: string, sprintId?: string }) =>
      taskService.createTasks(tasks, epic, sprintId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
    onError: (error) => {
      console.error(error);
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateTaskDto }) =>
      taskService.updateTask(id, updates),

    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });

      const previousData = queryClient.getQueryData<Pagination<Task>>(tasksQueryKey);

      let optimisticLabels: TaskLabel[] | undefined = undefined;
      if (updates.labelIds && projectLabels.length > 0) {
        optimisticLabels = projectLabels.filter((label) =>
          updates.labelIds?.includes(label.id)
        );
      }

      queryClient.setQueryData<Pagination<Task>>(tasksQueryKey, (old) => {
        if (!old || !old.data) return old;

        return {
          ...old,
          data: old.data.map((task) =>
            task.id === id
              ? {
                ...task,
                ...updates,
                ...(optimisticLabels ? { labels: optimisticLabels } : {}),
              }
              : task
          ),
        };
      });

      return { previousData };
    },

    onError: (_err, _newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tasksQueryKey, context.previousData);
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

  const updateTasksMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[], updates: UpdateTaskDto }) => taskService.updateTasks(ids, updates),
    onMutate: async ({ ids, updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previousData = queryClient.getQueryData<Pagination<Task>>(tasksQueryKey);

      queryClient.setQueryData<Pagination<Task>>(tasksQueryKey, (old) => {
        if (!old || !old.data) return old!;

        const isMovingSprint = updates.sprintId !== undefined;
        const isMovingEpic = updates.epicId !== undefined;
        if (isMovingSprint || isMovingEpic) {
          return {
            ...old,
            data: old.data.filter((task) => !ids.includes(task.id)),
            total: Math.max(0, old.total - ids.length),
          };
        }

        return {
          ...old,
          data: old.data.map((task) =>
            ids.includes(task.id)
              ? { ...task, ...updates }
              : task
          ),
        };
      });

      return { previousData };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tasksQueryKey, context.previousData);
      }
      toast.error("Failed to move tasks");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => taskService.deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
      queryClient.invalidateQueries({ queryKey: labelsQueryKey });
    },
  });

  const deleteTasksMutation = useMutation({
    mutationFn: (ids: string[]) => taskService.deleteTasks(ids),
    onMutate: async (ids) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previousData = queryClient.getQueryData<Pagination<Task>>(tasksQueryKey);
      queryClient.setQueryData<Pagination<Task>>(tasksQueryKey, (old) => {
        if (!old || !old.data) return old!;

        return {
          ...old,
          data: old.data.filter((task) => !ids.includes(task.id)),
          total: old.total - ids.length
        };
      });

      return { previousData };
    },
    onError: (_err, _ids, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tasksQueryKey, context.previousData);
      }
      toast.error("Failed to delete tasks");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
  return {
    tasks,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,

    total: data?.pages[data.pages.length - 1]?.total,
    totalPages: data?.pages[data.pages.length - 1]?.totalPages || 0,

    isFetching,
    projectLabels,
    isLoading: isLoadingTasks || isLoadingLabels,
    error: error as Error | null,

    createTask: createTaskMutation.mutateAsync,
    createTasks: createTasksMutation.mutateAsync,
    suggestTaskByAi: suggestTaskByAiMutation.mutateAsync,
    updateTask: (id: string, updates: UpdateTaskDto) =>
      updateTaskMutation.mutateAsync({ id, updates }),
    updateTasks: updateTasksMutation.mutateAsync,
    deleteTask: deleteTaskMutation.mutateAsync,
    deleteTasks: deleteTasksMutation.mutateAsync,
  };
}

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