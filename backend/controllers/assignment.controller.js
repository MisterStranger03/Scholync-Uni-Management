const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model');
const Course     = require('../models/course.model');
const { escapeRegex } = require('../utils/security');

const canManageCourse = (course, user) =>
  user.role === 'admin' || course.professor.equals(user.id);

exports.createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueDate, maxGrade, fileUrl, fileName, topic } = req.body;
    const course = await Course.findOne({ _id: courseId, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!canManageCourse(course, req.user)) return res.status(403).json({ message: 'Not authorised.' });
    const assignment = await Assignment.create({
      course: course._id, title, description,
      dueDate: dueDate || null, maxGrade: maxGrade || 100,
      fileUrl: fileUrl || null, fileName: fileName || null,
      topic: topic || '', createdBy: req.user.id
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.listAssignments = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const filter = { course: course._id };
    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ title: re }, { description: re }];
    }
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50,  parseInt(req.query.limit) || 20);
    const total       = await Assignment.countDocuments(filter);
    const assignments = await Assignment.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(limit);
    res.status(200).json({ data: assignments, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');
    if (!assignment || !assignment.course.university.equals(req.user.university)) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (!canManageCourse(assignment.course, req.user)) return res.status(403).json({ message: 'Not authorised.' });
    const { title, description, dueDate, maxGrade, topic } = req.body;
    if (title       !== undefined) assignment.title       = title;
    if (description !== undefined) assignment.description = description;
    if (dueDate     !== undefined) assignment.dueDate     = dueDate || null;
    if (maxGrade    !== undefined) assignment.maxGrade    = maxGrade;
    if (topic       !== undefined) assignment.topic       = topic || '';
    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');
    if (!assignment || !assignment.course.university.equals(req.user.university)) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (!canManageCourse(assignment.course, req.user)) return res.status(403).json({ message: 'Not authorised.' });
    await Submission.deleteMany({ assignment: assignment._id });
    await Assignment.findByIdAndDelete(assignment._id);
    res.json({ message: 'Assignment deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
    const assignment = await Assignment.findById(req.params.id).populate('course');
    if (!assignment || !assignment.course.university.equals(req.user.university)) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (assignment.dueDate && new Date() > assignment.dueDate) {
      return res.status(400).json({ message: 'Deadline has passed.' });
    }
    const { body, fileUrl, fileName } = req.body;
    const existing = await Submission.findOne({ assignment: assignment._id, student: req.user.id });
    if (existing) {
      existing.body = body || ''; existing.fileUrl = fileUrl || null; existing.fileName = fileName || null;
      await existing.save();
      return res.status(200).json(existing);
    }
    const submission = await Submission.create({ assignment: assignment._id, student: req.user.id, body: body || '', fileUrl: fileUrl || null, fileName: fileName || null });
    res.status(201).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.getMySubmission = async (req, res) => {
  try {
    // Verify assignment belongs to user's university before exposing submission data
    const assignment = await Assignment.findById(req.params.id).populate('course', 'university');
    if (!assignment || !assignment.course.university.equals(req.user.university)) {
      return res.status(404).json({ message: 'No submission found.' });
    }
    const submission = await Submission.findOne({ assignment: req.params.id, student: req.user.id });
    if (!submission) return res.status(404).json({ message: 'No submission found.' });
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');
    if (!assignment || !assignment.course.university.equals(req.user.university)) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (!canManageCourse(assignment.course, req.user)) return res.status(403).json({ message: 'Not authorised.' });
    const submission = await Submission.findOne({ assignment: assignment._id, student: req.params.studentId });
    if (!submission) return res.status(404).json({ message: 'Submission not found.' });
    submission.grade    = req.body.grade;
    submission.feedback = req.body.feedback || null;
    submission.gradedBy = req.user.id;
    submission.gradedAt = new Date();
    await submission.save();
    res.status(200).json(submission);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.listSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');
    if (!assignment || !assignment.course.university.equals(req.user.university)) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }
    if (!canManageCourse(assignment.course, req.user)) return res.status(403).json({ message: 'Not authorised.' });
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const total       = await Submission.countDocuments({ assignment: assignment._id });
    const submissions = await Submission.find({ assignment: assignment._id })
      .populate('student', 'name email').sort('createdAt').skip((page - 1) * limit).limit(limit);
    res.status(200).json({ data: submissions, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
