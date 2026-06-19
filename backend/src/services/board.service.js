const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { runWithTransaction, sessionOpts } = require('../utils/transaction');
const { isBoardManager, userHasBoardAccess } = require('../middleware/auth.middleware');

const notDeleted = { deletedAt: null };

const userHasAccess = userHasBoardAccess;

const resolveMemberIds = async (memberIds, ownerId) => {
  if (!memberIds?.length) return [];

  const users = await User.find({
    _id: { $in: memberIds },
    role: 'user',
    ...notDeleted,
  }).select('_id');

  const validIds = users.map((u) => u._id.toString());
  const ownerStr = ownerId.toString();

  return [...new Set(validIds.filter((id) => id !== ownerStr))];
};

const getBoardById = async (boardId, userId) => {
  const Board = require('../models/Board');
  const Column = require('../models/Column');
  const Card = require('../models/Card');

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
    cards: (cardsByColumn[col._id.toString()] || []).sort(
      (a, b) => a.position - b.position || a.title.localeCompare(b.title)
    ),
  }));

  const memberIds = [
    ...new Set([board.owner.toString(), ...board.members.map((m) => m.toString())]),
  ];
  const memberUsers = await User.find({ _id: { $in: memberIds }, deletedAt: null })
    .select('name email role')
    .lean();

  return {
    ...board.toObject(),
    memberUsers,
    boardRole: isBoardManager(board, userId) ? 'manager' : 'member',
    columns: columnsWithCards,
  };
};

const listBoards = async (userId) => {
  const Board = require('../models/Board');
  const user = await User.findOne({ _id: userId, ...notDeleted });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const filter =
    user.role === 'manager'
      ? { owner: userId, ...notDeleted }
      : { members: userId, ...notDeleted };

  const boards = await Board.find(filter).sort({ updatedAt: -1 }).lean();

  return boards.map((b) => ({
    ...b,
    boardRole: isBoardManager(b, userId) ? 'manager' : 'member',
  }));
};

const createBoard = async (userId, data) => {
  const Board = require('../models/Board');
  const Column = require('../models/Column');

  const user = await User.findOne({ _id: userId, ...notDeleted });
  if (!user || user.role !== 'manager') {
    throw new ApiError(403, 'Only managers can create boards');
  }

  const members = await resolveMemberIds(data.memberIds, userId);
  let boardId;

  await runWithTransaction(async (session) => {
    const [board] = await Board.create(
      [{
        title: data.title,
        description: data.description || '',
        owner: userId,
        members,
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
  const Board = require('../models/Board');
  const board = await Board.findOne({ _id: boardId, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  if (!isBoardManager(board, userId)) {
    throw new ApiError(403, 'Only the board manager can update the board');
  }

  if (data.title !== undefined) board.title = data.title;
  if (data.description !== undefined) board.description = data.description;
  if (data.memberIds !== undefined) {
    board.members = await resolveMemberIds(data.memberIds, userId);
  }
  await board.save();

  return getBoardById(board._id, userId);
};

const deleteBoard = async (boardId, userId) => {
  const Board = require('../models/Board');
  const Column = require('../models/Column');
  const Card = require('../models/Card');

  const board = await Board.findOne({ _id: boardId, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  if (!isBoardManager(board, userId)) {
    throw new ApiError(403, 'Only the board manager can delete the board');
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
  isBoardManager,
};
