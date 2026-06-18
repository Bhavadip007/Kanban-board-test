const jwt = require('jsonwebtoken');
const config = require('../config');

const signAccessToken = (userId) =>
  jwt.sign({ sub: userId }, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiry });

const signRefreshToken = (userId, tokenVersion) =>
  jwt.sign({ sub: userId, version: tokenVersion }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
