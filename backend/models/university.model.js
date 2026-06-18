const mongoose = require('mongoose');

const UniversitySchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true },
  slug:      { type: String, unique: true, sparse: true, lowercase: true, default: null },
  domain:    { type: String, default: null },
  address:   { type: String, default: null },
  adminUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

module.exports = mongoose.model('University', UniversitySchema);
