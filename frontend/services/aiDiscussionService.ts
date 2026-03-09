import { AiDiscussion, AiMessage, Pagination, PaginationMeta } from "@/types";
import apiClient from "./apiClient";

export interface AiFileUploadResult {
    status: 'processing' | 'error';
    fileId?: string;
    fileName?: string;
    originalName: string;
    message?: string;
}

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

    uploadAiFiles: (files: File[], teamId?: string): Promise<AiFileUploadResult[]> => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        return apiClient.post<AiFileUploadResult[]>(
            '/ai-discussions/files',
            formData,
            {
                headers: { 'Content-Type': 'multipart/form-data' },
                params: teamId ? { teamId } : undefined,
            }
        ).then(res => res.data);
    },
};