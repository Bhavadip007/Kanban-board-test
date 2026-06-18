import { apiClient } from './apiClient';
import { generateEventId } from '@/utils';
import { socketService } from './socketService';
import type { ApiResponse, Board, BoardSummary, Card, Column } from '@/types';

const withEventId = () => {
  const eventId = generateEventId();
  socketService.registerOwnEvent(eventId);
  return { 'X-Event-Id': eventId };
};

export const boardService = {
  list: async () => {
    const { data } = await apiClient.get<ApiResponse<BoardSummary[]>>('/boards');
    return data.data;
  },

  get: async (id: string) => {
    const { data } = await apiClient.get<ApiResponse<Board>>(`/boards/${id}`);
    return data.data;
  },

  create: async (title: string, description?: string) => {
    const { data } = await apiClient.post<ApiResponse<Board>>('/boards', { title, description });
    return data.data;
  },

  update: async (id: string, payload: { title?: string; description?: string }) => {
    const { data } = await apiClient.patch<ApiResponse<Board>>(`/boards/${id}`, payload);
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/boards/${id}`);
  },
};

export const columnService = {
  create: async (boardId: string, title: string) => {
    const { data } = await apiClient.post<ApiResponse<Column>>(`/boards/${boardId}/columns`, { title }, {
      headers: withEventId(),
    });
    return data.data;
  },

  update: async (id: string, payload: { title?: string; position?: number }) => {
    const { data } = await apiClient.patch<ApiResponse<Column>>(`/columns/${id}`, payload, {
      headers: withEventId(),
    });
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/columns/${id}`, {
      headers: withEventId(),
    });
  },
};

export const cardService = {
  create: async (
    columnId: string,
    payload: {
      title: string;
      description?: string;
      priority?: string;
      dueDate?: string | null;
      position?: number;
    }
  ) => {
    const { data } = await apiClient.post<ApiResponse<Card>>(`/columns/${columnId}/cards`, payload, {
      headers: withEventId(),
    });
    return data.data;
  },

  update: async (
    id: string,
    payload: Partial<{
      title: string;
      description: string;
      priority: string;
      dueDate: string | null;
      position: number;
      assignee: string | null;
    }>
  ) => {
    const { data } = await apiClient.patch<ApiResponse<Card>>(`/cards/${id}`, payload, {
      headers: withEventId(),
    });
    return data.data;
  },

  move: async (id: string, columnId: string, position: number) => {
    const { data } = await apiClient.post<ApiResponse<Card>>(
      `/cards/${id}/move`,
      { columnId, position },
      { headers: withEventId() }
    );
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/cards/${id}`, {
      headers: withEventId(),
    });
  },
};
