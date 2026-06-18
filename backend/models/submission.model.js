const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
  body:       { type: String, default: '' },
  fileUrl:    { type: String, default: null },
  fileName:   { type: String, default: null },
  grade:      { type: Number, default: null },
  feedback:   { type: String, default: null },
  gradedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  gradedAt:   { type: Date,   default: null },
}, { timestamps: true });

// One submission per student per assignment
SubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
