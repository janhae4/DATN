import apiClient from './apiClient';
import { UserProfile } from "@/types/auth";

export const adminService = {
    getAllUsers: async (): Promise<UserProfile[]> => {
        const response = await apiClient.get<UserProfile[]>('/admin/users');
        return response.data;
    },

    createUser: async (data: any): Promise<UserProfile> => {
        const response = await apiClient.post<UserProfile>('/admin/users', data);
        return response.data;
    },

    deleteUser: async (id: string): Promise<void> => {
        await apiClient.delete(`/admin/users/${id}`);
    },

    updateUserSkills: async (id: string, skills: string[]): Promise<UserProfile> => {
        const response = await apiClient.patch<UserProfile>(`/admin/users/${id}/skills`, { skills });
        return response.data;
    },

    updateUser: async (id: string, data: any): Promise<UserProfile> => {
        const response = await apiClient.patch<UserProfile>(`/admin/users/${id}`, data);
        return response.data;
    },

    deleteAccount: async (id: string): Promise<void> => {
        await apiClient.delete(`/admin/users/accounts/${id}`);
    }
};
