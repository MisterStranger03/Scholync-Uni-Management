const express = require('express');
const router  = express.Router();
const { upload } = require('../middleware/upload.middleware');
const { verifyToken } = require('../middleware/auth.middleware');

// POST /api/upload — authenticated users can upload assignment/course files
router.post('/', verifyToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
  res.json({
    url:          req.file.path,
    originalName: req.file.originalname,
    size:         req.file.size,
    mimetype:     req.file.mimetype,
  });
});

module.exports = router;
