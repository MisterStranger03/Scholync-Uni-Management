const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/university.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/',          ctrl.list);                              // public — used by signup form
router.get('/:slug',     ctrl.getBySlug);                        // public — slug resolution
router.patch('/my',      verifyToken, ctrl.updateMyUniversity);  // admin only

module.exports = router;
