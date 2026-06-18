import { useState } from 'react';
import type { BoardMember, Card, Priority } from '@/types';
import { useBoardStore } from '@/store/boardStore';
import { confirmAction } from '@/store/confirmStore';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/utils/messages';

interface CardModalProps {
  card: Card;
  memberUsers: BoardMember[];
  onClose: () => void;
}

const priorities: Priority[] = ['low', 'medium', 'high', 'urgent'];

export const CardModal = ({ card, memberUsers, onClose }: CardModalProps) => {
  const updateCard = useBoardStore((s) => s.updateCard);
  const deleteCard = useBoardStore((s) => s.deleteCard);

  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [priority, setPriority] = useState<Priority>(card.priority);
  const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 10) ?? '');
  const [assignee, setAssignee] = useState(card.assignee?._id ?? '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      toast.info('Card title is required.');
      return;
    }
    setSaving(true);
    try {
      await updateCard(card._id, {
        title: title.trim(),
        description,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        assignee: assignee || null,
      });
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save the card.'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: 'Delete card',
      message: `Delete "${card.title}"? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteCard(card._id);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the card.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit card</h2>

        <div className="form-group">
          <label htmlFor="card-title">Title</label>
          <input
            id="card-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="card-desc">Description</label>
          <textarea
            id="card-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add more details…"
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="card-assignee">Assignee</label>
          <select id="card-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {memberUsers.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="card-priority">Priority</label>
          <select id="card-priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="card-due">Due date</label>
          <input id="card-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn btn-danger" onClick={handleDelete} disabled={deleting || saving}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving || deleting}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || deleting}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
