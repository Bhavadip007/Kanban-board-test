const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Board = require('../models/Board');
const { verifyAccessToken } = require('../utils/token');
const { userHasAccess } = require('../services/board.service');

const boardRoom = (boardId) => `board:${boardId}`;

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const payload = verifyAccessToken(token);
    const user = await User.findOne({ _id: payload.sub, deletedAt: null }).select('_id name email');
    if (!user) {
      return next(new Error('Authentication required'));
    }

    socket.user = user;
    next();
  } catch {
    next(new Error('Authentication required'));
  }
};

const setupSocket = (io) => {
  io.use(authenticateSocket);

  const boardUsers = new Map();

  io.on('connection', (socket) => {
    socket.on('user:join', async ({ boardId }) => {
      try {
        const board = await Board.findOne({ _id: boardId, deletedAt: null });
        if (!board || !userHasAccess(board, socket.user._id)) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        if (socket.boardId) {
          socket.leave(boardRoom(socket.boardId));
          removeUserFromBoard(socket.boardId, socket.user._id.toString(), boardUsers);
          emitUserLeave(io, socket.boardId, socket.user, boardUsers);
        }

        socket.boardId = boardId;
        socket.join(boardRoom(boardId));
        addUserToBoard(boardId, socket.user, boardUsers);

        io.to(boardRoom(boardId)).emit('user:join', {
          user: { id: socket.user._id, name: socket.user.name },
          users: getBoardUsers(boardId, boardUsers),
        });
      } catch {
        socket.emit('error', { message: 'Failed to join board' });
      }
    });

    socket.on('user:leave', () => {
      if (!socket.boardId) return;
      const boardId = socket.boardId;
      socket.leave(boardRoom(boardId));
      removeUserFromBoard(boardId, socket.user._id.toString(), boardUsers);
      emitUserLeave(io, boardId, socket.user, boardUsers);
      socket.boardId = null;
    });

    socket.on('disconnect', () => {
      if (!socket.boardId) return;
      const boardId = socket.boardId;
      removeUserFromBoard(boardId, socket.user._id.toString(), boardUsers);
      emitUserLeave(io, boardId, socket.user, boardUsers);
    });
  });
};

const addUserToBoard = (boardId, user, boardUsers) => {
  if (!boardUsers.has(boardId)) {
    boardUsers.set(boardId, new Map());
  }
  boardUsers.get(boardId).set(user._id.toString(), { id: user._id, name: user.name });
};

const removeUserFromBoard = (boardId, userId, boardUsers) => {
  const users = boardUsers.get(boardId);
  if (users) {
    users.delete(userId);
    if (users.size === 0) {
      boardUsers.delete(boardId);
    }
  }
};

const getBoardUsers = (boardId, boardUsers) => {
  const users = boardUsers.get(boardId);
  return users ? Array.from(users.values()) : [];
};

const emitUserLeave = (io, boardId, user, boardUsers) => {
  io.to(boardRoom(boardId)).emit('user:leave', {
    user: { id: user._id, name: user.name },
    users: getBoardUsers(boardId, boardUsers),
  });
};

module.exports = { setupSocket, boardRoom };
