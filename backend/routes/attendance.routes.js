const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/attendance.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/',                          requireRole('admin', 'professor'), ctrl.markAttendance);
router.get('/my',                         requireRole('student'),            ctrl.getMyAttendance);
router.get('/course/:courseId/mine',      requireRole('student'),            ctrl.getMyCourseAttendance);
router.get('/course/:courseId/stats',     requireRole('admin', 'professor'), ctrl.getCourseAttendanceStats);
router.get('/course/:courseId',           requireRole('admin', 'professor'), ctrl.getCourseAttendance);

module.exports = router;
