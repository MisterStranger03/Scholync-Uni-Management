const User   = require('../models/user.model');
const Course = require('../models/course.model');
const { escapeRegex } = require('../utils/security');

// GET /api/admin/users — list professors & students in the admin's university
exports.listUsers = async (req, res) => {
  try {
    let filter = { university: req.user.university, role: { $in: ['professor', 'student'] } };
    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: re }, { email: re }];
    }
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter, '-password -otp -otpExpires')
      .sort('-createdAt').skip((page - 1) * limit).limit(limit);
    res.status(200).json({ data: users, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/admin/users/:id/approve|reject
// Cannot change approval status of another admin account.
const setApprovalStatus = (status) => async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, university: req.user.university });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot change admin approval status.' });
    user.approvalStatus = status;
    await user.save();
    res.status(200).json({ message: `User ${status}.` });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.approveUser = setApprovalStatus('approved');
exports.rejectUser  = setApprovalStatus('rejected');

// GET /api/admin/professors — approved professors for course-creation dropdown
exports.listProfessors = async (req, res) => {
  try {
    const professors = await User.find(
      { university: req.user.university, role: 'professor', approvalStatus: 'approved', isVerified: true },
      '_id name email'
    ).sort('name');
    res.status(200).json(professors);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  try {
    const uniId = req.user.university;
    const [students, professors, courses] = await Promise.all([
      User.countDocuments({ university: uniId, role: 'student',   isVerified: true }),
      User.countDocuments({ university: uniId, role: 'professor', isVerified: true }),
      Course.find({ university: uniId }, 'students'),
    ]);
    const enrollments = courses.reduce((sum, c) => sum + c.students.length, 0);
    res.status(200).json({ students, professors, courses: courses.length, enrollments });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
