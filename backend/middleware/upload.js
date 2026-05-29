const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure profiles upload directory exists
const profileDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, profileDir),
  filename: (req, file, cb) =>
    cb(null, `profile_${req.params.id}_${Date.now()}${path.extname(file.originalname)}`),
});

exports.uploadProfile = multer({
  storage: profileStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error('Only image files are allowed'), false);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});