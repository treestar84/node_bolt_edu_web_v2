import multer from 'multer';
import { join, extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import fs from 'fs/promises';

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
    fileSize: 50 * 1024 * 1024, // 50MB로 제한 (이미지는 실제로는 더 작게 압축됨)
    files: 10 // Maximum 10 files per request
  }
});

// Error handling for multer
export const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'File size exceeds 50MB limit'
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

// 이미지 압축 및 썸네일 생성 미들웨어
export const compressImage = async (req, res, next) => {
  if (!req.file || !req.file.mimetype.startsWith('image/')) {
    return next();
  }

  try {
    const originalPath = req.file.path;
    const originalSizeKB = req.file.size / 1024;
    const pathParts = originalPath.split('.');
    const basePath = pathParts.slice(0, -1).join('.');
    const thumbPath = basePath + '_thumb.jpg';
    
    console.log(`🖼️  Processing image: ${req.file.originalname} (${Math.round(originalSizeKB)}KB)`);
    
    // 설정값
    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 800;
    const THUMB_SIZE = 200; // 썸네일 크기
    const QUALITY = 80;
    const THUMB_QUALITY = 70;
    
    const imageProcessor = sharp(originalPath);
    const metadata = await imageProcessor.metadata();
    
    console.log(`📏 Original size: ${metadata.width}x${metadata.height}`);
    
    // 1. 썸네일 생성 (항상 생성)
    const thumbnailBuffer = await imageProcessor
      .resize(THUMB_SIZE, THUMB_SIZE, {
        fit: 'cover', // 정사각형 썸네일
        position: 'center'
      })
      .jpeg({ 
        quality: THUMB_QUALITY,
        progressive: true
      })
      .toBuffer();
    
    await fs.writeFile(thumbPath, thumbnailBuffer);
    const thumbSizeKB = thumbnailBuffer.length / 1024;
    console.log(`📷 Thumbnail created: ${Math.round(thumbSizeKB)}KB`);
    
    // 2. 메인 이미지 최적화
    const needsResize = metadata.width > MAX_WIDTH || metadata.height > MAX_HEIGHT;
    
    if (needsResize || originalSizeKB > 500) {
      const processedBuffer = await imageProcessor
        .resize(MAX_WIDTH, MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ 
          quality: QUALITY,
          progressive: true
        })
        .toBuffer();
        
      await fs.writeFile(originalPath, processedBuffer);
      
      const newSizeKB = processedBuffer.length / 1024;
      const compressionRatio = ((originalSizeKB - newSizeKB) / originalSizeKB * 100).toFixed(1);
      
      console.log(`✅ Compressed: ${Math.round(originalSizeKB)}KB → ${Math.round(newSizeKB)}KB (${compressionRatio}% saved)`);
      
      req.file.size = processedBuffer.length;
      req.file.mimetype = 'image/jpeg';
    } else {
      console.log(`ℹ️  Image is already optimized (${Math.round(originalSizeKB)}KB)`);
    }
    
    // 썸네일 정보를 req.file에 추가
    req.file.thumbnailUrl = `/uploads/images/${req.file.filename.split('.')[0]}_thumb.jpg`;
    req.file.thumbnailSize = thumbnailBuffer.length;
    
    next();
  } catch (error) {
    console.error('❌ Image processing error:', error);
    next();
  }
};