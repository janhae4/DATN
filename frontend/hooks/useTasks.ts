import { useMemo } from "react";
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


  const tasks = useMemo(() => {
    const all = data?.pages.flatMap((page) => page.data) || [];
    const uniqueMap = new Map();
    for (const t of all) {
      uniqueMap.set(t.id, t); // Last one wins (or first? Map preserves insertion order of keys, but set overwrites value)
    }
    return Array.from(uniqueMap.values());
  }, [data]);

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

      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((task: Task) =>
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

    onSuccess: (updatedTask, variables) => {
      // Direct cache update with server response to prevent stale read flicker
      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.map((task: Task) =>
              task.id === updatedTask.id ? updatedTask : task
            ),
          })),
        };
      });

      // Still invalidate related queries, but maybe specific ones or with longer delay if really needed
      // But for main list, the setQueryData above handles authoritativeness.
      queryClient.invalidateQueries({ queryKey: ["task", variables.id] });
      queryClient.invalidateQueries({
        queryKey: ["task-labels", variables.id],
      });
      // Do NOT invalidate tasksQueryKey immediately to avoid A->B->A->B flicker
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(tasksQueryKey, context.previousData);
      }
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

      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old;

        const isMovingSprint = updates.sprintId !== undefined;
        const isMovingEpic = updates.epicId !== undefined;

        return {
          ...old,
          pages: old.pages.map((page: any) => {
            if (isMovingSprint || isMovingEpic) {
              return {
                ...page,
                data: page.data.filter((task: Task) => !ids.includes(task.id)),
                total: Math.max(0, (page.total || 0) - ids.length),
              };
            }
            return {
              ...page,
              data: page.data.map((task: Task) =>
                ids.includes(task.id) ? { ...task, ...updates } : task
              ),
            };
          }),
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
      queryClient.setQueryData(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old!;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((task: Task) => !ids.includes(task.id)),
            total: (page.total || 0) - ids.length,
          })),
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
    isLoading: isLoadingTasks || (!!projectId && isLoadingLabels),
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

export interface UseUserTasksProps {
  userId?: string;
  teamId: string;
  page?: number;
  limit?: number;
}

export function useUserTasks({ userId, teamId, page = 1, limit = 10 }: UseUserTasksProps) {
  return useQuery({
    queryKey: ["user-tasks", teamId, userId, page, limit],
    queryFn: async () => {
      if (!userId || !teamId) return { data: [], total: 0, totalPages: 0, page: 1, limit };
      return taskService.getTasksByTeam({
        teamId,
        assigneeIds: [userId],
        page,
        limit,
        sortBy: ["dueDate"],
        sortOrder: "ASC"
      });
    },
    enabled: !!userId && !!teamId,
    placeholderData: keepPreviousData,
  });
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