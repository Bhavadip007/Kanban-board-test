const cardService = require('../services/card.service');
const asyncHandler = require('../utils/asyncHandler');
const { boardRoom } = require('../socket');

const getBoardId = (board) => (board?._id ? board._id.toString() : board.toString());

const createCard = asyncHandler(async (req, res) => {
  const card = await cardService.createCard(req.params.id, req.user._id, req.body);
  const io = req.app.get('io');
  if (io) {
    io.to(boardRoom(getBoardId(card.board))).emit('card:create', {
      card,
      eventId: req.headers['x-event-id'],
    });
  }
  res.status(201).json({ success: true, data: card });
});

const updateCard = asyncHandler(async (req, res) => {
  const card = await cardService.updateCard(req.params.id, req.user._id, req.body);
  const io = req.app.get('io');
  if (io) {
    io.to(boardRoom(getBoardId(card.board))).emit('card:update', {
      card,
      eventId: req.headers['x-event-id'],
    });
  }
  res.json({ success: true, data: card });
});

const deleteCard = asyncHandler(async (req, res) => {
  const { card, board } = await cardService.getCardWithContext(req.params.id);
  const result = await cardService.deleteCard(req.params.id, req.user._id);
  const io = req.app.get('io');
  if (io) {
    io.to(boardRoom(board._id.toString())).emit('card:delete', {
      cardId: req.params.id,
      columnId: card.column.toString(),
      eventId: req.headers['x-event-id'],
    });
  }
  res.json({ success: true, data: result });
});

const moveCard = asyncHandler(async (req, res) => {
  const card = await cardService.moveCard(req.params.id, req.user._id, req.body);
  const io = req.app.get('io');
  if (io) {
    io.to(boardRoom(getBoardId(card.board))).emit('card:move', {
      card,
      eventId: req.headers['x-event-id'],
    });
  }
  res.json({ success: true, data: card });
});

module.exports = { createCard, updateCard, deleteCard, moveCard };
