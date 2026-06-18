import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, setAccessToken, clearAccessToken } from '@/utils';
import { broadcastToken, broadcastLogout } from '@/utils/authChannel';
import { socketService } from './socketService';
import { toast } from '@/store/toastStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

export const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const newToken = data.data.accessToken;
    setAccessToken(newToken);
    socketService.updateAuth();
    broadcastToken(newToken);
    return newToken;
  } catch {
    clearAccessToken();
    return null;
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      window.dispatchEvent(new CustomEvent('auth:logout'));
      broadcastLogout();
      toast.info('Your session expired. Please sign in again.');
    }

    return Promise.reject(error);
  }
);
