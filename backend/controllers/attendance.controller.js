const Attendance = require('../models/attendance.model');
const Course     = require('../models/course.model');

function toDateKey(d) {
  const dt = new Date(d);
  dt.setUTCHours(0, 0, 0, 0);
  return dt;
}

// POST /api/attendance — professor or admin marks attendance for a course on a given date
exports.markAttendance = async (req, res) => {
  try {
    const { courseId, date, records } = req.body;
    const course = await Course.findOne({ _id: courseId, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'professor' && !course.professor.equals(req.user.id)) {
      return res.status(403).json({ message: 'Not your course.' });
    }
    const doc = await Attendance.findOneAndUpdate(
      { course: courseId, date: toDateKey(date || new Date()) },
      { $set: { markedBy: req.user.id, university: req.user.university, records: records.map(r => ({ student: r.studentId, status: r.status })) } },
      { upsert: true, new: true }
    );
    res.status(200).json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/attendance/course/:courseId — all sessions for a course
exports.getCourseAttendance = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'professor' && !course.professor.equals(req.user.id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const sessions = await Attendance.find({ course: req.params.courseId })
      .populate('records.student', 'name email')
      .populate('markedBy', 'name')
      .sort('-date');
    res.status(200).json(sessions);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/attendance/course/:courseId/stats — per-student totals
exports.getCourseAttendanceStats = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, university: req.user.university }).populate('students', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'professor' && !course.professor.equals(req.user.id)) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    const sessions = await Attendance.find({ course: req.params.courseId });
    const statsMap = {};
    for (const s of course.students) statsMap[s._id.toString()] = { student: s, present: 0, late: 0, absent: 0 };
    for (const session of sessions) {
      for (const r of session.records) {
        if (statsMap[r.student.toString()]) statsMap[r.student.toString()][r.status]++;
      }
    }
    const total = sessions.length;
    const stats = Object.values(statsMap).map(s => ({
      student: s.student, present: s.present, late: s.late, absent: s.absent, total,
      pct: total ? Math.round(((s.present + s.late) / total) * 100) : 0
    }));
    res.status(200).json({ total, stats });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/attendance/course/:courseId/mine — student's own session-by-session view
exports.getMyCourseAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
    const course = await Course.findOne({ _id: req.params.courseId, university: req.user.university, students: req.user.id });
    if (!course) return res.status(404).json({ message: 'Course not found or not enrolled.' });
    const sessions = await Attendance.find({ course: req.params.courseId }).sort('-date');
    const result = sessions.map(s => {
      const r = s.records.find(r => r.student.equals(req.user.id));
      return { date: s.date, status: r ? r.status : 'absent' };
    });
    const present = result.filter(r => r.status === 'present').length;
    const late    = result.filter(r => r.status === 'late').length;
    const total   = result.length;
    res.status(200).json({ sessions: result, present, late, absent: total - present - late, total, pct: total ? Math.round(((present + late) / total) * 100) : null });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/attendance/my — student's attendance summary across all enrolled courses
exports.getMyAttendance = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
    const courses = await Course.find({ university: req.user.university, students: req.user.id });
    const result = [];
    for (const course of courses) {
      const sessions = await Attendance.find({ course: course._id });
      let present = 0, late = 0, absent = 0;
      for (const s of sessions) {
        const r = s.records.find(r => r.student.equals(req.user.id));
        if (r?.status === 'present') present++;
        else if (r?.status === 'late') late++;
        else absent++;
      }
      const total = sessions.length;
      result.push({ courseId: course._id, courseName: course.name, courseCode: course.code, present, late, absent, total, pct: total ? Math.round(((present + late) / total) * 100) : null });
    }
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};
