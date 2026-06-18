const User       = require('../models/user.model');
const University = require('../models/university.model');
const TokenBlacklist = require('../models/token-blacklist.model');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');
const { sendOtpEmail } = require('../config/mailer');

const EMAIL_REGEX    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>/?\\|`~]).{8,}$/;

// --- Register (Step 1) ---
// Resolves/creates university, hashes password, generates 6-digit OTP, sends email.
// Admin role auto-creates a new university; professor/student join an existing one.
exports.register = async (req, res) => {
  try {
    const { name, email, password, dob, role, universityName, universityId } = req.body;

    if (!EMAIL_REGEX.test(email)) return res.status(400).json({ message: 'Invalid email.' });
    if (!PASSWORD_REGEX.test(password)) return res.status(400).json({ message: 'Password too weak.' });

    const existing = await User.findOne({ email });
    if (existing?.isVerified) return res.status(400).json({ message: 'Email already registered.' });

    let university;
    if (role === 'admin') {
      // Admin registers a brand-new university
      university = await University.create({ name: universityName, slug: generateSlug(universityName) });
    } else {
      // Professor/student join an existing university
      university = await University.findById(universityId);
      if (!university) return res.status(400).json({ message: 'University not found.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Admins are auto-approved; others wait for admin approval
    const approvalStatus = role === 'admin' ? 'approved' : 'pending';

    await User.create({
      name, email, password: hashedPassword, dob, role,
      university: university._id, approvalStatus,
      otp, otpExpires: new Date(Date.now() + 10 * 60 * 1000)
    });

    sendOtpEmail(email, otp, 'verification').catch(err => console.error('[mailer]', err.message));

    res.status(200).json({ message: 'OTP sent to your email.', slug: university.slug });
  } catch (error) {
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// --- Verify OTP (Step 2) ---
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });

    user.isVerified = true;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    const message = user.approvalStatus === 'pending'
      ? 'Verified! Your account is pending admin approval.'
      : 'Verified! You can now log in.';
    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

// --- Login ---
exports.login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email }).populate('university', 'name slug');
    if (!user?.isVerified) return res.status(401).json({ message: 'Invalid credentials or unverified account.' });
    if (user.approvalStatus === 'pending')  return res.status(403).json({ message: 'Account pending admin approval.' });
    if (user.approvalStatus === 'rejected') return res.status(403).json({ message: 'Account rejected by admin.' });

    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = jwt.sign(
      { user: { id: user.id, name: user.name, role: user.role, university: user.university._id, universitySlug: user.university.slug } },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.status(200).json({ message: 'Login successful!', accessToken: token, slug: user.university.slug });
  } catch (error) {
    res.status(500).json({ message: 'Server error during login.' });
  }
};

// --- Logout (blacklists the JWT) ---
exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token);
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 8 * 3600 * 1000);
      await TokenBlacklist.create({ token, expiresAt }).catch(() => {});
    }
    res.status(200).json({ message: 'Logged out successfully.' });
  } catch {
    res.status(200).json({ message: 'Logged out successfully.' });
  }
};

// --- Forgot Password (always returns same message to prevent email enumeration) ---
exports.forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email, isVerified: true });
    if (user) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      sendOtpEmail(req.body.email, otp, 'reset').catch(err => console.error('[mailer]', err.message));
    }
    res.status(200).json({ message: 'If that email is registered, an OTP has been sent.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// --- Reset Password ---
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!PASSWORD_REGEX.test(newPassword)) return res.status(400).json({ message: 'Password too weak.' });

    const user = await User.findOne({ email, otp, otpExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP.' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id, '-password -otp -otpExpires').populate('university', 'name slug');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, dob } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (name) user.name = name;
    if (dob)  user.dob  = dob;
    await user.save();
    res.status(200).json({ message: 'Profile updated.', name: user.name, dob: user.dob });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    // Delete old picture from Cloudinary to avoid orphaned storage
    if (user.profilePicture) {
      const parts    = user.profilePicture.split('/');
      const filename = parts[parts.length - 1].split('.')[0];
      const folder   = parts.slice(parts.indexOf('scholync'), parts.length - 1).join('/');
      await cloudinary.uploader.destroy(`${folder}/${filename}`).catch(() => {});
    }

    user.profilePicture = req.file.path;
    await user.save();
    res.json({ message: 'Profile picture updated.', profilePicture: user.profilePicture });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!PASSWORD_REGEX.test(newPassword)) return res.status(400).json({ message: 'Password too weak.' });

    const user = await User.findById(req.user.id);
    if (!await bcrypt.compare(currentPassword, user.password)) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Helpers
function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
