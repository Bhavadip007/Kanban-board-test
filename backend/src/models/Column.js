const mongoose = require('mongoose');

const columnSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true },
    position: { type: Number, required: true, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

columnSchema.index({ board: 1, deletedAt: 1, position: 1 });

module.exports = mongoose.model('Column', columnSchema);
