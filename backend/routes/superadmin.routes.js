const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/superadmin.controller');
const { verifySuperAdmin } = require('../middleware/superadmin.middleware');

router.post('/login',                          ctrl.login);
router.get('/stats',           verifySuperAdmin, ctrl.getStats);
router.get('/universities',    verifySuperAdmin, ctrl.getUniversities);
router.patch('/universities/:id',  verifySuperAdmin, ctrl.updateUniversity);
router.delete('/universities/:id', verifySuperAdmin, ctrl.deleteUniversity);
router.get('/users',           verifySuperAdmin, ctrl.getUsers);
router.patch('/users/:id',     verifySuperAdmin, ctrl.updateUser);
router.delete('/users/:id',    verifySuperAdmin, ctrl.deleteUser);

module.exports = router;
