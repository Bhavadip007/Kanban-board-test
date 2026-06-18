const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');
const { setupSocket } = require('./socket');

const start = async () => {
  await connectDB();

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: config.clientUrl,
      credentials: true,
    },
  });

  app.set('io', io);
  setupSocket(io);

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} (${config.env})`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
