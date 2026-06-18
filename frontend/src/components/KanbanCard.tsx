import { memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card } from '@/types';
import { formatDate, priorityColors } from '@/utils';

interface KanbanCardProps {
  card: Card;
  onClick: (card: Card) => void;
}

export const KanbanCard = memo(({ card, onClick }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card._id,
    data: { type: 'card', card },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''}`}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && onClick(card)}
    >
      <h4>{card.title}</h4>
      {card.description && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          {card.description.slice(0, 80)}
          {card.description.length > 80 ? '...' : ''}
        </p>
      )}
      <div className="card-meta">
        <span className="priority-badge" style={{ color: priorityColors[card.priority] }}>
          {card.priority}
        </span>
        {card.dueDate && <span className="due-date">{formatDate(card.dueDate)}</span>}
        {card.assignee && <span className="assignee-badge">{card.assignee.name}</span>}
      </div>
    </div>
  );
});

KanbanCard.displayName = 'KanbanCard';
