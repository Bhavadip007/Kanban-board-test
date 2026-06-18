const columnService = require('../services/column.service');
const asyncHandler = require('../utils/asyncHandler');
const { boardRoom } = require('../socket');

const createColumn = asyncHandler(async (req, res) => {
  const column = await columnService.createColumn(req.params.id, req.user._id, req.body);
  const io = req.app.get('io');
  if (io) {
    io.to(boardRoom(req.params.id)).emit('column:create', {
      column,
      eventId: req.headers['x-event-id'],
    });
  }
  res.status(201).json({ success: true, data: column });
});

const updateColumn = asyncHandler(async (req, res) => {
  const column = await columnService.updateColumn(req.params.id, req.user._id, req.body);
  const io = req.app.get('io');
  if (io) {
    io.to(boardRoom(column.board.toString())).emit('column:update', {
      column,
      eventId: req.headers['x-event-id'],
    });
  }
  res.json({ success: true, data: column });
});

const deleteColumn = asyncHandler(async (req, res) => {
  const { board } = await columnService.getColumnWithBoard(req.params.id);
  const result = await columnService.deleteColumn(req.params.id, req.user._id);
  const io = req.app.get('io');
  if (io) {
    io.to(boardRoom(board._id.toString())).emit('column:delete', {
      columnId: req.params.id,
      eventId: req.headers['x-event-id'],
    });
  }
  res.json({ success: true, data: result });
});

module.exports = { createColumn, updateColumn, deleteColumn };
