const mongoose = require('mongoose');

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const cardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    column: { type: mongoose.Schema.Types.ObjectId, ref: 'Column', required: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    position: { type: Number, required: true, default: 0 },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    dueDate: { type: Date, default: null },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

cardSchema.index({ column: 1, deletedAt: 1, position: 1 });
cardSchema.index({ board: 1, deletedAt: 1 });

module.exports = mongoose.model('Card', cardSchema);
module.exports.PRIORITIES = PRIORITIES;
