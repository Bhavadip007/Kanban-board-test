export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Assignee {
  _id: string;
  name: string;
  email: string;
}

export interface Card {
  _id: string;
  title: string;
  description: string;
  column: string;
  board: string;
  position: number;
  assignee: Assignee | null;
  dueDate: string | null;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id: string;
  title: string;
  board: string;
  position: number;
  cards: Card[];
}

export interface BoardMember {
  _id: string;
  name: string;
  email: string;
}

export interface Board {
  _id: string;
  title: string;
  description: string;
  owner: string;
  members: string[];
  memberUsers: BoardMember[];
  columns: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardSummary {
  _id: string;
  title: string;
  description: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: { field: string; message: string }[];
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface PresenceUser {
  id: string;
  name: string;
}
