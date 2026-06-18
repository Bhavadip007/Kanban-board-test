const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

boardSchema.index({ owner: 1, deletedAt: 1 });
boardSchema.index({ members: 1, deletedAt: 1 });

module.exports = mongoose.model('Board', boardSchema);
