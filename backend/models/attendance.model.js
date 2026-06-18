const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  course:     { type: mongoose.Schema.Types.ObjectId, ref: 'Course',     required: true },
  date:       { type: Date, required: true },
  markedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',       required: true },
  university: { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status:  { type: String, enum: ['present', 'absent', 'late'], default: 'absent' },
  }],
}, { timestamps: true });

// One attendance document per course per day
AttendanceSchema.index({ course: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
