const Course = require('../models/course.model');
const Post   = require('../models/post.model');
const User   = require('../models/user.model');
const { escapeRegex } = require('../utils/security');

// All queries are scoped to req.user.university for multi-tenant isolation.

const canAccessCourse = (course, user) => {
  if (user.role === 'admin') return true;
  if (user.role === 'professor') return course.professor.equals(user.id);
  return course.students.some(s => s.equals(user.id));
};

exports.createCourse = async (req, res) => {
  try {
    const { name, code, description, professorId, capacity } = req.body;
    let professor = req.user.id;
    if (req.user.role === 'admin') {
      // Validate the professor belongs to this university
      const profUser = await User.findOne({ _id: professorId, university: req.user.university, role: 'professor' });
      if (!profUser) return res.status(400).json({ message: 'Professor not found in your university.' });
      professor = professorId;
    }
    const course = await Course.create({ name, code, description, university: req.user.university, professor, capacity: capacity || null });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.listCourses = async (req, res) => {
  try {
    let filter = { university: req.user.university };
    if (req.user.role === 'professor') filter.professor = req.user.id;
    else if (req.user.role === 'student') filter.students = req.user.id;

    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: re }, { code: re }];
    }

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 50);
    const total   = await Course.countDocuments(filter);
    const courses = await Course.find(filter)
      .populate('professor', 'name email')
      .populate('students', 'name email')
      .skip((page - 1) * limit).limit(limit);
    res.status(200).json({ data: courses, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.listAvailableCourses = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
    let filter = { university: req.user.university, students: { $ne: req.user.id } };
    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ name: re }, { code: re }];
    }
    const page    = Math.max(1, parseInt(req.query.page)  || 1);
    const limit   = Math.min(100, parseInt(req.query.limit) || 50);
    const total   = await Course.countDocuments(filter);
    const courses = await Course.find(filter).populate('professor', 'name email').skip((page - 1) * limit).limit(limit);
    res.status(200).json({ data: courses, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role !== 'admin' && !course.professor.equals(req.user.id)) {
      return res.status(403).json({ message: 'Not authorised.' });
    }
    const { name, code, description, capacity, professorId } = req.body;
    if (name        !== undefined) course.name        = name;
    if (code        !== undefined) course.code        = code;
    if (description !== undefined) course.description = description;
    if (capacity    !== undefined) course.capacity    = capacity || null;
    if (professorId !== undefined && req.user.role === 'admin') course.professor = professorId;
    await course.save();
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
    await Post.deleteMany({ course: course._id });
    await Course.findByIdAndDelete(course._id);
    res.json({ message: 'Course deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.enrollInCourse = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (course.capacity && course.students.length >= course.capacity) {
      return res.status(400).json({ message: 'Course is at capacity.' });
    }
    if (!course.students.some(s => s.equals(req.user.id))) {
      course.students.push(req.user.id);
      await course.save();
    }
    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.unenrollFromCourse = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    course.students = course.students.filter(id => !id.equals(req.user.id));
    await course.save();
    res.status(200).json({ message: 'Unenrolled.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.removeStudent = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role !== 'admin' && !course.professor.equals(req.user.id)) {
      return res.status(403).json({ message: 'Not authorised.' });
    }
    course.students = course.students.filter(s => s.toString() !== req.params.studentId);
    await course.save();
    res.json({ message: 'Student removed.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.listPosts = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (!canAccessCourse(course, req.user)) return res.status(403).json({ message: 'No access.' });
    const filter = { course: course._id };
    if (req.query.search) {
      const re = new RegExp(escapeRegex(req.query.search), 'i');
      filter.$or = [{ title: re }, { body: re }];
    }
    const posts = await Post.find(filter).populate('author', 'name role').sort('-createdAt');
    res.status(200).json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.createPost = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'student') return res.status(403).json({ message: 'Students cannot post.' });
    const { type, title, body, fileUrl, fileName } = req.body;
    const post = await Post.create({ course: course._id, author: req.user.id, type, title, body, fileUrl: fileUrl || null, fileName: fileName || null });
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'student') return res.status(403).json({ message: 'Students cannot edit posts.' });
    const post = await Post.findOne({ _id: req.params.postId, course: course._id });
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    const { title, body, type } = req.body;
    if (title !== undefined) post.title = title;
    if (body  !== undefined) post.body  = body;
    if (type  !== undefined) post.type  = type;
    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (req.user.role === 'student') return res.status(403).json({ message: 'Students cannot delete posts.' });
    await Post.findOneAndDelete({ _id: req.params.postId, course: course._id });
    res.json({ message: 'Post deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Gradebook: all students × all assignments for admin/professor view
exports.getGradebook = async (req, res) => {
  try {
    const Assignment = require('../models/assignment.model');
    const Submission = require('../models/submission.model');
    if (req.user.role === 'student') return res.status(403).json({ message: 'Students cannot view the gradebook.' });
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university }).populate('students', 'name email');
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const assignments = await Assignment.find({ course: course._id }).sort('createdAt').select('_id title maxGrade dueDate topic');
    const submissions = await Submission.find({ assignment: { $in: assignments.map(a => a._id) } });
    const subMap = {};
    submissions.forEach(s => { subMap[`${s.assignment}_${s.student}`] = s; });
    const rows = course.students.map(student => ({
      student: { _id: student._id, name: student.name, email: student.email },
      grades:  assignments.map(a => {
        const sub = subMap[`${a._id}_${student._id}`];
        return { assignmentId: a._id, submitted: !!sub, grade: sub?.grade ?? null, feedback: sub?.feedback ?? null };
      }),
    }));
    res.json({ assignments, rows });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// Student's own grades for a course
exports.getMyGrades = async (req, res) => {
  try {
    const Assignment = require('../models/assignment.model');
    const Submission = require('../models/submission.model');
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only.' });
    const course = await Course.findOne({ _id: req.params.id, university: req.user.university });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    const assignments = await Assignment.find({ course: course._id }).sort('createdAt');
    const submissions = await Submission.find({ assignment: { $in: assignments.map(a => a._id) }, student: req.user.id });
    const subMap = {};
    submissions.forEach(s => { subMap[s.assignment.toString()] = s; });
    res.json(assignments.map(a => ({ assignment: a, submission: subMap[a._id.toString()] || null })));
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
