const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/admin.controller');
const { verifyToken, requireRole } = require('../middleware/auth.middleware');

router.use(verifyToken, requireRole('admin'));

router.get('/stats',               ctrl.getStats);
router.get('/professors',          ctrl.listProfessors);
router.get('/users',               ctrl.listUsers);
router.patch('/users/:id/approve', ctrl.approveUser);
router.patch('/users/:id/reject',  ctrl.rejectUser);

module.exports = router;
