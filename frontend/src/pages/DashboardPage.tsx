import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBoardStore } from '@/store/boardStore';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/utils/messages';
import '@/styles/dashboard.css';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { boards, loading, error, fetchBoards, createBoard } = useBoardStore();
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      toast.info('Enter a board title first.');
      return;
    }
    setCreating(true);
    try {
      await createBoard(title);
      setNewTitle('');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not create the board.'));
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.info('You have been signed out.');
    } catch {
      toast.info('You have been signed out.');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Your Boards</h1>
        <div className="header-actions">
          <span className="user-name">{user?.name}</span>
          <button className="btn btn-secondary" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="create-board-form">
          <input
            placeholder="Board name, e.g. Product Roadmap"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            aria-label="New board title"
          />
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'Create board'}
          </button>
        </div>

        {loading && <LoadingSpinner label="Loading your boards…" />}

        {error && !loading && (
          <div className="alert-banner alert-error">{error}</div>
        )}

        {!loading && !error && boards.length === 0 && (
          <div className="empty-state-box">
            <h3>No boards yet</h3>
            <p>Create your first board above to get started.</p>
          </div>
        )}

        {!loading && boards.length > 0 && (
          <div className="boards-grid">
            {boards.map((board) => (
              <Link key={board._id} to={`/boards/${board._id}`} className="board-card">
                <h3>{board.title}</h3>
                <p>{board.description || 'No description'}</p>
                <span className="board-card-meta">
                  Updated {new Date(board.updatedAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
