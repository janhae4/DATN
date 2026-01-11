import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { Pagination, Task, TaskLabel } from "@/types";
import {
  taskService,
  CreateTaskDto,
  UpdateTaskDto,
  GetTasksParams,
  GetTasksByTeamParams,
} from "@/services/taskService";
import { streamHelper } from "@/services/apiClient";
import { toast } from "sonner";

type UseTasksFilters = GetTasksParams | GetTasksByTeamParams;

export function useTasks(filters?: UseTasksFilters) {
  const queryClient = useQueryClient();
  const tasksQueryKey = ["tasks", filters];
  const projectId = filters && 'projectId' in filters ? filters.projectId : undefined;
  const teamId = filters && 'teamId' in filters ? filters.teamId : undefined;
  const labelsQueryKey = ["labels", projectId];
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
      const page = pageParam as number;
      console.log("Fetching tasks for page", page, "with filters", filters);
      if (!filters) throw new Error("No filters provided");
      if ('projectId' in filters && filters.projectId) {
        return taskService.getTasks({
          ...filters,
          page,
        });
      }

      if ('teamId' in filters && filters.teamId) {
        return taskService.getTasksByTeam({
          ...filters,
          page,
        });
      }

      throw new Error("Missing projectId or teamId");
    },
    initialPageParam: filters?.page || 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: !!projectId || !!teamId,
  });

  const tasks = data?.pages.flatMap((page) => page.data) || [];

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

      const previousData = queryClient.getQueryData(tasksQueryKey);

      let optimisticLabels: TaskLabel[] | undefined = undefined;
      if (updates.labelIds && projectLabels.length > 0) {
        optimisticLabels = projectLabels.filter((label) =>
          updates.labelIds?.includes(label.id)
        );
      }

      queryClient.setQueryData<any>(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((task: any) =>
              task.id === id
                ? {
                  ...task,
                  ...updates,
                  ...(optimisticLabels ? { labels: optimisticLabels } : {}),
                }
                : task
            ),
          })),
        };
      });

      return { previousData };
    },

    onError: (err, _newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tasksQueryKey, context.previousData);
      }
      toast.error((err as any).response?.data?.message || "Failed to update task");
    },

    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
    },
  });

  const updateTasksMutation = useMutation({
    mutationFn: ({ ids, updates }: { ids: string[], updates: UpdateTaskDto }) => taskService.updateTasks(ids, updates),
    onMutate: async ({ ids, updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previousData = queryClient.getQueryData(tasksQueryKey);

      queryClient.setQueryData<any>(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old!;

        const isMovingSprint = updates.sprintId !== undefined;
        const isMovingEpic = updates.epicId !== undefined;

        return {
          ...old,
          pages: old.pages.map((page: any) => {
            let newData = page.data;
            let newTotal = page.total;

            if (isMovingSprint || isMovingEpic) {
              const matchedTasks = page.data.filter((task: any) => ids.includes(task.id));
              newData = page.data.filter((task: any) => !ids.includes(task.id));
              newTotal = Math.max(0, page.total - matchedTasks.length);
            } else {
              newData = page.data.map((task: any) =>
                ids.includes(task.id)
                  ? { ...task, ...updates }
                  : task
              );
            }

            return {
              ...page,
              data: newData,
              total: newTotal
            };
          })
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
      const previousData = queryClient.getQueryData(tasksQueryKey);
      queryClient.setQueryData<any>(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old!;

        return {
          ...old,
          pages: old.pages.map((page: any) => {
            const matchedTasks = page.data.filter((task: any) => ids.includes(task.id));
            return {
              ...page,
              data: page.data.filter((task: any) => !ids.includes(task.id)),
              total: Math.max(0, page.total - matchedTasks.length)
            };
          })
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