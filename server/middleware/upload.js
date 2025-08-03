import multer from 'multer';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath;
    if (file.fieldname === 'audio') {
      uploadPath = join(process.cwd(), 'server/uploads/audio');
    } else if (file.fieldname === 'video') {
      uploadPath = join(process.cwd(), 'server/uploads/videos');
    } else {
      uploadPath = join(process.cwd(), 'server/uploads/images');
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'image') {
    // Accept images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for image uploads'), false);
    }
  } else if (file.fieldname === 'audio') {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for audio uploads'), false);
    }
  } else if (file.fieldname === 'video') {
    // Accept video files - check both MIME type and file extension
    const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/webm'];
    const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm'];
    const fileExtension = extname(file.originalname).toLowerCase();
    
    if (file.mimetype.startsWith('video/') || allowedVideoTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video uploads. Supported formats: MP4, AVI, MOV, MKV, WEBM'), false);
    }
  } else {
    cb(new Error('Invalid field name'), false);
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit - 매우 큰 파일도 허용
    files: 10 // Maximum 10 files per request
  }
});

// Error handling for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'File size exceeds 500MB limit'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(413).json({
        error: 'Too many files',
        message: 'Maximum 10 files allowed per request'
      });
    }
  }
  
  if (err) {
    return res.status(400).json({
      error: 'Upload error',
      message: err.message
    });
  }
  
  next();
};