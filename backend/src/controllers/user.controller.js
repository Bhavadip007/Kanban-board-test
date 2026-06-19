const userService = require('../services/user.service');
const asyncHandler = require('../utils/asyncHandler');

const listAssignableUsers = asyncHandler(async (req, res) => {
  const users = await userService.listAssignableUsers(req.user._id);
  res.json({ success: true, data: users });
});

module.exports = { listAssignableUsers };
