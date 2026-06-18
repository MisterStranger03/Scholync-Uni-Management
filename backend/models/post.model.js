const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  course:   { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',   required: true },
  type:     { type: String, enum: ['announcement', 'material'], required: true },
  title:    { type: String, required: true },
  body:     { type: String, default: '' },
  fileUrl:  { type: String, default: null },
  fileName: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Post', PostSchema);
