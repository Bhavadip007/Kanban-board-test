require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const config = {
  env,
  isProduction: env === 'production',
  port: parseInt(process.env.PORT, 10) || 5050,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: '15m',
    refreshExpiry: '7d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookie: {
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: env === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
};

if (!config.jwt.accessSecret || !config.jwt.refreshSecret) {
  throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be set');
}

module.exports = config;
