const config = require('../config');
const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { sanitizeAuthInput } = require('../utils/sanitize');

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.maxAge,
    path: '/api/v1/auth',
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    path: '/api/v1/auth',
  });
};

const register = asyncHandler(async (req, res) => {
  const sanitized = sanitizeAuthInput(req.body);
  const result = await authService.register(sanitized);
  setRefreshCookie(res, result.refreshToken);
  res.status(201).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const login = asyncHandler(async (req, res) => {
  const sanitized = sanitizeAuthInput(req.body);
  const result = await authService.login(sanitized);
  setRefreshCookie(res, result.refreshToken);
  res.json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies.refreshToken;
  const result = await authService.refresh(token);
  setRefreshCookie(res, result.refreshToken);
  res.json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id);
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out' });
});

const me = asyncHandler(async (req, res) => {
  const user = await authService.getProfile(req.user._id);
  res.json({ success: true, data: user });
});

module.exports = { register, login, refresh, logout, me };
