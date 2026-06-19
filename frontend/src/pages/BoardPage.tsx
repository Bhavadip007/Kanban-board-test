import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useBoardStore } from '@/store/boardStore';
import { useBoardSocket } from '@/hooks/useBoardSocket';
import { userService } from '@/services/userService';
import { KanbanBoard } from '@/components/KanbanBoard';
import { BoardSettingsModal } from '@/components/BoardSettingsModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import type { AssignableUser } from '@/types';
import '@/styles/board.css';
import '@/styles/dashboard.css';

export const BoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentBoard, loading, error, fetchBoard, activeUsers } = useBoardStore();
  const [showSettings, setShowSettings] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);

  useBoardSocket(id);

  useEffect(() => {
    if (id) fetchBoard(id);
    return () => useBoardStore.getState().setCurrentBoard(null);
  }, [id, fetchBoard]);

  useEffect(() => {
    if (currentBoard?.boardRole !== 'manager') return;
    userService.listAssignable().then(setAssignableUsers).catch(() => {});
  }, [currentBoard?.boardRole]);

  if (loading || !currentBoard || currentBoard._id !== id) {
    return (
      <div className="loading-screen">
        {loading ? (
          <LoadingSpinner label="Loading board…" />
        ) : (
          <div className="empty-state-box">
            <h3>{error ? 'Could not open board' : 'Board not found'}</h3>
            <p>{error || 'This board may have been deleted or you may not have access.'}</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
              Back to boards
            </Link>
          </div>
        )}
      </div>
    );
  }

  const isManager = currentBoard.boardRole === 'manager';

  return (
    <div className="board-page">
      <header className="board-header">
        <div className="board-header-left">
          <Link to="/" className="back-link">
            ← All boards
          </Link>
          <div className="board-title-block">
            <h1>{currentBoard.title}</h1>
            {currentBoard.description && (
              <p className="board-description">{currentBoard.description}</p>
            )}
          </div>
        </div>

        <div className="board-header-right">
          {isManager && (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowSettings(true)}>
              Board settings
            </button>
          )}
          <div className="presence-list" title="People viewing this board">
            {activeUsers.length === 0 ? (
              <span className="presence-empty">Only you</span>
            ) : (
              activeUsers.map((u) => (
                <span key={String(u.id)} className="presence-avatar" title={u.name}>
                  {u.name.charAt(0).toUpperCase()}
                </span>
              ))
            )}
          </div>
        </div>
      </header>

      <div className="board-content">
        <KanbanBoard board={currentBoard} />
      </div>

      {showSettings && (
        <BoardSettingsModal
          board={currentBoard}
          assignableUsers={assignableUsers}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};
