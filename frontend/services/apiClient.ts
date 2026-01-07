import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import authService, { logout } from './authService';
import qs from "qs";

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
    await authService.refreshToken();
    return Promise.resolve();
  } catch (err) {
    console.error('Refresh token expired or invalid', err);
    await logout();
    return Promise.reject(err);
  }
};

// --- Cấu hình apiClient CHÍNH ---

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  paramsSerializer: (params) => {
    return qs.stringify(params, { arrayFormat: 'repeat' });
  }, withCredentials: true,
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

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
};

/**
 * Interceptor: Response
 * Xử lý 401 (Token hết hạn)
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
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
        console.log("Refreshing token...");
        console.log("Refresh Token from cookie:", getCookie('refreshToken'));
        await refreshAccessToken();
        processQueue(null);
        return apiClient(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError as AxiosError);
        await logout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const streamHelper = async (
  url: string,
  data: any,
  onChunk: (chunk: string) => void,
): Promise<void> => {

  const baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

  const response = await fetch(` ${baseUrl}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify({
      ...data
    }),
    credentials: 'include',
  });

  if (response.status === 401) {
    await authService.refreshToken();
    return streamHelper(url, data, onChunk);
  }

  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    onChunk(chunk);
  }
};

export default apiClient;