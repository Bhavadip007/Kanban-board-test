import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import type { Board, Card } from '@/types';
import { cardService } from '@/services/boardService';
import { useBoardStore } from '@/store/boardStore';
import { confirmAction } from '@/store/confirmStore';
import { toast } from '@/store/toastStore';
import { getErrorMessage } from '@/utils/messages';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { CardModal } from './CardModal';

interface KanbanBoardProps {
  board: Board;
}

export const KanbanBoard = memo(({ board }: KanbanBoardProps) => {
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const dragSnapshotRef = useRef<Board | null>(null);

  const addColumn = useBoardStore((s) => s.addColumn);
  const updateColumnTitle = useBoardStore((s) => s.updateColumnTitle);
  const deleteColumn = useBoardStore((s) => s.deleteColumn);
  const addCard = useBoardStore((s) => s.addCard);
  const moveCardOptimistic = useBoardStore((s) => s.moveCardOptimistic);
  const confirmMove = useBoardStore((s) => s.confirmMove);
  const rollbackBoard = useBoardStore((s) => s.rollbackBoard);
  const currentBoard = useBoardStore((s) => s.currentBoard);

  const columns = currentBoard?.columns ?? board.columns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const allCards = useMemo(
    () => columns.flatMap((col) => col.cards),
    [columns]
  );

  const findColumnByCardId = useCallback(
    (cardId: string) => columns.find((col) => col.cards.some((c) => c._id === cardId)),
    [columns]
  );

  const resolveColumnId = useCallback(
    (overId: string, overData: DragOverEvent['over'] extends infer O ? O : never) => {
      let colId = overData?.data?.current?.columnId as string | undefined;
      if (!colId) {
        const overCardCol = findColumnByCardId(overId);
        colId = overCardCol?._id ?? overId;
      }
      return colId;
    },
    [findColumnByCardId]
  );

  const handleDragStart = (event: DragStartEvent) => {
    const boardState = useBoardStore.getState().currentBoard;
    dragSnapshotRef.current = boardState ? structuredClone(boardState) : null;
    const card = allCards.find((c) => c._id === event.active.id);
    if (card) setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCol = findColumnByCardId(active.id as string);
    const overColId = resolveColumnId(over.id as string, over);
    if (!activeCol || !overColId) return;

    const overCol = columns.find((c) => c._id === overColId);
    if (!overCol) return;

    const overIndex =
      over.data.current?.type === 'card'
        ? overCol.cards.findIndex((c) => c._id === over.id)
        : overCol.cards.length;

    if (overIndex < 0) return;

    moveCardOptimistic(active.id as string, overColId, overIndex);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveCard(null);
    const snapshot = dragSnapshotRef.current;
    dragSnapshotRef.current = null;

    const { active, over } = event;
    if (!over) {
      if (snapshot) rollbackBoard(snapshot);
      return;
    }

    const destColId = resolveColumnId(over.id as string, over);
    const destCol = columns.find((c) => c._id === destColId);
    if (!destCol) {
      if (snapshot) rollbackBoard(snapshot);
      return;
    }

    const position = destCol.cards.findIndex((c) => c._id === active.id);
    if (position < 0) {
      if (snapshot) rollbackBoard(snapshot);
      return;
    }

    const origCol = snapshot?.columns.find((col) =>
      col.cards.some((c) => c._id === active.id)
    );
    const origPosition = origCol?.cards.findIndex((c) => c._id === active.id) ?? -1;

    if (origCol?._id === destColId && origPosition === position) {
      return;
    }

    try {
      const card = await cardService.move(active.id as string, destColId, position);
      confirmMove(card);
    } catch (err) {
      if (snapshot) rollbackBoard(snapshot);
      toast.error(getErrorMessage(err, 'Could not move the card. Changes were reverted.'));
    }
  };

  const handleAddColumn = async () => {
    const title = newColumnTitle.trim();
    if (!title) {
      toast.info('Enter a column name first.');
      return;
    }
    try {
      await addColumn(board._id, title);
      setNewColumnTitle('');
      setAddingColumn(false);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add the column.'));
    }
  };

  const handleAddCard = async (columnId: string, title: string, description: string) => {
    try {
      await addCard(columnId, title, description);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add the card.'));
      throw err;
    }
  };

  const handleUpdateColumn = async (columnId: string, title: string) => {
    try {
      await updateColumnTitle(columnId, title);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not rename the column.'));
      throw err;
    }
  };

  const handleDeleteColumn = async (columnId: string, columnTitle: string) => {
    const confirmed = await confirmAction({
      title: 'Delete column',
      message: `Delete "${columnTitle}" and all its cards? This cannot be undone.`,
      confirmLabel: 'Delete column',
    });
    if (!confirmed) return;

    try {
      await deleteColumn(columnId);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete the column.'));
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {columns.map((column) => (
            <KanbanColumn
              key={column._id}
              column={column}
              onAddCard={handleAddCard}
              onUpdateTitle={handleUpdateColumn}
              onDeleteColumn={() => handleDeleteColumn(column._id, column.title)}
              onCardClick={setSelectedCard}
            />
          ))}

          <div className="add-column">
            {addingColumn ? (
              <div className="kanban-column" style={{ padding: '0.75rem' }}>
                <input
                  placeholder="Column name, e.g. Review"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                  autoFocus
                />
                <div className="add-card-actions" style={{ marginTop: '0.5rem' }}>
                  <button className="btn btn-primary" onClick={handleAddColumn}>
                    Add column
                  </button>
                  <button className="btn btn-secondary" onClick={() => setAddingColumn(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button className="add-column-btn kanban-column" onClick={() => setAddingColumn(true)}>
                + Add column
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? <KanbanCard card={activeCard} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>

      {selectedCard && (
        <CardModal
          card={selectedCard}
          memberUsers={currentBoard?.memberUsers ?? board.memberUsers ?? []}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
});

KanbanBoard.displayName = 'KanbanBoard';
