const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication required');
  }

  const token = authHeader.slice(7);

  try {
    const { verifyAccessToken } = require('../utils/token');
    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select('_id name email role');

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

const requireManager = asyncHandler(async (req, res, next) => {
  if (req.user.role !== 'manager') {
    throw new ApiError(403, 'Manager access required');
  }
  next();
});

const isBoardManager = (board, userId) => board.owner.toString() === userId.toString();

const userHasBoardAccess = (board, userId) => {
  const uid = userId.toString();
  return board.owner.toString() === uid || board.members.some((m) => m.toString() === uid);
};

module.exports = {
  authenticate,
  requireManager,
  isBoardManager,
  userHasBoardAccess,
};
