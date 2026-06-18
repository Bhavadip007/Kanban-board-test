import axios from 'axios';
import { apiClient } from './apiClient';
import type { ApiResponse, AuthResponse, User } from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050/api/v1';

export const authService = {
  register: async (name: string, email: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', {
      name,
      email,
      password,
    });
    return data.data;
  },

  login: async (email: string, password: string) => {
    const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return data.data;
  },

  refresh: async () => {
    const { data } = await axios.post<ApiResponse<AuthResponse>>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    return data.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },

  me: async () => {
    const { data } = await apiClient.get<ApiResponse<User>>('/auth/me');
    return data.data;
  },
};
