  import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
  import { Epic } from "@/types";
  import { 
    epicService, 
    CreateEpicDto, 
    UpdateEpicDto 
  } from "@/services/epicService";

  export function useEpics(projectId?: string) {
    const queryClient = useQueryClient();
    const queryKey = ["epics", projectId];

    // 1. Fetch Epics
    const {
      data: epics = [],
      isLoading,
      error,
    } = useQuery({
      queryKey,
      queryFn: () => epicService.getEpics(projectId!), 
      enabled: !!projectId, 
    });

    // 2. Create Epic Mutation
    const createEpicMutation = useMutation({
      mutationFn: (newEpic: CreateEpicDto) => epicService.createEpic(newEpic),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });

    // 3. Update Epic Mutation
    const updateEpicMutation = useMutation({
      mutationFn: ({ id, updates }: { id: string; updates: UpdateEpicDto }) =>
        epicService.updateEpic(id, updates),
      onSuccess: (updatedEpic) => {
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ["epic", updatedEpic.id] });
      },
    });

    // 4. Delete Epic Mutation
    const deleteEpicMutation = useMutation({
      mutationFn: (id: string) => epicService.deleteEpic(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey });
      },
    });

    return {
      epics,
      isLoading,
      error: error as Error | null,
      
      // Mutations
      createEpic: createEpicMutation.mutateAsync,
      updateEpic: (id: string, updates: UpdateEpicDto) => 
        updateEpicMutation.mutateAsync({ id, updates }),
      deleteEpic: deleteEpicMutation.mutateAsync,

      // Loading states
      isCreating: createEpicMutation.isPending,
      isUpdating: updateEpicMutation.isPending,
      isDeleting: deleteEpicMutation.isPending,
    };
  }

  // Hook lấy chi tiết 1 Epic
  export function useEpic(epicId: string | null) {
    const {
      data: epic,
      isLoading,
      error,
    } = useQuery({
      queryKey: ["epic", epicId],
      queryFn: () => epicService.getEpicById(epicId!),
      enabled: !!epicId,
    });

    return {
      epic,
      isLoading,
      error: error as Error | null,
    };
  }