import { useEffect } from 'react';
import { socketService } from '@/services/socketService';
import { useBoardStore } from '@/store/boardStore';

export const useBoardSocket = (boardId: string | undefined) => {
  const handleRemoteCreate = useBoardStore((s) => s.handleRemoteCreate);
  const handleRemoteUpdate = useBoardStore((s) => s.handleRemoteUpdate);
  const handleRemoteDelete = useBoardStore((s) => s.handleRemoteDelete);
  const handleRemoteMove = useBoardStore((s) => s.handleRemoteMove);
  const handleRemoteColumnCreate = useBoardStore((s) => s.handleRemoteColumnCreate);
  const handleRemoteColumnUpdate = useBoardStore((s) => s.handleRemoteColumnUpdate);
  const handleRemoteColumnDelete = useBoardStore((s) => s.handleRemoteColumnDelete);
  const handleRemoteBoardUpdate = useBoardStore((s) => s.handleRemoteBoardUpdate);
  const setActiveUsers = useBoardStore((s) => s.setActiveUsers);

  useEffect(() => {
    if (!boardId) return;

    socketService.offAll();
    socketService.joinBoard(boardId);

    socketService.onCardCreate(({ card }) => handleRemoteCreate(card));
    socketService.onCardUpdate(({ card }) => handleRemoteUpdate(card));
    socketService.onCardDelete(({ cardId, columnId }) => handleRemoteDelete(cardId, columnId));
    socketService.onCardMove(({ card }) => handleRemoteMove(card));
    socketService.onColumnCreate(({ column }) => handleRemoteColumnCreate(column));
    socketService.onColumnUpdate(({ column }) => handleRemoteColumnUpdate(column));
    socketService.onColumnDelete(({ columnId }) => handleRemoteColumnDelete(columnId));
    socketService.onBoardUpdate(({ board }) => handleRemoteBoardUpdate(board));
    socketService.onUserJoin(({ users }) => setActiveUsers(users));
    socketService.onUserLeave(({ users }) => setActiveUsers(users));

    return () => {
      socketService.leaveBoard();
      socketService.offAll();
      setActiveUsers([]);
    };
  }, [
    boardId,
    handleRemoteCreate,
    handleRemoteUpdate,
    handleRemoteDelete,
    handleRemoteMove,
    handleRemoteColumnCreate,
    handleRemoteColumnUpdate,
    handleRemoteColumnDelete,
    handleRemoteBoardUpdate,
    setActiveUsers,
  ]);
};
