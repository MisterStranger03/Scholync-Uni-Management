const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/token-blacklist.model');

exports.verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) return res.status(401).json({ message: 'No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Reject tokens that have been explicitly blacklisted (e.g. after logout)
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) return res.status(401).json({ message: 'Session expired. Please log in again.' });

    req.user = decoded.user; // { id, role, university, universitySlug }
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Factory: returns middleware that restricts access to the specified roles
exports.requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'You do not have permission to perform this action.' });
  }
  next();
};
