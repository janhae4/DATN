import apiClient from './apiClient';

export interface Notification {
    id: string;
    userId: string;
    message: string;
    title: string;
    isRead: boolean;
    link: string | null;
    type: 'SUCCESS' | 'FAILED' | 'INFO' | 'WARNING' | 'PENDING';
    createdAt: string;
    readAt: string | null;
    metadata: Record<string, any> | null;
}

export const notificationService = {
    getAll: async () => {
        const response = await apiClient.get<Notification[]>('/notifications');
        return response.data;
    },

    markAllAsRead: async () => {
        const response = await apiClient.post<{ message: string }>('/notifications/read-all');
        return response.data;
    },

    markAsRead: async (id: string) => {
        const response = await apiClient.patch<{ message: string }>(`/notifications/${id}/read`);
        return response.data;
    },

    markAsUnread: async (id: string) => {
        const response = await apiClient.patch<{ message: string }>(`/notifications/${id}/unread`);
        return response.data;
    },

    delete: async (id: string) => {
        const response = await apiClient.delete<{ message: string }>(`/notifications/${id}`);
        return response.data;
    }
};
