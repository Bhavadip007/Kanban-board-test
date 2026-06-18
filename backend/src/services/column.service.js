const Column = require('../models/Column');
const Card = require('../models/Card');
const Board = require('../models/Board');
const ApiError = require('../utils/ApiError');
const { runWithTransaction, sessionOpts, applySession } = require('../utils/transaction');
const { userHasAccess } = require('./board.service');

const notDeleted = { deletedAt: null };

const getColumnWithBoard = async (columnId) => {
  const column = await Column.findOne({ _id: columnId, ...notDeleted });
  if (!column) {
    throw new ApiError(404, 'Column not found');
  }
  const board = await Board.findOne({ _id: column.board, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  return { column, board };
};

const assertBoardAccess = async (boardId, userId) => {
  const board = await Board.findOne({ _id: boardId, ...notDeleted });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }
  return board;
};

const createColumn = async (boardId, userId, data) => {
  await assertBoardAccess(boardId, userId);

  let position = data.position;
  if (position === undefined) {
    const maxCol = await Column.findOne({ board: boardId, ...notDeleted })
      .sort({ position: -1 })
      .select('position');
    position = maxCol ? maxCol.position + 1 : 0;
  }

  const column = await Column.create({
    title: data.title,
    board: boardId,
    position,
  });

  return column;
};

const updateColumn = async (columnId, userId, data) => {
  const { column, board } = await getColumnWithBoard(columnId);
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }

  if (data.title !== undefined) column.title = data.title;

  if (data.position !== undefined && data.position !== column.position) {
    await runWithTransaction(async (session) => {
      const columns = await applySession(
        Column.find({ board: column.board, ...notDeleted }).sort({ position: 1 }),
        session
      );

      const filtered = columns.filter((c) => c._id.toString() !== columnId);
      filtered.splice(data.position, 0, column);

      for (let i = 0; i < filtered.length; i++) {
        filtered[i].position = i;
        await filtered[i].save(sessionOpts(session));
      }
    });
  } else if (data.title !== undefined) {
    await column.save();
  }

  return Column.findById(columnId);
};

const deleteColumn = async (columnId, userId) => {
  const { column, board } = await getColumnWithBoard(columnId);
  if (!userHasAccess(board, userId)) {
    throw new ApiError(403, 'Access denied');
  }

  await runWithTransaction(async (session) => {
    const now = new Date();
    await Column.updateOne({ _id: columnId }, { deletedAt: now }, sessionOpts(session));
    await Card.updateMany({ column: columnId, ...notDeleted }, { deletedAt: now }, sessionOpts(session));

    const remaining = await applySession(
      Column.find({ board: column.board, ...notDeleted }).sort({ position: 1 }),
      session
    );

    for (let i = 0; i < remaining.length; i++) {
      remaining[i].position = i;
      await remaining[i].save(sessionOpts(session));
    }
  });

  return { message: 'Column deleted' };
};

module.exports = { createColumn, updateColumn, deleteColumn, getColumnWithBoard, assertBoardAccess };
