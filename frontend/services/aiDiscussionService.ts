import { AiDiscussion, AiMessage, Pagination, PaginationMeta } from "@/types";
import apiClient from "./apiClient";

export const aiDiscussionService = {
    getDiscussions: (page: number, limit: number) =>
        apiClient.get<Pagination<AiDiscussion>>('/ai-discussions', {
            params: { page, limit }
        }).then(res => res.data),

    getMessages: (discussionId: string, page: number, limit: number) =>
        apiClient
            .get<{ data: { messages: AiMessage[]; totalMessage: number }; page: number; totalPages: number }>(
                `/ai-discussions/${discussionId}`,
                { params: { page, limit } }
            )
            .then((res) => {
                console.log("Messages List:", res.data.data.messages);
                return res.data;
            }),

    deleteDiscussion: (id: string) =>
        apiClient.delete(`/ai-discussions/${id}`).then(res => res.data),
};