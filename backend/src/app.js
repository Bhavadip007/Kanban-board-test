const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const config = require('./config');
const errorHandler = require('./middleware/error.middleware');
const { apiLimiter } = require('./middleware/rateLimiter.middleware');

const authRoutes = require('./routes/auth.routes');
const boardRoutes = require('./routes/board.routes');
const columnRoutes = require('./routes/column.routes');
const columnCardRoutes = require('./routes/card.routes');
const cardRoutes = require('./routes/cardActions.routes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.use(
  morgan((tokens, req, res) =>
    JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      responseTime: Number(tokens['response-time'](req, res)),
      timestamp: new Date().toISOString(),
    })
  )
);

app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/boards', apiLimiter, boardRoutes);
app.use('/api/v1/columns', apiLimiter, columnRoutes);
app.use('/api/v1/columns', apiLimiter, columnCardRoutes);
app.use('/api/v1/cards', apiLimiter, cardRoutes);

app.use((req, res, next) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use(errorHandler);

module.exports = app;
