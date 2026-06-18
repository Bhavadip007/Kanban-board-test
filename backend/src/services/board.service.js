const Board = require('../models/Board');
const Column = require('../models/Column');
const Card = require('../models/Card');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { runWithTransaction, sessionOpts, applySession } = require('../utils/transaction');

const notDeleted = { deletedAt: null };

const userHasAccess = (board, userId) => {
  const uid = userId.toString();
  return board.owner.toString() === uid || board.members.some((m) => m.toString() === uid);
};

const getBoardById = async (boardId, userId) => {
  const board = await Board.findOne({ _id: boardId, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }

  const columns = await Column.find({ board: boardId, ...notDeleted }).sort({ position: 1 }).lean();
  const cards = await Card.find({ board: boardId, ...notDeleted })
    .sort({ position: 1 })
    .populate('assignee', 'name email')
    .lean();

  const cardsByColumn = cards.reduce((acc, card) => {
    const colId = card.column.toString();
    if (!acc[colId]) acc[colId] = [];
    acc[colId].push(card);
    return acc;
  }, {});

  const columnsWithCards = columns.map((col) => ({
    ...col,
    cards: cardsByColumn[col._id.toString()] || [],
  }));

  const memberIds = [
    ...new Set([board.owner.toString(), ...board.members.map((m) => m.toString())]),
  ];
  const memberUsers = await User.find({ _id: { $in: memberIds }, deletedAt: null })
    .select('name email')
    .lean();

  return {
    ...board.toObject(),
    memberUsers,
    columns: columnsWithCards,
  };
};

const listBoards = async (userId) => {
  const boards = await Board.find({
    ...notDeleted,
    $or: [{ owner: userId }, { members: userId }],
  })
    .sort({ updatedAt: -1 })
    .lean();

  return boards;
};

const createBoard = async (userId, data) => {
  let boardId;

  await runWithTransaction(async (session) => {
    const [board] = await Board.create(
      [{
        title: data.title,
        description: data.description || '',
        owner: userId,
        members: [userId],
      }],
      sessionOpts(session)
    );
    boardId = board._id;

    const defaultColumns = ['To Do', 'In Progress', 'Done'];
    await Column.insertMany(
      defaultColumns.map((title, position) => ({ title, board: board._id, position })),
      sessionOpts(session)
    );
  });

  return getBoardById(boardId, userId);
};

const updateBoard = async (boardId, userId, data) => {
  const board = await Board.findOne({ _id: boardId, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  if (board.owner.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the board owner can update the board');
  }

  if (data.title !== undefined) board.title = data.title;
  if (data.description !== undefined) board.description = data.description;
  await board.save();

  return getBoardById(board._id, userId);
};

const deleteBoard = async (boardId, userId) => {
  const board = await Board.findOne({ _id: boardId, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  if (board.owner.toString() !== userId.toString()) {
    throw new ApiError(403, 'Only the board owner can delete the board');
  }

  const now = new Date();
  await Board.updateOne({ _id: boardId }, { deletedAt: now });
  await Column.updateMany({ board: boardId, ...notDeleted }, { deletedAt: now });
  await Card.updateMany({ board: boardId, ...notDeleted }, { deletedAt: now });

  return { message: 'Board deleted' };
};

module.exports = {
  getBoardById,
  listBoards,
  createBoard,
  updateBoard,
  deleteBoard,
  userHasAccess,
};
