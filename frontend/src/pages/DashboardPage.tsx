import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useBoardStore } from '@/store/boardStore';
import { userService } from '@/services/userService';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/utils/messages';
import type { AssignableUser } from '@/types';
import '@/styles/dashboard.css';

export const DashboardPage = () => {
  const { user, logout } = useAuth();
  const { boards, loading, error, fetchBoards, createBoard } = useBoardStore();
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [assignableUsers, setAssignableUsers] = useState<AssignableUser[]>([]);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const isManager = user?.role === 'manager';

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  useEffect(() => {
    if (!isManager) return;
    userService.listAssignable().then(setAssignableUsers).catch(() => {});
  }, [isManager]);

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const resetCreateForm = () => {
    setShowCreateForm(false);
    setNewTitle('');
    setNewDescription('');
    setSelectedMemberIds([]);
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      toast.info('Enter a board title first.');
      return;
    }
    setCreating(true);
    try {
      await createBoard(title, newDescription.trim(), selectedMemberIds);
      resetCreateForm();
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

  const userInitial = user?.name?.charAt(0).toUpperCase() ?? '?';

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <span className="dashboard-logo" aria-hidden="true">
            K
          </span>
          <h1>{isManager ? 'Your Boards' : 'Assigned Boards'}</h1>
        </div>
        <div className="header-actions">
          <div className="user-chip">
            <span className="user-avatar">{userInitial}</span>
            <span className="user-name">{user?.name}</span>
            <span className="role-badge">{user?.role === 'manager' ? 'Manager' : 'User'}</span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-toolbar">
          <div>
            <h2 className="dashboard-section-title">
              {isManager ? 'Workspace' : 'My boards'}
            </h2>
            {!loading && (
              <p className="dashboard-section-subtitle">
                {boards.length === 0
                  ? isManager
                    ? 'Create a board to start organizing work.'
                    : 'Boards assigned to you will appear here.'
                  : `${boards.length} board${boards.length === 1 ? '' : 's'}`}
              </p>
            )}
          </div>
          {isManager && !showCreateForm && (
            <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
              + Create board
            </button>
          )}
        </div>

        {isManager && showCreateForm && (
          <section className="create-board-panel" aria-label="Create new board">
            <div className="create-board-panel-header">
              <h3>New board</h3>
              <button
                type="button"
                className="panel-close-btn"
                onClick={resetCreateForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <div className="create-board-form">
              <div className="form-group">
                <label htmlFor="board-title">Board name</label>
                <input
                  id="board-title"
                  placeholder="e.g. Product Roadmap"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="board-description">Description</label>
                <textarea
                  id="board-description"
                  placeholder="What is this board for? (optional)"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                />
              </div>

              {assignableUsers.length > 0 && (
                <div className="form-group member-picker">
                  <label>Assign team members</label>
                  <p className="field-hint">Selected users can view and manage cards on this board.</p>
                  <div className="member-picker-list">
                    {assignableUsers.map((assignable) => {
                      const selected = selectedMemberIds.includes(assignable._id);
                      return (
                        <label
                          key={assignable._id}
                          className={`member-picker-item${selected ? ' is-selected' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleMember(assignable._id)}
                          />
                          <span className="member-picker-avatar">
                            {assignable.name.charAt(0).toUpperCase()}
                          </span>
                          <span className="member-picker-info">
                            <span className="member-picker-name">{assignable.name}</span>
                            <span className="member-picker-email">{assignable.email}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="create-board-actions">
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating…' : 'Create board'}
                </button>
                <button className="btn btn-secondary" onClick={resetCreateForm} disabled={creating}>
                  Cancel
                </button>
              </div>
            </div>
          </section>
        )}

        {loading && <LoadingSpinner label="Loading your boards…" />}

        {error && !loading && (
          <div className="alert-banner alert-error">{error}</div>
        )}

        {!loading && !error && boards.length === 0 && (
          <div className="empty-state-box">
            <div className="empty-state-icon" aria-hidden="true">
              ▤
            </div>
            <h3>{isManager ? 'No boards yet' : 'No boards assigned'}</h3>
            <p>
              {isManager
                ? 'Click “Create board” to set up your first workspace.'
                : 'Ask a manager to assign you to a board.'}
            </p>
            {isManager && !showCreateForm && (
              <button className="btn btn-primary" onClick={() => setShowCreateForm(true)}>
                + Create board
              </button>
            )}
          </div>
        )}

        {!loading && boards.length > 0 && (
          <div className="boards-grid">
            {boards.map((board) => (
              <Link key={board._id} to={`/boards/${board._id}`} className="board-card">
                <div className="board-card-accent" />
                <div className="board-card-body">
                  <h3>{board.title}</h3>
                  <p>{board.description || 'No description'}</p>
                  <div className="board-card-footer">
                    <span className="board-role-tag">
                      {board.boardRole === 'manager' ? 'Manager' : 'Member'}
                    </span>
                    <span className="board-card-date">
                      Updated {new Date(board.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
