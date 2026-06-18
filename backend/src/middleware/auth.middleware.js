const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select('_id name email');

    if (!user) {
      throw new ApiError(401, 'Authentication required');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(401, 'Authentication required');
  }
});

const authorizeBoardAccess = asyncHandler(async (req, res, next) => {
  const Board = require('../models/Board');
  const boardId = req.params.id || req.params.boardId || req.boardId;

  if (!boardId) {
    throw new ApiError(403, 'Access denied');
  }

  const board = await Board.findOne({ _id: boardId, deletedAt: null });
  if (!board) {
    throw new ApiError(404, 'Board not found');
  }

  const userId = req.user._id.toString();
  const isOwner = board.owner.toString() === userId;
  const isMember = board.members.some((m) => m.toString() === userId);

  if (!isOwner && !isMember) {
    throw new ApiError(403, 'Access denied');
  }

  req.board = board;
  next();
});

module.exports = { authenticate, authorizeBoardAccess };
