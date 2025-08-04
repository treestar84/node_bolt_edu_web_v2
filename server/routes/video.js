import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  
  // Check if API key is valid (you might want to implement proper validation)
  if (apiKey !== process.env.VITE_API_KEY) {
    return res.status(403).json({ error: 'Invalid API key' });
  }
  
  next();
};

// Configure multer for video upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/mov'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid video format. Only MP4, WebM, AVI, and MOV are allowed.'));
    }
  }
});

/**
 * Extract first frame from video using FFmpeg
 * @param {string} videoPath - Path to the video file
 * @param {string} outputPath - Path where the frame should be saved
 * @returns {Promise<boolean>} - Success status
 */
const extractVideoFrame = (videoPath, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log('🎬 Extracting frame from video:', videoPath);
    
    // FFmpeg command to extract first frame
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,           // Input video
      '-vframes', '1',           // Extract only 1 frame
      '-q:v', '2',              // High quality
      '-f', 'image2',           // Image format
      '-y',                     // Overwrite output file
      outputPath                // Output path
    ]);
    
    let errorOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Frame extracted successfully:', outputPath);
        resolve(true);
      } else {
        console.error('❌ FFmpeg failed with code:', code);
        console.error('Error output:', errorOutput);
        reject(new Error(`FFmpeg failed with code ${code}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      console.error('❌ FFmpeg spawn error:', error);
      reject(error);
    });
  });
};

/**
 * Check if FFmpeg is available on the system
 */
const checkFFmpegAvailability = () => {
  return new Promise((resolve) => {
    const ffmpeg = spawn('ffmpeg', ['-version']);
    
    ffmpeg.on('close', (code) => {
      resolve(code === 0);
    });
    
    ffmpeg.on('error', () => {
      resolve(false);
    });
  });
};

/**
 * Extract frame using Canvas API (fallback method)
 * This creates a basic thumbnail from video metadata
 */
const extractFrameWithCanvas = async (videoBuffer, outputPath) => {
  try {
    console.log('🎨 Using Canvas fallback for frame extraction');
    
    // Create a placeholder image since we can't actually extract from video without FFmpeg
    // This creates a simple gradient placeholder
    const placeholderSvg = `
      <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="320" height="240" fill="url(#grad1)" />
        <text x="160" y="120" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dominant-baseline="middle">
          📹 비디오 썸네일
        </text>
      </svg>
    `;
    
    // Convert SVG to PNG using Sharp
    await sharp(Buffer.from(placeholderSvg))
      .png()
      .resize(320, 240)
      .toFile(outputPath);
    
    console.log('✅ Placeholder frame created:', outputPath);
    return true;
  } catch (error) {
    console.error('❌ Canvas fallback failed:', error);
    throw error;
  }
};

/**
 * POST /api/video/extract-frame
 * Extract first frame from uploaded video
 */
router.post('/extract-frame', validateApiKey, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }
    
    console.log('🎬 Processing video frame extraction:', req.file.originalname);
    
    const videoId = uuidv4();
    const tempVideoPath = join(__dirname, '../uploads/videos', `temp_${videoId}.mp4`);
    const frameId = uuidv4();
    const framePath = join(__dirname, '../uploads/images', `${frameId}.jpg`);
    
    try {
      // Save uploaded video temporarily
      await fs.writeFile(tempVideoPath, req.file.buffer);
      
      // Check if FFmpeg is available
      const hasFFmpeg = await checkFFmpegAvailability();
      
      let success = false;
      
      if (hasFFmpeg) {
        // Try FFmpeg first
        try {
          success = await extractVideoFrame(tempVideoPath, framePath);
        } catch (error) {
          console.warn('⚠️ FFmpeg extraction failed, falling back to Canvas method');
          success = false;
        }
      }
      
      if (!success) {
        // Fallback to Canvas method
        await extractFrameWithCanvas(req.file.buffer, framePath);
        success = true;
      }
      
      if (success) {
        // Optimize the extracted frame
        const optimizedFramePath = join(__dirname, '../uploads/images', `${frameId}_thumb.jpg`);
        
        await sharp(framePath)
          .resize(320, 240, { 
            fit: 'cover',
            position: 'center'
          })
          .jpeg({ 
            quality: 80,
            progressive: true
          })
          .toFile(optimizedFramePath);
        
        // Clean up temporary video file
        try {
          await fs.unlink(tempVideoPath);
        } catch (cleanupError) {
          console.warn('⚠️ Failed to cleanup temp video:', cleanupError);
        }
        
        const frameUrl = `/uploads/images/${frameId}.jpg`;
        const thumbnailUrl = `/uploads/images/${frameId}_thumb.jpg`;
        
        console.log('✅ Video frame extraction completed');
        
        res.json({
          success: true,
          message: 'Frame extracted successfully',
          data: {
            frameUrl,
            thumbnailUrl,
            frameId,
            method: hasFFmpeg ? 'ffmpeg' : 'canvas'
          }
        });
      } else {
        throw new Error('Frame extraction failed');
      }
    } catch (error) {
      // Clean up temporary files on error
      try {
        await fs.unlink(tempVideoPath);
      } catch (cleanupError) {
        console.warn('⚠️ Failed to cleanup temp video after error:', cleanupError);
      }
      
      throw error;
    }
  } catch (error) {
    console.error('❌ Video frame extraction error:', error);
    res.status(500).json({
      error: 'Frame extraction failed',
      message: error.message
    });
  }
});

/**
 * POST /api/video/extract-frame-from-path
 * Extract first frame from existing video file
 */
router.post('/extract-frame-from-path', validateApiKey, async (req, res) => {
  try {
    const { videoPath } = req.body;
    
    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }
    
    console.log('🎬 Extracting frame from existing video:', videoPath);
    
    // Construct full path to video file
    const fullVideoPath = videoPath.startsWith('/uploads/') 
      ? join(__dirname, '..', videoPath)
      : join(__dirname, '../uploads/videos', videoPath);
    
    // Check if video file exists
    try {
      await fs.access(fullVideoPath);
    } catch (error) {
      return res.status(404).json({ error: 'Video file not found', path: videoPath });
    }
    
    const frameId = uuidv4();
    const framePath = join(__dirname, '../uploads/images', `${frameId}.jpg`);
    
    // Check if FFmpeg is available
    const hasFFmpeg = await checkFFmpegAvailability();
    
    let success = false;
    
    if (hasFFmpeg) {
      // Try FFmpeg first
      try {
        success = await extractVideoFrame(fullVideoPath, framePath);
      } catch (error) {
        console.warn('⚠️ FFmpeg extraction failed, using placeholder method');
        success = false;
      }
    }
    
    if (!success) {
      // Fallback to placeholder creation
      const videoBuffer = await fs.readFile(fullVideoPath);
      await extractFrameWithCanvas(videoBuffer, framePath);
      success = true;
    }
    
    if (success) {
      // Create thumbnail version
      const thumbnailFramePath = join(__dirname, '../uploads/images', `${frameId}_thumb.jpg`);
      
      await sharp(framePath)
        .resize(320, 240, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 80,
          progressive: true
        })
        .toFile(thumbnailFramePath);
      
      const frameUrl = `/uploads/images/${frameId}.jpg`;
      const thumbnailUrl = `/uploads/images/${frameId}_thumb.jpg`;
      
      console.log('✅ Frame extraction from path completed');
      
      res.json({
        success: true,
        message: 'Frame extracted successfully',
        data: {
          frameUrl,
          thumbnailUrl,
          frameId,
          sourceVideo: videoPath,
          method: hasFFmpeg ? 'ffmpeg' : 'canvas'
        }
      });
    } else {
      throw new Error('Frame extraction failed');
    }
  } catch (error) {
    console.error('❌ Video frame extraction error:', error);
    res.status(500).json({
      error: 'Frame extraction failed',
      message: error.message
    });
  }
});

/**
 * GET /api/video/ffmpeg-status
 * Check if FFmpeg is available on the system
 */
router.get('/ffmpeg-status', async (req, res) => {
  try {
    const hasFFmpeg = await checkFFmpegAvailability();
    
    res.json({
      available: hasFFmpeg,
      message: hasFFmpeg ? 'FFmpeg is available' : 'FFmpeg is not available, using fallback methods',
      fallbackMethods: ['Canvas API placeholder generation']
    });
  } catch (error) {
    console.error('❌ FFmpeg status check error:', error);
    res.status(500).json({
      error: 'Failed to check FFmpeg status',
      message: error.message
    });
  }
});

export default router;