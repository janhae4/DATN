import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { videoChatService } from "@/services/videoChatService";
import { taskService, CreateTaskDto } from "@/services/taskService";
import { listService } from "@/services/listService";
import { projectService } from "@/services/projectService";
import { toast } from "sonner";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import { streamHelper } from "@/services/apiClient";

export function useCall(callId: string) {
    const queryClient = useQueryClient();
    const { teamId } = useParams();

    // 1. Basic Call Info
    const callInfoQuery = useQuery({
        queryKey: ["call", callId],
        queryFn: () => videoChatService.getCallInfo(callId),
        enabled: !!callId,
    });

    // 2. Action Items (Paginated)
    const actionItemsQuery = useInfiniteQuery({
        queryKey: ["call", callId, "action-items"],
        queryFn: ({ pageParam = 1 }) => videoChatService.getActionItems(callId, pageParam as number, 10),
        getNextPageParam: (lastPage) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.limit);
            if (lastPage.page < totalPages) return lastPage.page + 1;
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!callId,
    });

    // 3. Transcripts (Paginated)
    const transcriptsQuery = useInfiniteQuery({
        queryKey: ["call", callId, "transcripts"],
        queryFn: ({ pageParam = 1 }) => videoChatService.getTranscripts(callId, pageParam as number, 20),
        getNextPageParam: (lastPage) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.limit);
            if (lastPage.page < totalPages) return lastPage.page + 1;
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!callId,
    });

    // 4. Recordings (Paginated)
    const recordingsQuery = useInfiniteQuery({
        queryKey: ["call", callId, "recordings"],
        queryFn: ({ pageParam = 1 }) => videoChatService.getRecordings(callId, pageParam as number, 10),
        getNextPageParam: (lastPage) => {
            const totalPages = Math.ceil(lastPage.total / lastPage.limit);
            if (lastPage.page < totalPages) return lastPage.page + 1;
            return undefined;
        },
        initialPageParam: 1,
        enabled: !!callId,
    });

    // Mutations
    const updateActionItemMutation = useMutation({
        mutationFn: ({ itemId, data }: { itemId: string; data: any }) =>
            videoChatService.updateActionItem(itemId, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["call", callId, "action-items"] });
        },
        onError: () => toast.error("Failed to update action item"),
    });

    const deleteActionItemMutation = useMutation({
        mutationFn: (itemId: string) => videoChatService.deleteActionItem(itemId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["call", callId, "action-items"] });
            toast.success("Action item removed");
        },
        onError: () => toast.error("Failed to remove action item"),
    });

    const createTasksMutation = useMutation({
        mutationFn: ({ tasks, epic, sprintId }: { tasks: CreateTaskDto[], epic: string, sprintId?: string }) =>
            taskService.createTasks(tasks, epic, sprintId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
            toast.success("Tasks created successfully");
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.message || "Failed to create tasks");
        }
    });

    const suggestTaskByAiMutation = useMutation({
        mutationFn: ({ data, onChunk }: { data: { query: string; projectId: string; teamId: string, sprintId: string }, onChunk: (chunk: string) => void }) =>
            streamHelper('/tasks/suggest-stream', data, onChunk),
    });

    const acceptActionItemMutation = useMutation({
        mutationFn: async ({ item }: { item: any }) => {
            const call = callInfoQuery.data;
            if (!call) throw new Error("Call data not found");

            let projectId = call.refType === 'PROJECT' ? call.refId : null;
            if (!projectId) {
                const projects = await projectService.getProjects(teamId as string);
                if (projects && projects.length > 0) projectId = projects[0].id;
            }

            if (!projectId) throw new Error("No project found to add task to");

            const lists = await listService.getLists(projectId);
            if (!lists || lists.length === 0) throw new Error("No lists found in project");
            const listId = lists[0].id;

            const [createdTask] = await Promise.all([
                taskService.createTask({
                    title: item.content,
                    description: `Created from meeting room ${call.roomId} on ${format(new Date(call.createdAt), "MMM d, yyyy")}`,
                    projectId: projectId,
                    listId: listId,
                    teamId: teamId as string,
                    assigneeIds: item.assigneeId ? [item.assigneeId] : [],
                    startDate: item.startDate,
                    dueDate: item.endDate,
                }),
                videoChatService.updateActionItem(item.id, { status: 'ACCEPTED' })
            ]);

            return createdTask;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["call", callId, "action-items"] });
            toast.success("Task added to backlog");
        },
        onError: (error: any) => {
            console.error(error);
            toast.error(error.message || "Failed to add task to backlog");
        }
    });

    return {
        call: callInfoQuery.data,
        isLoading: callInfoQuery.isLoading,
        isError: callInfoQuery.isError,

        actionItems: actionItemsQuery.data?.pages.flatMap(page => page.data) || [],
        isLoadingActionItems: actionItemsQuery.isLoading,
        hasNextActionItems: actionItemsQuery.hasNextPage,
        fetchNextActionItems: actionItemsQuery.fetchNextPage,

        transcripts: transcriptsQuery.data?.pages.flatMap(page => page.data) || [],
        isLoadingTranscripts: transcriptsQuery.isLoading,
        hasNextTranscripts: transcriptsQuery.hasNextPage,
        fetchNextTranscripts: transcriptsQuery.fetchNextPage,

        recordings: recordingsQuery.data?.pages.flatMap(page => page.data) || [],
        isLoadingRecordings: recordingsQuery.isLoading,
        hasNextRecordings: recordingsQuery.hasNextPage,
        fetchNextRecordings: recordingsQuery.fetchNextPage,

        updateActionItem: updateActionItemMutation.mutateAsync,
        deleteActionItem: deleteActionItemMutation.mutateAsync,
        acceptActionItem: acceptActionItemMutation.mutateAsync,
        createTasks: createTasksMutation.mutateAsync,
        suggestTaskByAi: suggestTaskByAiMutation.mutateAsync,
    };
}
