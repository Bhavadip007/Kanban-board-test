import { memo, useState } from 'react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import type { Column, Card } from '@/types';
import { useSortedCards } from '@/hooks/useSortedCards';
import { toast } from '@/store/toastStore';
import { KanbanCard } from './KanbanCard';

interface KanbanColumnProps {
  column: Column;
  onAddCard: (columnId: string, title: string, description: string) => Promise<void>;
  onUpdateTitle: (columnId: string, title: string) => Promise<void>;
  onDeleteColumn: () => Promise<void>;
  onCardClick: (card: Card) => void;
}

export const KanbanColumn = memo(
  ({ column, onAddCard, onUpdateTitle, onDeleteColumn, onCardClick }: KanbanColumnProps) => {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(column.title);
    const [adding, setAdding] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const sortedCards = useSortedCards(column.cards);
    const cardIds = sortedCards.map((c) => c._id);

    const { setNodeRef, isOver } = useDroppable({
      id: column._id,
      data: { type: 'column', columnId: column._id },
    });

    const saveTitle = async () => {
      const trimmed = title.trim();
      if (!trimmed) {
        setTitle(column.title);
        setEditing(false);
        toast.info('Column name cannot be empty.');
        return;
      }
      if (trimmed !== column.title) {
        try {
          await onUpdateTitle(column._id, trimmed);
        } catch {
          setTitle(column.title);
        }
      }
      setEditing(false);
    };

    const handleAddCard = async () => {
      if (!newTitle.trim()) {
        toast.info('Enter a card title first.');
        return;
      }
      setSubmitting(true);
      try {
        await onAddCard(column._id, newTitle.trim(), newDesc.trim());
        setNewTitle('');
        setNewDesc('');
        setAdding(false);
      } catch {
        /* toast shown by parent */
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div className="kanban-column">
        <div className="column-header">
          {editing ? (
            <input
              className="column-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') {
                  setTitle(column.title);
                  setEditing(false);
                }
              }}
              autoFocus
            />
          ) : (
            <span className="column-title" onDoubleClick={() => setEditing(true)}>
              {column.title}
            </span>
          )}
          <div className="column-actions">
            <button type="button" onClick={() => setEditing(true)} title="Rename column">
              Rename
            </button>
            <button type="button" onClick={onDeleteColumn} title="Delete column">
              Delete
            </button>
          </div>
        </div>

        <div
          ref={setNodeRef}
          className="column-cards"
          style={{ background: isOver ? 'rgb(99 102 241 / 0.08)' : undefined }}
        >
          <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
            {sortedCards.map((card) => (
              <KanbanCard key={card._id} card={card} onClick={onCardClick} />
            ))}
          </SortableContext>

          {sortedCards.length === 0 && !adding && (
            <p className="column-empty">No cards yet</p>
          )}

          {adding ? (
            <div className="add-card-form">
              <input
                placeholder="Card title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
              />
              <textarea
                placeholder="Description (optional)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
              <div className="add-card-actions">
                <button className="btn btn-primary" onClick={handleAddCard} disabled={submitting}>
                  {submitting ? 'Adding…' : 'Add card'}
                </button>
                <button className="btn btn-secondary" onClick={() => setAdding(false)} disabled={submitting}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button className="add-card-btn" onClick={() => setAdding(true)}>
              + Add card
            </button>
          )}
        </div>
      </div>
    );
  }
);

KanbanColumn.displayName = 'KanbanColumn';
