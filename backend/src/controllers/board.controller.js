const boardService = require('../services/board.service');
const asyncHandler = require('../utils/asyncHandler');

const listBoards = asyncHandler(async (req, res) => {
  const boards = await boardService.listBoards(req.user._id);
  res.json({ success: true, data: boards });
});

const createBoard = asyncHandler(async (req, res) => {
  const board = await boardService.createBoard(req.user._id, req.body);
  res.status(201).json({ success: true, data: board });
});

const getBoard = asyncHandler(async (req, res) => {
  const board = await boardService.getBoardById(req.params.id, req.user._id);
  res.json({ success: true, data: board });
});

const updateBoard = asyncHandler(async (req, res) => {
  const board = await boardService.updateBoard(req.params.id, req.user._id, req.body);
  res.json({ success: true, data: board });
});

const deleteBoard = asyncHandler(async (req, res) => {
  const result = await boardService.deleteBoard(req.params.id, req.user._id);
  res.json({ success: true, data: result });
});

module.exports = { listBoards, createBoard, getBoard, updateBoard, deleteBoard };
