// services/authService.ts
import apiClient from '@/lib/api/apiClient';
import { LoginCredentials, LoginResponse, UserProfile } from '@/types/auth';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },

  signup: async (userInfo: any) => {
    const { data } = await apiClient.post('/auth/signup', userInfo);
    return data;
  },

  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get('/users/profile'); // Giả sử có endpoint này
    return data;
  },
};