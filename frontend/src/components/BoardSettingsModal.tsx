import { useState } from 'react';
import type { AssignableUser, Board } from '@/types';
import { useBoardStore } from '@/store/boardStore';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/utils/messages';
import { confirmAction } from '@/store/confirmStore';
import { useNavigate } from 'react-router-dom';

interface BoardSettingsModalProps {
  board: Board;
  assignableUsers: AssignableUser[];
  onClose: () => void;
}

export const BoardSettingsModal = ({ board, assignableUsers, onClose }: BoardSettingsModalProps) => {
  const navigate = useNavigate();
  const updateBoard = useBoardStore((s) => s.updateBoard);
  const deleteBoard = useBoardStore((s) => s.deleteBoard);

  const [title, setTitle] = useState(board.title);
  const [description, setDescription] = useState(board.description);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    board.members.filter((id) => id !== board.owner)
  );
  const [saving, setSaving] = useState(false);

  const toggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast.info('Board name is required.');
      return;
    }

    setSaving(true);
    try {
      await updateBoard(board._id, {
        title: trimmedTitle,
        description: description.trim(),
        memberIds: selectedMemberIds,
      });
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update the board.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBoard = async () => {
  const confirmed = await confirmAction({
    title: 'Delete board',
    message: `Delete "${board.title}" and all its columns/cards? This cannot be undone.`,
    confirmLabel: 'Delete board',
  });

  if (!confirmed) return;

  setSaving(true);

  try {
    await deleteBoard(board._id);

    toast.success('Board deleted successfully.');

    onClose();
    
    // navigate after delete
    navigate('/boards');
  } catch (err) {
    toast.error(getErrorMessage(err, 'Could not delete the board.'));
  } finally {
    setSaving(false);
  }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal board-settings-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Board settings</h2>

        <div className="form-group">
          <label htmlFor="edit-board-title">Board name</label>
          <input
            id="edit-board-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Board name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="edit-board-desc">Description</label>
          <textarea
            id="edit-board-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this board for?"
            rows={3}
          />
        </div>

        {assignableUsers.length > 0 && (
          <div className="form-group member-picker">
            <label>Assigned users</label>
            <p className="field-hint">These users can view and manage cards on this board.</p>
            <div className="member-picker-list">
              {assignableUsers.map((user) => {
                const selected = selectedMemberIds.includes(user._id);
                return (
                  <label key={user._id} className={`member-picker-item${selected ? ' is-selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleMember(user._id)}
                    />
                    <span className="member-picker-avatar">{user.name.charAt(0).toUpperCase()}</span>
                    <span className="member-picker-info">
                      <span className="member-picker-name">{user.name}</span>
                      <span className="member-picker-email">{user.email}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
    type="button"
    className="btn btn-danger"
    onClick={handleDeleteBoard}
    disabled={saving}
  >
    Delete Board
  </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
