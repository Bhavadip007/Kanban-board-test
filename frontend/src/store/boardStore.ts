import { create } from 'zustand';
import type { Board, BoardSummary, Card, Column, PresenceUser } from '@/types';
import { boardService, columnService, cardService } from '@/services/boardService';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/utils/messages';

interface BoardState {
  boards: BoardSummary[];
  currentBoard: Board | null;
  loading: boolean;
  error: string | null;
  activeUsers: PresenceUser[];
  processedEventIds: Set<string>;

  fetchBoards: () => Promise<void>;
  fetchBoard: (id: string) => Promise<void>;
  createBoard: (title: string, description?: string, memberIds?: string[]) => Promise<Board>;
  updateBoard: (
    id: string,
    payload: { title?: string; description?: string; memberIds?: string[] }
  ) => Promise<Board>;
  deleteBoard: (id: string) => Promise<void>;
  setCurrentBoard: (board: Board | null) => void;
  setActiveUsers: (users: PresenceUser[]) => void;

  addColumn: (boardId: string, title: string) => Promise<void>;
  updateColumnTitle: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  addCard: (columnId: string, title: string, description?: string) => Promise<void>;
  updateCard: (cardId: string, updates: Partial<Pick<Card, 'title' | 'description' | 'priority' | 'dueDate'>> & { assignee?: string | null }) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  moveCardOptimistic: (cardId: string, destColumnId: string, position: number) => void;
  confirmMove: (card: Card) => void;
  rollbackBoard: (snapshot: Board | null) => void;

  handleRemoteCreate: (card: Card) => void;
  handleRemoteUpdate: (card: Card) => void;
  handleRemoteDelete: (cardId: string, columnId: string) => void;
  handleRemoteMove: (card: Card) => void;
  handleRemoteColumnCreate: (column: Column) => void;
  handleRemoteColumnUpdate: (column: Column) => void;
  handleRemoteColumnDelete: (columnId: string) => void;
  handleRemoteBoardUpdate: (board: Pick<Board, '_id' | 'title' | 'description' | 'members' | 'memberUsers'>) => void;
}

const sortCards = (cards: Card[]) =>
  [...cards].sort(
    (a, b) => a.position - b.position || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );

const colIdOf = (column: string | { _id: string }) =>
  typeof column === 'string' ? column : String(column._id);

const resolveAssignee = (
  assigneeId: string | null | undefined,
  members: Board['memberUsers']
): Card['assignee'] => {
  if (!assigneeId) return null;
  const member = members.find((m) => m._id === assigneeId);
  return member ? { _id: member._id, name: member.name, email: member.email } : null;
};

const applyCardToColumns = (columns: Column[], card: Card): Column[] => {
  const targetColId = colIdOf(card.column);
  const normalized = { ...card, column: targetColId };

  return columns.map((col) => {
    const id = String(col._id);
    let cards = col.cards.filter((c) => c._id !== normalized._id);

    if (id === targetColId) {
      const idx = Math.min(normalized.position ?? cards.length, cards.length);
      cards.splice(idx, 0, normalized);
    }

    return { ...col, cards: sortCards(cards.map((c, i) => ({ ...c, position: i }))) };
  });
};

