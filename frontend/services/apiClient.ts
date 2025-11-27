import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { logout } from './authService';

let isRefreshing = false;
let failedQueue: { resolve: (value?: unknown) => void; reject: (reason?: any) => void }[] = [];

/**
 * Xử lý tất cả request trong hàng đợi
 * @param error Lỗi (nếu refresh fail)
 */
const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });

  failedQueue = [];
};



/**
 * HÀM REFRESH TOKEN
 * Gọi khi 401
 */
const refreshAccessToken = async () => {
  try {
    const refreshAxios = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      withCredentials: true,
    });

    await refreshAxios.post('/auth/refresh');

    return Promise.resolve();

  } catch (err) {
    console.error('Could not refresh token (Refresh token expired or invalid)', err);
    await logout();
    return Promise.reject(err);
  }
};

// --- Cấu hình apiClient CHÍNH ---

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

/**
 * Interceptor: Request
 * Trình duyệt tự đính kèm cookie vào request.
 */
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


/**
 * Interceptor: Response
 * Xử lý 401 (Token hết hạn)
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest.url !== '/auth/me') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshAccessToken();

        processQueue(null);

        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;