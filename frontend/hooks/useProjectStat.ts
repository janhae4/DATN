import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/apiClient";
import { List } from "@/types";

export interface ActivityItem {
    date: string;
    tasksCreated: number;
    tasksCompleted: number;
}

export interface ProjectStatsResponse {
    stats: {
        completed: number;
        pending: number;
        overdue: number;
        dueSoon: number;
    };
    distribution: { listId: string; count: string }[];
    lists: List[];
    activity: ActivityItem[];
}

export function useProjectStats(projectId: string) {
    return useQuery<ProjectStatsResponse>({
        queryKey: ["project-stats", projectId],
        queryFn: async () => {
            const res = await apiClient.get(`/project/${projectId}/stat`);
            return res.data;
        },
        enabled: !!projectId,
    });
}