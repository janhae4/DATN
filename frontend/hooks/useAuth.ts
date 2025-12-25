// hooks/useAuth.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import * as authService from '@/services/authService';
export const useUserProfile = () => {
    return useQuery({
        queryKey: ['userProfile'], // Key để cache data
        queryFn: authService.getMe, 
        retry: false, 
        staleTime: 5 * 60 * 1000, // Dữ liệu được coi là "tươi" trong 5 phút
    });
};

export const useLogin = () => {
    return useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            console.log('Đăng nhập thành công!', data);
        },
        onError: (error) => {
            // Xử lý khi có lỗi
            console.error('Lỗi đăng nhập:', error);
        },
    });
};

