import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@/utils';
import type { Card, Column, PresenceUser, Board } from '@/types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5050';

type CardCreateHandler = (data: { card: Card; eventId?: string }) => void;
type CardUpdateHandler = (data: { card: Card; eventId?: string }) => void;
type CardDeleteHandler = (data: { cardId: string; columnId: string; eventId?: string }) => void;
type CardMoveHandler = (data: { card: Card; eventId?: string }) => void;
type UserJoinHandler = (data: { user: PresenceUser; users: PresenceUser[] }) => void;
type UserLeaveHandler = (data: { user: PresenceUser; users: PresenceUser[] }) => void;
type ColumnCreateHandler = (data: { column: Column; eventId?: string }) => void;
type ColumnUpdateHandler = (data: { column: Column; eventId?: string }) => void;
type ColumnDeleteHandler = (data: { columnId: string; eventId?: string }) => void;
type BoardUpdateHandler = (data: {
  board: Pick<Board, '_id' | 'title' | 'description' | 'members' | 'memberUsers'>;
}) => void;

class SocketService {
  private socket: Socket | null = null;
  private boardId: string | null = null;
  private processedEvents = new Set<string>();
  private ownEventIds = new Set<string>();

  connect() {
    if (this.socket?.connected) return this.socket;

    this.socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => {
        cb({ token: getAccessToken() });
      },
    });

    this.socket.io.on('reconnect_attempt', () => {
      this.updateAuth();
    });

    this.socket.on('connect', () => {
      if (this.boardId) {
        this.socket?.emit('user:join', { boardId: this.boardId });
      }
    });

    return this.socket;
  }

  updateAuth() {
    if (this.socket) {
      this.socket.auth = { token: getAccessToken() };
    }
  }

  registerOwnEvent(eventId: string) {
    this.ownEventIds.add(eventId);
    setTimeout(() => this.ownEventIds.delete(eventId), 30000);
  }

  private shouldProcess(eventId?: string): boolean {
    if (!eventId) return true;
    if (this.ownEventIds.has(eventId)) return false;
    if (this.processedEvents.has(eventId)) return false;
    this.processedEvents.add(eventId);
    if (this.processedEvents.size > 500) {
      const entries = Array.from(this.processedEvents);
      entries.slice(0, 250).forEach((id) => this.processedEvents.delete(id));
    }
    return true;
  }

  joinBoard(boardId: string) {
    const socket = this.connect();
    if (!socket) return;

    if (this.boardId && this.boardId !== boardId) {
      socket.emit('user:leave');
    }

    this.boardId = boardId;
    this.updateAuth();

    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit('user:join', { boardId });
    }
  }

  leaveBoard() {
    if (this.socket?.connected && this.boardId) {
      this.socket.emit('user:leave');
    }
    this.boardId = null;
  }

  disconnect() {
    this.leaveBoard();
    this.socket?.disconnect();
    this.socket = null;
  }

  onCardCreate(handler: CardCreateHandler) {
    this.socket?.on('card:create', (data) => {
      if (this.shouldProcess(data.eventId)) handler(data);
    });
  }

  onCardUpdate(handler: CardUpdateHandler) {
    this.socket?.on('card:update', (data) => {
      if (this.shouldProcess(data.eventId)) handler(data);
    });
  }

  onCardDelete(handler: CardDeleteHandler) {
    this.socket?.on('card:delete', (data) => {
      if (this.shouldProcess(data.eventId)) handler(data);
    });
  }

  onCardMove(handler: CardMoveHandler) {
    this.socket?.on('card:move', (data) => {
      if (this.shouldProcess(data.eventId)) handler(data);
    });
  }

  onUserJoin(handler: UserJoinHandler) {
    this.socket?.on('user:join', handler);
  }

  onUserLeave(handler: UserLeaveHandler) {
    this.socket?.on('user:leave', handler);
  }

  onColumnCreate(handler: ColumnCreateHandler) {
    this.socket?.on('column:create', (data) => {
      if (this.shouldProcess(data.eventId)) handler(data);
    });
  }

  onColumnUpdate(handler: ColumnUpdateHandler) {
    this.socket?.on('column:update', (data) => {
      if (this.shouldProcess(data.eventId)) handler(data);
    });
  }

  onColumnDelete(handler: ColumnDeleteHandler) {
    this.socket?.on('column:delete', (data) => {
      if (this.shouldProcess(data.eventId)) handler(data);
    });
  }

  onBoardUpdate(handler: BoardUpdateHandler) {
    this.socket?.on('board:update', handler);
  }

  offAll() {
    if (!this.socket) return;
    this.socket.off('card:create');
    this.socket.off('card:update');
    this.socket.off('card:delete');
    this.socket.off('card:move');
    this.socket.off('column:create');
    this.socket.off('column:update');
    this.socket.off('column:delete');
    this.socket.off('board:update');
    this.socket.off('user:join');
    this.socket.off('user:leave');
  }
}

export const socketService = new SocketService();
