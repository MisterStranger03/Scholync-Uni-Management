const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  dob:            { type: Date,   required: true },
  role:           { type: String, enum: ['admin', 'professor', 'student'], required: true },
  university:     { type: mongoose.Schema.Types.ObjectId, ref: 'University', required: true },
  approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isVerified:     { type: Boolean, default: false },
  profilePicture: { type: String, default: null },
  otp:            { type: String, default: null },
  otpExpires:     { type: Date,   default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
