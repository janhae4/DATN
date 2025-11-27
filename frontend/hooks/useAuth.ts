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

// Hook để thực hiện đăng nhập (dùng cho POST, PUT, DELETE)
export const useLogin = () => {
    return useMutation({
        mutationFn: authService.login,
        onSuccess: (data) => {
            // Xử lý khi đăng nhập thành công
            console.log('Đăng nhập thành công!', data);
            //   localStorage.setItem('accessToken', data.accessToken);
            // Có thể queryClient.invalidateQueries(['userProfile']) để fetch lại data user
        },
        onError: (error) => {
            // Xử lý khi có lỗi
            console.error('Lỗi đăng nhập:', error);
        },
    });
};