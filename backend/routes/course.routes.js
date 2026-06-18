const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/course.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.get('/',                              ctrl.listCourses);
router.post('/',                             ctrl.createCourse);
router.get('/available',                     ctrl.listAvailableCourses);  // students only
router.patch('/:id',                         ctrl.updateCourse);
router.delete('/:id',                        ctrl.deleteCourse);
router.post('/:id/enroll',                   ctrl.enrollInCourse);
router.delete('/:id/enroll',                 ctrl.unenrollFromCourse);
router.delete('/:id/students/:studentId',    ctrl.removeStudent);
router.get('/:id/posts',                     ctrl.listPosts);
router.post('/:id/posts',                    ctrl.createPost);
router.patch('/:id/posts/:postId',           ctrl.updatePost);
router.delete('/:id/posts/:postId',          ctrl.deletePost);
router.get('/:id/gradebook',                 ctrl.getGradebook);    // admin/professor
router.get('/:id/my-grades',                 ctrl.getMyGrades);     // student

module.exports = router;
