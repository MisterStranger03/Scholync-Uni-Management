const multer = require('multer');
const path   = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const ALLOWED_TYPES = [
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/zip', 'application/x-zip-compressed',
];

const ALLOWED_EXTENSIONS = new Set([
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
  '.txt', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.zip'
]);

const IMAGE_TYPES      = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

// General storage for assignment / course files
const generalStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const ext = path.extname(file.originalname).toLowerCase();
    return {
      folder:          'scholync/files',
      resource_type:   IMAGE_EXTENSIONS.has(ext) ? 'image' : 'raw',
      use_filename:    false,
      unique_filename: true,
    };
  },
});

// Profile picture storage — auto-crops to 200×200, face-aware gravity
const profilePicStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'scholync/profile-pictures',
    resource_type:   'image',
    transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    use_filename:    false,
    unique_filename: true,
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) cb(null, true);
  else cb(new Error('File type not allowed.'));
};

const profilePicFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (IMAGE_TYPES.has(file.mimetype) && IMAGE_EXTENSIONS.has(ext)) cb(null, true);
  else cb(new Error('Only image files are allowed for profile pictures.'));
};

exports.upload = multer({
  storage: generalStorage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB
});

exports.uploadProfilePic = multer({
  storage: profilePicStorage,
  fileFilter: profilePicFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});
