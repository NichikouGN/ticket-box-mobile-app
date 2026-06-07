import axios, { AxiosAdapter, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { storage } from '@/utils/storage';
import { router } from 'expo-router';
import { handleMockRequest } from '@/constants/mockData';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2/api/v1';
const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

// Custom Mock Adapter to intercept all requests offline if MOCK is enabled
const mockAdapter: AxiosAdapter = async (config) => {
  return new Promise((resolve, reject) => {
    // Delay for 1 second to simulate network latency
    setTimeout(async () => {
      try {
        let parsedData = null;
        if (config.data) {
          if (typeof config.data === 'string') {
            try {
              parsedData = JSON.parse(config.data);
            } catch {
              parsedData = config.data;
            }
          } else {
            parsedData = config.data;
          }
        }

        let relativeUrl = config.url || '';
        if (relativeUrl.startsWith('http://') || relativeUrl.startsWith('https://')) {
          const parts = relativeUrl.split('/');
          relativeUrl = '/' + parts.slice(3).join('/');
        } else {
          if (relativeUrl && !relativeUrl.startsWith('/')) {
            relativeUrl = '/' + relativeUrl;
          }
        }
        
        console.log(`[Mock Adapter] Intercepted: [${(config.method || 'GET').toUpperCase()}] ${config.url} -> Path: ${relativeUrl}`);
        const { status, data } = await handleMockRequest(relativeUrl, config.method || 'GET', parsedData);
        
        if (status >= 200 && status < 300) {
          resolve({
            data,
            status,
            statusText: 'OK',
            headers: config.headers,
            config,
          } as any);
        } else {
          const error = new AxiosError(
            `Request failed with status code ${status}`,
            'ERR_BAD_REQUEST',
            config,
            null,
            {
              data,
              status,
              statusText: 'Bad Request',
              headers: config.headers,
              config,
            } as any
          );
          reject(error);
        }
      } catch (err: any) {
        reject(new Error(`Mock Adapter internal error: ${err.message}`));
      }
    }, 1000);
  });
};

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
  adapter: USE_MOCK ? mockAdapter : undefined,
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
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !USE_MOCK) {
      
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
          accessToken?: string;
          access_token?: string;
          refreshToken?: string;
          refresh_token?: string;
        }>(`${API_URL}/auth/refresh-token`, {
          refreshToken: refreshToken,
        });

        const newAccessToken = response.data.accessToken || response.data.access_token;
        if (response.data && newAccessToken) {
          const newRefreshToken = response.data.refreshToken || response.data.refresh_token || refreshToken;

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
        router.replace('/login');
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
