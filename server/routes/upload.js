import express from 'express';
import { upload, handleUploadError, compressImage } from '../middleware/upload.js';

const router = express.Router();

// Upload single image with compression
router.post('/image', upload.single('image'), handleUploadError, compressImage, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No image file provided'
      });
    }
    
    const fileUrl = `/uploads/images/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl,
        thumbnailUrl: req.file.thumbnailUrl,
        thumbnailSize: req.file.thumbnailSize
      },
      message: 'Image uploaded and optimized successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Upload single audio file
router.post('/audio', upload.single('audio'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No audio file provided'
      });
    }
    
    const fileUrl = `/uploads/audio/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      },
      message: 'Audio uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Upload single video file
router.post('/video', upload.single('video'), handleUploadError, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No video file provided'
      });
    }
    
    const fileUrl = `/uploads/videos/${req.file.filename}`;
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: fileUrl
      },
      message: 'Video uploaded successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Upload multiple files (batch upload) with image compression
router.post('/batch', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'audio', maxCount: 10 }
]), handleUploadError, async (req, res) => {
  try {
    const uploadedFiles = {
      images: [],
      audio: []
    };
    
    // 이미지 파일들 압축 처리
    if (req.files.images) {
      for (const file of req.files.images) {
        // 각 이미지에 대해 압축 적용
        req.file = file; // compressImage 미들웨어를 위한 임시 설정
        await new Promise((resolve) => {
          compressImage(req, res, resolve);
        });
      }
      
      uploadedFiles.images = req.files.images.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/images/${file.filename}`,
        thumbnailUrl: file.thumbnailUrl,
        thumbnailSize: file.thumbnailSize
      }));
    }
    
    if (req.files.audio) {
      uploadedFiles.audio = req.files.audio.map(file => ({
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/audio/${file.filename}`
      }));
    }
    
    const totalFiles = uploadedFiles.images.length + uploadedFiles.audio.length;
    
    if (totalFiles === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'No files provided'
      });
    }
    
    res.json({
      success: true,
      data: uploadedFiles,
      summary: {
        totalFiles,
        images: uploadedFiles.images.length,
        audio: uploadedFiles.audio.length
      },
      message: `${totalFiles} files uploaded successfully`
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;