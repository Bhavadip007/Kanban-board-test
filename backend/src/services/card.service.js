const Card = require('../models/Card');
const Column = require('../models/Column');
const ApiError = require('../utils/ApiError');
const { runWithTransaction, sessionOpts, applySession } = require('../utils/transaction');
const { getColumnWithBoard } = require('./column.service');
const { userHasAccess } = require('./board.service');

const notDeleted = { deletedAt: null };

const getCardWithContext = async (cardId) => {
  const card = await Card.findOne({ _id: cardId, ...notDeleted });
  if (!card) {
    throw new ApiError(404, 'Card not found');
  }
  const column = await Column.findOne({ _id: card.column, ...notDeleted });
  if (!column) {
    throw new ApiError(404, 'Column not found');
  }
  const Board = require('../models/Board');
  const board = await Board.findOne({ _id: card.board, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  return { card, column, board };
};

const reorderCards = async (columnId, cards, session) => {
  for (let i = 0; i < cards.length; i++) {
    cards[i].position = i;
    await cards[i].save(sessionOpts(session));
  }
};

const findColumnCards = (columnId, session) =>
  applySession(Card.find({ column: columnId, ...notDeleted }).sort({ position: 1 }), session);

const createCard = async (columnId, userId, data) => {
  const { column, board } = await getColumnWithBoard(columnId);
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }

  let position = data.position;
  if (position === undefined) {
    const maxCard = await Card.findOne({ column: columnId, ...notDeleted })
      .sort({ position: -1 })
      .select('position');
    position = maxCard ? maxCard.position + 1 : 0;
  } else {
    await Card.updateMany(
      { column: columnId, ...notDeleted, position: { $gte: position } },
      { $inc: { position: 1 } }
    );
  }

  const card = await Card.create({
    title: data.title,
    description: data.description || '',
    column: columnId,
    board: board._id,
    position,
    assignee: data.assignee || null,
    dueDate: data.dueDate || null,
    priority: data.priority || 'medium',
  });

  return Card.findById(card._id).populate('assignee', 'name email').lean();
};

const updateCard = async (cardId, userId, data) => {
  const { card, board } = await getCardWithContext(cardId);
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }

  if (data.title !== undefined) card.title = data.title;
  if (data.description !== undefined) card.description = data.description;
  if (data.assignee !== undefined) card.assignee = data.assignee;
  if (data.dueDate !== undefined) card.dueDate = data.dueDate;
  if (data.priority !== undefined) card.priority = data.priority;

  if (data.position !== undefined && data.position !== card.position) {
    await runWithTransaction(async (session) => {
      const cards = await findColumnCards(card.column, session);
      const filtered = cards.filter((c) => c._id.toString() !== cardId);
      filtered.splice(data.position, 0, card);
      await reorderCards(card.column, filtered, session);
    });
  } else {
    await card.save();
  }

  return Card.findById(cardId).populate('assignee', 'name email').lean();
};

const deleteCard = async (cardId, userId) => {
  const { card, board, column } = await getCardWithContext(cardId);
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }

  await runWithTransaction(async (session) => {
    card.deletedAt = new Date();
    await card.save(sessionOpts(session));

    const remaining = await findColumnCards(column._id, session);
    await reorderCards(column._id, remaining, session);
  });

  return { message: 'Card deleted' };
};

const moveCard = async (cardId, userId, { columnId, position }) => {
  const { card, board } = await getCardWithContext(cardId);
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }

  const destColumn = await Column.findOne({ _id: columnId, board: board._id, ...notDeleted });
  if (!destColumn) {
    throw new ApiError(404, 'Destination column not found');
  }

  const sourceColumnId = card.column.toString();
  const isSameColumn = sourceColumnId === columnId;

  await runWithTransaction(async (session) => {
    if (isSameColumn) {
      const cards = await findColumnCards(columnId, session);
      const filtered = cards.filter((c) => c._id.toString() !== cardId);
      filtered.splice(position, 0, card);
      await reorderCards(columnId, filtered, session);
    } else {
      const sourceCards = await findColumnCards(sourceColumnId, session);
      const movingCard = sourceCards.find((c) => c._id.toString() === cardId);
      const sourceFiltered = sourceCards.filter((c) => c._id.toString() !== cardId);
      await reorderCards(sourceColumnId, sourceFiltered, session);

      const destCards = await findColumnCards(columnId, session);
      movingCard.column = columnId;
      destCards.splice(position, 0, movingCard);
      await reorderCards(columnId, destCards, session);
    }
  });

  return Card.findById(cardId).populate('assignee', 'name email').lean();
};

module.exports = { createCard, updateCard, deleteCard, moveCard, getCardWithContext };
