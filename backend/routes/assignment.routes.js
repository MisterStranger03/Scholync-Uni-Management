const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/assignment.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

router.post('/',                                   ctrl.createAssignment);
router.get('/course/:courseId',                    ctrl.listAssignments);
router.patch('/:id',                               ctrl.updateAssignment);
router.delete('/:id',                              ctrl.deleteAssignment);
router.post('/:id/submit',                         ctrl.submitAssignment);
router.get('/:id/my-submission',                   ctrl.getMySubmission);
router.patch('/:id/submissions/:studentId/grade',  ctrl.gradeSubmission);
router.get('/:id/submissions',                     ctrl.listSubmissions);

module.exports = router;
