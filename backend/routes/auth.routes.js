const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/auth.controller');
const { verifyToken }    = require('../middleware/auth.middleware');
const { uploadProfilePic } = require('../middleware/upload.middleware');

router.post('/register',        ctrl.register);
router.post('/login',           ctrl.login);
router.post('/verify-otp',      ctrl.verifyOtp);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password',  ctrl.resetPassword);

router.post('/logout',           verifyToken, ctrl.logout);
router.get('/profile',           verifyToken, ctrl.getProfile);
router.patch('/profile',         verifyToken, ctrl.updateProfile);
router.post('/change-password',  verifyToken, ctrl.changePassword);
router.post('/profile/picture',  verifyToken, uploadProfilePic.single('profilePic'), ctrl.uploadProfilePicture);

module.exports = router;
