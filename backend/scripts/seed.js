require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User');
const Board = require('../src/models/Board');
const Column = require('../src/models/Column');
const Card = require('../src/models/Card');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/kanban';

const seed = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await Promise.all([
    Card.deleteMany({}),
    Column.deleteMany({}),
    Board.deleteMany({}),
    User.deleteMany({}),
  ]);

  const password = await bcrypt.hash('password123', 12);
  const user = await User.create({
    name: 'Demo User',
    email: 'demo@kanban.app',
    password,
  });

  const board1 = await Board.create({
    title: 'Product Roadmap',
    description: 'Q2 feature planning and delivery tracking',
    owner: user._id,
    members: [user._id],
  });

  const board2 = await Board.create({
    title: 'Marketing Campaign',
    description: 'Launch campaign tasks for the new product release',
    owner: user._id,
    members: [user._id],
  });

  const createColumnsForBoard = async (board) => {
    const titles = ['To Do', 'In Progress', 'Done'];
    return Column.insertMany(
      titles.map((title, position) => ({ title, board: board._id, position }))
    );
  };

  const [b1Cols, b2Cols] = await Promise.all([
    createColumnsForBoard(board1),
    createColumnsForBoard(board2),
  ]);

  const cardsData = [
    { board: board1, column: b1Cols[0], title: 'Define MVP scope', description: 'Document core features for initial release', priority: 'high', position: 0, dueDate: new Date('2026-07-01') },
    { board: board1, column: b1Cols[0], title: 'User research interviews', description: 'Schedule 5 customer interviews', priority: 'medium', position: 1 },
    { board: board1, column: b1Cols[0], title: 'Competitive analysis', description: 'Review Trello, Asana, and Linear', priority: 'low', position: 2 },
    { board: board1, column: b1Cols[1], title: 'Design system setup', description: 'Create color tokens and typography scale', priority: 'high', position: 0, assignee: user._id },
    { board: board1, column: b1Cols[1], title: 'API authentication flow', description: 'Implement JWT with refresh token rotation', priority: 'urgent', position: 1, assignee: user._id },
    { board: board1, column: b1Cols[2], title: 'Project scaffolding', description: 'Initialize repo with backend and frontend folders', priority: 'medium', position: 0 },
    { board: board2, column: b2Cols[0], title: 'Draft launch blog post', description: 'Highlight key features and use cases', priority: 'high', position: 0 },
    { board: board2, column: b2Cols[0], title: 'Social media calendar', description: 'Plan 2-week content schedule', priority: 'medium', position: 1 },
    { board: board2, column: b2Cols[1], title: 'Landing page copy', description: 'Write hero section and feature blocks', priority: 'high', position: 0, assignee: user._id },
    { board: board2, column: b2Cols[1], title: 'Email drip sequence', description: '3-email onboarding series for signups', priority: 'medium', position: 1 },
    { board: board2, column: b2Cols[2], title: 'Brand guidelines review', description: 'Finalize logo usage and color palette', priority: 'low', position: 0 },
  ];

  await Card.insertMany(
    cardsData.map((c) => ({
      title: c.title,
      description: c.description,
      board: c.board._id,
      column: c.column._id,
      position: c.position,
      priority: c.priority,
      assignee: c.assignee || null,
      dueDate: c.dueDate || null,
    }))
  );

  console.log('Seed completed');
  console.log('Demo user: demo@kanban.app / password123');
  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
