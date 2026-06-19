const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/token');

const SALT_ROUNDS = 12;

const hashPassword = async (password) => bcrypt.hash(password, SALT_ROUNDS);

const hashRefreshToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const register = async ({ name, email, password }) => {
  const existing = await User.findOne({ email, deletedAt: null });
  if (existing) {
    throw new ApiError(409, 'Email already registered');
  }

  const hashedPassword = await hashPassword(password);
  const user = await User.create({ name, email, password: hashedPassword });

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email, deletedAt: null }).select('+password');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { accessToken, refreshToken } = await issueTokens(user);

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken,
  };
};

const issueTokens = async (user) => {
  const tokenVersion = user.tokenVersion;
  const accessToken = signAccessToken(user._id.toString());
  const refreshToken = signRefreshToken(user._id.toString(), tokenVersion);

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  await user.save();

  return { accessToken, refreshToken };
};

const refresh = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, 'Refresh token required');
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select('+refreshTokenHash');
  if (!user) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  if (payload.version !== user.tokenVersion) {
    throw new ApiError(401, 'Invalid refresh token');
  }

  const tokenHash = hashRefreshToken(refreshToken);
  if (user.refreshTokenHash !== tokenHash) {
    user.tokenVersion += 1;
    user.refreshTokenHash = undefined;
    await user.save();
    throw new ApiError(401, 'Invalid refresh token');
  }

  user.tokenVersion += 1;
  const accessToken = signAccessToken(user._id.toString());
  const newRefreshToken = signRefreshToken(user._id.toString(), user.tokenVersion);
  user.refreshTokenHash = hashRefreshToken(newRefreshToken);
  await user.save();

  return {
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { tokenVersion: 1 },
    $unset: { refreshTokenHash: 1 },
  });
};

const getProfile = async (userId) => {
  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

module.exports = { register, login, refresh, logout, getProfile };
