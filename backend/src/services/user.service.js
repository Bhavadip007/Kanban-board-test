const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const listAssignableUsers = async (requesterId) => {
  const requester = await User.findOne({ _id: requesterId, deletedAt: null });
  if (!requester || requester.role !== 'manager') {
    throw new ApiError(403, 'Manager access required');
  }

  return User.find({ role: 'user', deletedAt: null, _id: { $ne: requesterId } })
    .select('name email role')
    .sort({ name: 1 })
    .lean();
};

module.exports = { listAssignableUsers };
