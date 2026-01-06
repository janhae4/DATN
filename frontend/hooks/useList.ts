import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { List } from "@/types";
import { 
  listService, 
  CreateListDto, 
  UpdateListDto 
} from "@/services/listService";

export function useLists(projectId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ["lists", projectId];

  // 1. Fetch Lists
  const {
    data: lists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: () => listService.getLists(projectId!),
    enabled: !!projectId,
  });

  // 2. Create List Mutation
  const createListMutation = useMutation({
    mutationFn: (newList: CreateListDto) => listService.createList(newList),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 3. Update List Mutation
  const updateListMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: UpdateListDto }) =>
      listService.updateList(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 4. Delete List Mutation
  const deleteListMutation = useMutation({
    mutationFn: (id: string) => listService.deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 5. Reorder Lists Mutation (Optimistic Update)
  const reorderListsMutation = useMutation({
    mutationFn: (newLists: List[]) => {
        if(!projectId) throw new Error("Project ID is required");
        return listService.reorderLists(projectId, newLists)
    },
    onMutate: async (newLists) => {
      // Cancel queries đang chạy để tránh conflict
      await queryClient.cancelQueries({ queryKey });

      // Lưu state cũ để rollback nếu lỗi
      const previousLists = queryClient.getQueryData<List[]>(queryKey);

      // Optimistic Update: Cập nhật cache ngay lập tức
      queryClient.setQueryData<List[]>(queryKey, newLists);

      return { previousLists };
    },
    onError: (err, newLists, context) => {
      // Rollback về state cũ nếu lỗi
      if (context?.previousLists) {
        queryClient.setQueryData(queryKey, context.previousLists);
      }
    },
    onSettled: () => {
      // Fetch lại dữ liệu chuẩn từ server sau khi xong (thành công hoặc thất bại)
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    lists,
    isLoading,
    error: error as Error | null,
    
    // Mutations
    createList: createListMutation.mutateAsync,
    updateList: (id: string, updates: UpdateListDto) => 
      updateListMutation.mutateAsync({ id, updates }),
    deleteList: deleteListMutation.mutateAsync,
    reorderLists: reorderListsMutation.mutateAsync, 

    // Loading states
    isCreating: createListMutation.isPending,
    isUpdating: updateListMutation.isPending,
    isDeleting: deleteListMutation.isPending,
    isReordering: reorderListsMutation.isPending,
  };
}