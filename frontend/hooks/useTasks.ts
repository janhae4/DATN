import { useQuery, useMutation, useQueryClient, keepPreviousData, useInfiniteQuery, UseInfiniteQueryOptions, InfiniteData } from "@tanstack/react-query";
import { Pagination, Task, TaskLabel } from "@/types";
import {
  taskService,
  CreateTaskDto,
  UpdateTaskDto,
  BaseTaskFilterDto,
} from "@/services/taskService";
import { streamHelper } from "@/services/apiClient";
import { toast } from "sonner";

type UseTasksOptions = Omit<
  UseInfiniteQueryOptions<
    Pagination<Task>,
    unknown,
    InfiniteData<Pagination<Task>>,
    unknown[],
    any
  >,
  "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"
>;

export function useTasks(
  filters?: BaseTaskFilterDto,
  options?: UseTasksOptions
) {
  const queryClient = useQueryClient();

  const tasksQueryKey = ["tasks", filters];
  const projectId = filters?.projectId;
  const teamId = filters?.teamId;
  const labelsQueryKey = ["labels", projectId || teamId];

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
      if (!filters) throw new Error("No filters provided");
      return await taskService.getTasks({
        ...filters,
        page,
      });
    },
    initialPageParam: filters?.page || 1,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    enabled: (!!projectId || !!teamId) && (options?.enabled !== false),
    ...options,
  });

  const tasks = data?.pages.flatMap((page: Pagination<Task>) => page.data) || [];

  const {
    data: projectLabels = [],
    isLoading: isLoadingLabels,
  } = useQuery<TaskLabel[]>({
    queryKey: labelsQueryKey,
    queryFn: () => taskService.getAllTaskLabelByProjectId(projectId!, teamId!),
    enabled: !!projectId || !!teamId,
  });

  const suggestTaskByAiMutation = useMutation({
    mutationFn: ({ data, onChunk }: { data: { query: string; projectId: string; teamId: string, sprintId: string }, onChunk: (chunk: string) => void }) => streamHelper('/tasks/suggest-stream', data, onChunk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksQueryKey });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (newTask: CreateTaskDto) => taskService.createTask(newTask),
    onSuccess: (data, variables) => {
      queryClient.setQueriesData<InfiniteData<Pagination<Task>>>(
        {
          queryKey: ["tasks"],
          predicate: (query) => {
            const filters = query.queryKey[1] as any;
            if (variables.sprintId) {
              return filters?.sprintId?.includes(variables.sprintId);
            }
            return !filters?.sprintId || filters.sprintId === "null";
          }
        },
        (oldData) => {
          if (!oldData || !oldData.pages) return oldData;
          const newPages = [...oldData.pages];
          const lastPageIndex = newPages.length - 1;
          const lastPage = { ...newPages[lastPageIndex] };
          lastPage.data = [...lastPage.data, data];
          lastPage.total = (lastPage.total || 0) + 1;
          newPages[lastPageIndex] = lastPage;
          return {
            ...oldData,
            pages: newPages,
          };
        }
      );
      toast.success("Task created");
    },
    onError: (error) => {
      toast.error("Failed to create task");
      console.error(error);
    }
  });

  const createTasksMutation = useMutation({
    mutationFn: ({ tasks, epic, sprintId }: { tasks: CreateTaskDto[], epic: string, sprintId?: string }) =>
      taskService.createTasks(tasks, epic, sprintId),

    onSuccess: (data, variables) => {
      if (variables.sprintId) {
        console.log("Refreshing specific Sprint...");
        queryClient.invalidateQueries({
          queryKey: ["tasks", { teamId, projectId, sprintId: [variables.sprintId] }]
        });
      } else {
        console.log("Refreshing Backlog...");
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey as any[];
            return key[0] === 'tasks' && key[1]?.sprintId === "null";
          }
        });
      }
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
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
    mutationFn: ({ ids, updates }: { ids: string[], updates: UpdateTaskDto }) => taskService.updateTasks(ids, updates, teamId!),
    onMutate: async ({ ids, updates }) => {
      await queryClient.cancelQueries({ queryKey: tasksQueryKey });
      const previousData = queryClient.getQueryData(tasksQueryKey);

      queryClient.setQueryData<any>(tasksQueryKey, (old: any) => {
        if (!old || !old.pages) return old!;

        const isMovingSprint = updates.sprintId !== undefined;
        const isMovingEpic = updates.epicId !== undefined

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

    onSuccess: (updatedTasks, variables: any) => {
      // const isMovingToSprint = variables.updates.sprintId !== undefined;
      // const isMovingToBacklog = variables.updates.sprintId === null;

      // if (isMovingToSprint || isMovingToBacklog) {
      //   queryClient.invalidateQueries({
      //     predicate: (query) => {
      //       const key = query.queryKey as any[];
      //       return key[0] === 'tasks' &&
      //         key[1]?.teamId === teamId &&
      //         (key[1]?.sprintId === "null" || key[1]?.sprintId === null);
      //     }
      //   });

      //   if (variables.updates.sprintId) {
      //     queryClient.invalidateQueries({
      //       queryKey: ["tasks", { teamId, sprintId: [variables.updates.sprintId] }]
      //     })
      //   }
      // }
      toast.success("Tasks moved successfully");
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
        refetchType: 'none'
      });
    }
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
    mutationFn: (ids: string[]) => taskService.deleteTasks(ids, teamId!),
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