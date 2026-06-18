const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token:     { type: String, required: true, unique: true, index: true },
  expiresAt: { type: Date,   required: true },
});

// TTL index: MongoDB auto-removes expired tokens
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