export const useBoardStore = create<BoardState>((set, get) => ({
  boards: [],
  currentBoard: null,
  loading: false,
  error: null,
  activeUsers: [],
  processedEventIds: new Set(),

  fetchBoards: async () => {
    set({ loading: true, error: null });
    try {
      const boards = await boardService.list();
      set({ boards, loading: false });
    } catch (err) {
      const message = getErrorMessage(err, 'Could not load your boards.');
      set({ error: message, loading: false });
    }
  },

  fetchBoard: async (id: string) => {
    set({ loading: true, error: null, currentBoard: null });
    try {
      const board = await boardService.get(id);
      set({ currentBoard: board, loading: false });
    } catch (err) {
      const message = getErrorMessage(err, 'Could not load this board.');
      set({ error: message, loading: false, currentBoard: null });
    }
  },

  createBoard: async (title, description, memberIds) => {
    const board = await boardService.create(title, description, memberIds);
    set((s) => ({
      boards: [
        {
          _id: board._id,
          title: board.title,
          description: board.description,
          boardRole: board.boardRole,
          updatedAt: board.updatedAt,
        },
        ...s.boards,
      ],
    }));
    toast.success(`"${board.title}" created`);
    return board;
  },

  deleteBoard: async (id) => {
    await boardService.delete(id);
    set((s) => ({ boards: s.boards.filter((b) => b._id !== id) }));
    toast.success('Board deleted');
  },

  updateBoard: async (id, payload) => {
    const board = await boardService.update(id, payload);
    set((s) => ({
      boards: s.boards.map((b) =>
        b._id === id
          ? {
              ...b,
              title: board.title,
              description: board.description,
              updatedAt: board.updatedAt,
            }
          : b
      ),
      currentBoard:
        s.currentBoard?._id === id
          ? {
              ...board,
              columns: s.currentBoard.columns,
              memberUsers: board.memberUsers,
              members: board.members,
            }
          : s.currentBoard,
    }));
    toast.success('Board updated');
    return board;
  },

  setCurrentBoard: (board) => set({ currentBoard: board }),
  setActiveUsers: (users) => set({ activeUsers: users }),

  addColumn: async (boardId, title) => {
    const column = await columnService.create(boardId, title);
    set((s) => {
      if (!s.currentBoard || s.currentBoard._id !== boardId) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: [...s.currentBoard.columns, { ...column, cards: [] }].sort(
            (a, b) => a.position - b.position
          ),
        },
      };
    });
    toast.success(`Column "${title}" added`);
  },

  updateColumnTitle: async (columnId, title) => {
    await columnService.update(columnId, { title });
    set((s) => {
      if (!s.currentBoard) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: s.currentBoard.columns.map((c) =>
            c._id === columnId ? { ...c, title } : c
          ),
        },
      };
    });
    toast.success('Column renamed');
  },

  deleteColumn: async (columnId) => {
    await columnService.delete(columnId);
    set((s) => {
      if (!s.currentBoard) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: s.currentBoard.columns.filter((c) => c._id !== columnId),
        },
      };
    });
    toast.success('Column deleted');
  },

  addCard: async (columnId, title, description = '') => {
    const snapshot = get().currentBoard ? structuredClone(get().currentBoard) : null;
    const col = snapshot?.columns.find((c) => c._id === columnId);
    const position = col ? col.cards.length : 0;
    const tempCard: Card = {
      _id: `temp-${Date.now()}`,
      title,
      description,
      column: columnId,
      board: snapshot?._id ?? '',
      position,
      assignee: null,
      dueDate: null,
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((s) => {
      if (!s.currentBoard) return s;
      return { currentBoard: { ...s.currentBoard, columns: applyCardToColumns(s.currentBoard.columns, tempCard) } };
    });

    try {
      const card = await cardService.create(columnId, { title, description });
      set((s) => {
        if (!s.currentBoard) return s;
        const cols = s.currentBoard.columns.map((c) => ({
          ...c,
          cards: c.cards.filter((card) => card._id !== tempCard._id),
        }));
        return { currentBoard: { ...s.currentBoard, columns: applyCardToColumns(cols, card) } };
      });
      toast.success('Card added');
    } catch (err) {
      if (snapshot) set({ currentBoard: snapshot });
      throw err;
    }
  },

  updateCard: async (cardId, updates) => {
    const snapshot = get().currentBoard ? structuredClone(get().currentBoard) : null;

    set((s) => {
      if (!s.currentBoard) return s;
      const members = s.currentBoard.memberUsers ?? [];
      const cols = s.currentBoard.columns.map((col) => ({
        ...col,
        cards: col.cards.map((c) => {
          if (c._id !== cardId) return c;
          const next: Card = {
            ...c,
            ...(updates.title !== undefined && { title: updates.title }),
            ...(updates.description !== undefined && { description: updates.description }),
            ...(updates.priority !== undefined && { priority: updates.priority }),
            ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
          };
          if (updates.assignee !== undefined) {
            next.assignee = resolveAssignee(updates.assignee, members);
          }
          return next;
        }),
      }));
      return { currentBoard: { ...s.currentBoard, columns: cols } };
    });

    const payload: Record<string, unknown> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;
    if (updates.assignee !== undefined) payload.assignee = updates.assignee;

    try {
      const card = await cardService.update(cardId, payload);
      set((s) => {
        if (!s.currentBoard) return s;
        return {
          currentBoard: {
            ...s.currentBoard,
            columns: applyCardToColumns(s.currentBoard.columns, card),
          },
        };
      });
      toast.success('Card updated');
    } catch (err) {
      if (snapshot) set({ currentBoard: snapshot });
      throw err;
    }
  },

  deleteCard: async (cardId) => {
    const snapshot = get().currentBoard ? structuredClone(get().currentBoard) : null;
    const board = get().currentBoard;
    const column = board?.columns.find((c) => c.cards.some((card) => card._id === cardId));

    set((s) => {
      if (!s.currentBoard || !column) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: s.currentBoard.columns.map((c) =>
            c._id === column._id
              ? { ...c, cards: c.cards.filter((card) => card._id !== cardId) }
              : c
          ),
        },
      };
    });

    try {
      await cardService.delete(cardId);
      toast.success('Card deleted');
    } catch (err) {
      if (snapshot) set({ currentBoard: snapshot });
      throw err;
    }
  },

  moveCardOptimistic: (cardId, destColumnId, position) => {
    set((s) => {
      if (!s.currentBoard) return s;
      let movedCard: Card | undefined;
      const columns = s.currentBoard.columns.map((col) => {
        const card = col.cards.find((c) => c._id === cardId);
        if (card) movedCard = { ...card, column: destColumnId, position };
        return { ...col, cards: col.cards.filter((c) => c._id !== cardId) };
      });
      if (!movedCard) return s;
      const updated = columns.map((col) => {
        if (col._id !== destColumnId) return col;
        const cards = [...col.cards];
        cards.splice(position, 0, movedCard!);
        return { ...col, cards: cards.map((c, i) => ({ ...c, position: i })) };
      });
      return { currentBoard: { ...s.currentBoard, columns: updated } };
    });
  },

  confirmMove: (card) => {
    set((s) => {
      if (!s.currentBoard) return s;
      return { currentBoard: { ...s.currentBoard, columns: applyCardToColumns(s.currentBoard.columns, card) } };
    });
  },

  rollbackBoard: (snapshot) => {
    if (snapshot) set({ currentBoard: snapshot });
  },

  handleRemoteCreate: (card) => {
    set((s) => {
      if (!s.currentBoard) return s;
      const boardId = typeof card.board === 'string' ? card.board : String(card.board);
      if (s.currentBoard._id !== boardId) return s;
      if (s.currentBoard.columns.some((c) => c.cards.some((existing) => existing._id === card._id))) return s;
      return { currentBoard: { ...s.currentBoard, columns: applyCardToColumns(s.currentBoard.columns, card) } };
    });
  },

  handleRemoteUpdate: (card) => {
    set((s) => {
      if (!s.currentBoard) return s;
      return { currentBoard: { ...s.currentBoard, columns: applyCardToColumns(s.currentBoard.columns, card) } };
    });
  },

  handleRemoteDelete: (cardId, columnId) => {
    set((s) => {
      if (!s.currentBoard) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: s.currentBoard.columns.map((c) =>
            c._id === columnId
              ? { ...c, cards: sortCards(c.cards.filter((card) => card._id !== cardId).map((card, i) => ({ ...card, position: i }))) }
              : c
          ),
        },
      };
    });
  },

  handleRemoteMove: (card) => {
    set((s) => {
      if (!s.currentBoard) return s;
      return { currentBoard: { ...s.currentBoard, columns: applyCardToColumns(s.currentBoard.columns, card) } };
    });
  },

  handleRemoteColumnCreate: (column) => {
    set((s) => {
      if (!s.currentBoard) return s;
      if (s.currentBoard.columns.some((c) => c._id === column._id)) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: [...s.currentBoard.columns, { ...column, cards: [] }].sort(
            (a, b) => a.position - b.position
          ),
        },
      };
    });
  },

  handleRemoteColumnUpdate: (column) => {
    set((s) => {
      if (!s.currentBoard) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: s.currentBoard.columns
            .map((c) => (c._id === column._id ? { ...c, ...column, cards: c.cards } : c))
            .sort((a, b) => a.position - b.position),
        },
      };
    });
  },

  handleRemoteColumnDelete: (columnId) => {
    set((s) => {
      if (!s.currentBoard) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          columns: s.currentBoard.columns.filter((c) => c._id !== columnId),
        },
      };
    });
  },

  handleRemoteBoardUpdate: (board) => {
    set((s) => {
      if (!s.currentBoard || s.currentBoard._id !== board._id) return s;
      return {
        currentBoard: {
          ...s.currentBoard,
          title: board.title,
          description: board.description,
          members: board.members,
          memberUsers: board.memberUsers,
        },
        boards: s.boards.map((b) =>
          b._id === board._id
            ? { ...b, title: board.title, description: board.description }
            : b
        ),
      };
    });
  },
}));
