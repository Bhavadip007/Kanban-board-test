const ACCESS_TOKEN_KEY = 'kanban_access_token';

export const getAccessToken = (): string | null =>
  sessionStorage.getItem(ACCESS_TOKEN_KEY);

export const setAccessToken = (token: string): void => {
  sessionStorage.setItem(ACCESS_TOKEN_KEY, token);
};

export const clearAccessToken = (): void => {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const generateEventId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const formatDate = (date: string | null): string => {
  if (!date) return '';
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const priorityColors: Record<string, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};
