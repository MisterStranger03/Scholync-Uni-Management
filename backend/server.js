const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

dotenv.config();

const authRoutes       = require('./routes/auth.routes');
const universityRoutes = require('./routes/university.routes');
const adminRoutes      = require('./routes/admin.routes');
const courseRoutes     = require('./routes/course.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const superadminRoutes = require('./routes/superadmin.routes');
const uploadRoutes     = require('./routes/upload.routes');

const app = express();

// --- Security headers ---
app.use(helmet());

// Force HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// --- CORS ---
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim().replace(/\/$/, ''))
  : ['http://localhost:4200'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(clean)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

// --- Rate limiting ---
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const apiLimiter  = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });

app.use(express.json({ limit: '10kb' }));

// --- NoSQL injection protection ---
// Strip keys containing $ or . from request body and params
function stripBadKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  for (const key of Object.keys(obj)) {
    if (/[$.]/.test(key)) delete obj[key];
    else stripBadKeys(obj[key]);
  }
  return obj;
}
app.use((req, res, next) => {
  if (req.body)   stripBadKeys(req.body);
  if (req.params) stripBadKeys(req.params);
  next();
});

const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- Database ---
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('DB connection error', err));

// --- Routes ---
app.use('/api/auth',         authLimiter, authRoutes);
app.use('/api/universities', apiLimiter,  universityRoutes);
app.use('/api/admin',        apiLimiter,  adminRoutes);
app.use('/api/courses',      apiLimiter,  courseRoutes);
app.use('/api/assignments',  apiLimiter,  assignmentRoutes);
app.use('/api/attendance',   apiLimiter,  attendanceRoutes);
app.use('/api/superadmin',   apiLimiter,  superadminRoutes);
app.use('/api/upload',       apiLimiter,  uploadRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
