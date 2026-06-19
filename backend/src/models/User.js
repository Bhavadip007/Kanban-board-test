const mongoose = require('mongoose');

const ROLES = ['manager', 'user'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'user' },
    refreshTokenHash: { type: String, select: false },
    tokenVersion: { type: Number, default: 0 },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
userSchema.index({ role: 1, deletedAt: 1 });

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
