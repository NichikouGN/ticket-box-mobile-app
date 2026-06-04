import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@/utils/storage';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface FailedRequest {
  resolve: (value: unknown) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Inject Access Token and Idempotency Key if applicable
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await storage.getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle automatic token refresh on 401
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if error is 401 Unauthorized and request hasn't been retried yet
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      
      // If we are already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call the backend endpoint to refresh token
        // Use a separate axios instance or configuration to avoid interceptor loop
        const response = await axios.post<{
          success: boolean;
          access_token: string;
          refresh_token?: string;
        }>(`${API_URL}/users/refresh-token`, {
          refresh_token: refreshToken,
        });

        if (response.data && response.data.access_token) {
          const newAccessToken = response.data.access_token;
          // Refresh token might also be rotated
          const newRefreshToken = response.data.refresh_token || refreshToken;

          // Save new tokens securely
          await storage.setAccessToken(newAccessToken);
          await storage.setRefreshToken(newRefreshToken);

          isRefreshing = false;
          processQueue(null, newAccessToken);

          // Retry the original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error('Failed to retrieve access token from refresh response');
        }
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError as AxiosError, null);

        // Refresh token failed or is expired -> force logout
        await storage.clearAuth();
        
        // Redirect to login screen
        router.replace('/(auth)/login');
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
