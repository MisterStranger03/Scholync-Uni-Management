const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  code:        { type: String, required: true },
  description: { type: String, default: '' },
  university:  { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  professor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  students:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  capacity:    { type: Number, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Course', CourseSchema);
