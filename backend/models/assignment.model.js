const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  course:      { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  dueDate:     { type: Date,   default: null },
  maxGrade:    { type: Number, default: 100 },
  fileUrl:     { type: String, default: null },
  fileName:    { type: String, default: null },
  topic:       { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Assignment', AssignmentSchema);
