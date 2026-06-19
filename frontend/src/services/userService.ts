import { apiClient } from './apiClient';
import type { ApiResponse, AssignableUser } from '@/types';

export const userService = {
  listAssignable: async () => {
    const { data } = await apiClient.get<ApiResponse<AssignableUser[]>>('/users');
    return data.data;
  },
};
