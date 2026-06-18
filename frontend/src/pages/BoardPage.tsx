import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useBoardStore } from '@/store/boardStore';
import { useBoardSocket } from '@/hooks/useBoardSocket';
import { KanbanBoard } from '@/components/KanbanBoard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import '@/styles/board.css';

export const BoardPage = () => {
  const { id } = useParams<{ id: string }>();
  const { currentBoard, loading, error, fetchBoard, activeUsers } = useBoardStore();

  useBoardSocket(id);

  useEffect(() => {
    if (id) fetchBoard(id);
    return () => useBoardStore.getState().setCurrentBoard(null);
  }, [id, fetchBoard]);

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

  return (
    <div className="board-page">
      <header className="board-header">
        <div className="board-header-left">
          <Link to="/" className="back-link">
            ← All boards
          </Link>
          <h1>{currentBoard.title}</h1>
        </div>

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
      </header>

      <div className="board-content">
        <KanbanBoard board={currentBoard} />
      </div>
    </div>
  );
};
