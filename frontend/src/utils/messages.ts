import { AxiosError } from 'axios';
import type { ApiResponse } from '@/types';

export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (!error) return fallback;

  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    const status = error.response?.status;

    if (data?.message) {
      if (data.errors?.length) {
        return data.errors.map((e) => e.message).join('. ');
      }
      return data.message;
    }

    if (!error.response) {
      return 'Unable to reach the server. Check your connection and try again.';
    }

    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return "You don't have permission to do that.";
      case 404:
        return 'The requested item was not found.';
      case 409:
        return 'This already exists. Try a different value.';
      case 429:
        return 'Too many requests. Wait a moment and try again.';
      default:
        return fallback;
    }
  }

  if (error instanceof Error) return error.message;
  return fallback;
};
