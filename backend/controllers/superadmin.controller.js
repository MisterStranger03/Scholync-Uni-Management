const jwt        = require('jsonwebtoken');
const University = require('../models/university.model');
const User       = require('../models/user.model');
const { escapeRegex } = require('../utils/security');

// Credentials stored as env vars only — never in the database.
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email !== process.env.SUPER_ADMIN_EMAIL || password !== process.env.SUPER_ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid superadmin credentials.' });
    }
    const token = jwt.sign({ role: 'superadmin', email }, process.env.SUPER_ADMIN_JWT_SECRET, { expiresIn: '8h' });
    res.json({ accessToken: token });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [universities, totalUsers, pendingUsers, students, professors, admins] = await Promise.all([
      University.countDocuments(),
      User.countDocuments(),
      User.countDocuments({ approvalStatus: 'pending' }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'professor' }),
      User.countDocuments({ role: 'admin' }),
    ]);
    res.json({ universities, totalUsers, pendingUsers, students, professors, admins });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getUniversities = async (req, res) => {
  try {
    const unis = await University.find().populate('adminUser', 'name email').sort({ createdAt: -1 });
    const result = await Promise.all(unis.map(async (u) => {
      const [userCount, pendingCount] = await Promise.all([
        User.countDocuments({ university: u._id }),
        User.countDocuments({ university: u._id, approvalStatus: 'pending' }),
      ]);
      return { ...u.toObject(), userCount, pendingCount };
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateUniversity = async (req, res) => {
  try {
    const { name, domain, address } = req.body;
    const update = {};
    if (name    !== undefined) update.name    = name;
    if (domain  !== undefined) update.domain  = domain;
    if (address !== undefined) update.address = address;
    const uni = await University.findByIdAndUpdate(req.params.id, update, { new: true }).populate('adminUser', 'name email');
    if (!uni) return res.status(404).json({ message: 'University not found.' });
    res.json(uni);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteUniversity = async (req, res) => {
  try {
    await User.deleteMany({ university: req.params.id });
    await University.findByIdAndDelete(req.params.id);
    res.json({ message: 'University and all users deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { universityId, role, status, search } = req.query;
    const filter = {};
    if (universityId) filter.university = universityId;
    if (role)         filter.role = role;
    if (status)       filter.approvalStatus = status;
    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { name:  { $regex: escaped, $options: 'i' } },
        { email: { $regex: escaped, $options: 'i' } },
      ];
    }
    const users = await User.find(filter, '-password -otp -otpExpires')
      .populate('university', 'name slug').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { name, email, role, approvalStatus } = req.body;
    const update = {};
    if (name           !== undefined) update.name           = name;
    if (email          !== undefined) update.email          = email;
    if (role           !== undefined) update.role           = role;
    if (approvalStatus !== undefined) update.approvalStatus = approvalStatus;
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, select: '-password -otp -otpExpires' })
      .populate('university', 'name slug');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
