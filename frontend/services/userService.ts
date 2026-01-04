import apiClient from './apiClient';
import { User, UserProfile } from "@/types/auth";

export interface SearchUsersParams {
    query: string;
    page?: number;
    limit?: number;
    teamId?: string;
}

export const userService = {
    searchUsers: async (params: SearchUsersParams): Promise<UserProfile[]> => {
        const response = await apiClient.get<{ data: UserProfile[], hasNextPage: boolean }>('/user/search', { params });
        console.log('Search Users Response:', response.data);
        return response.data.data;
    },

    getUser: async (id: string): Promise<UserProfile> => {
        const response = await apiClient.get<UserProfile>(`/user/${id}`);
        return response.data;
    },

    followUser: async (id: string): Promise<void> => {
        await apiClient.post(`/user/${id}/follow`);
    },

    unfollowUser: async (id: string): Promise<void> => {
        await apiClient.delete(`/user/${id}/follow`);
    }
};
