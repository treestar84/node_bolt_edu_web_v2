import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Import routes
import authRoutes from './routes/auth.js';
import wordsRoutes from './routes/words.js';
import booksRoutes from './routes/books.js';
import uploadRoutes from './routes/upload.js';
import videoRoutes from './routes/video.js';
import apiKeyRoutes from './routes/apiKeys.js';
import testDataRoutes from './routes/testData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy settings for Cloud Run/Load Balancer
app.set('trust proxy', true);

// 타임아웃 제한 완화 (큰 파일 업로드 허용)
app.use((req, res, next) => {
  req.setTimeout(0); // 무제한 타임아웃
  res.setTimeout(0); // 무제한 타임아웃
  next();
});

// Security middleware - 파일 업로드를 위해 제한 완화
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // CSP 완전 비활성화 (업로드 방해 방지)
}));

// Rate limiting 완전 비활성화
console.log('🔧 Rate limiting completely disabled for GCP deployment');

// CORS configuration - 환경에 관계없이 ALLOWED_ORIGINS 우선 사용
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000', 'https://duck-edu-word.duckdns.org'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body parsing middleware - 매우 큰 제한으로 설정 (업로드 실패 방지)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
// Raw parser는 특정 라우트에서만 사용하도록 제거

// Static file serving for uploads with smart caching
app.use('/uploads', cors({
  origin: '*',
  methods: ['GET', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  credentials: false
}), express.static(join(__dirname, 'uploads'), {
  // 기본 캐싱 설정
  etag: true,
  lastModified: true,
  
  // 파일 크기 및 타입별 스마트 캐싱
  setHeaders: (res, path, stat) => {
    const fileSizeKB = stat.size / 1024;
    const ext = path.split('.').pop()?.toLowerCase();
    
    // 크기별 캐싱 전략
    if (fileSizeKB < 100) { 
      // 100KB 미만 = 작은 파일 (적극 캐싱)
      res.setHeader('Cache-Control', 'public, max-age=2592000, immutable'); // 30일
    } else if (fileSizeKB < 500) { 
      // 500KB 미만 = 중간 파일 (일반 캐싱)
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1일
    } else if (fileSizeKB < 2000) { 
      // 2MB 미만 = 큰 파일 (단기 캐싱)
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1시간
    } else { 
      // 2MB 이상 = 매우 큰 파일 (스트리밍 우선, 최소 캐싱)
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5분
    }
    
    // 파일 타입별 추가 최적화
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      // 이미지 압축 힌트
      res.setHeader('Vary', 'Accept-Encoding');
      if (fileSizeKB > 1000) {
        console.log(`⚠️  Large image detected: ${path} (${Math.round(fileSizeKB)}KB)`);
      }
    } else if (['mp4', 'webm', 'avi'].includes(ext)) {
      // 비디오 스트리밍 지원
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Type', 'video/' + ext);
    }
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/words', wordsRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/keys', apiKeyRoutes);
app.use('/api/test', testDataRoutes);

// API Documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Toddler Learning App API',
    version: '1.0.0',
    description: 'API for managing words, books, and content in the toddler learning application',
    baseUrl: `${req.protocol}://${req.get('host')}/api`,
    endpoints: {
      auth: {
        'POST /auth/login': 'Admin login',
        'POST /auth/logout': 'Admin logout',
        'GET /auth/verify': 'Verify admin token'
      },
      words: {
        'GET /words': 'Get all words',
        'POST /words': 'Create new word (requires API key)',
        'PUT /words/:id': 'Update word (requires API key)',
        'DELETE /words/:id': 'Delete word (requires API key)',
        'POST /words/batch': 'Create multiple words (requires API key)'
      },
      books: {
        'GET /books': 'Get all books',
        'POST /books': 'Create new book (requires API key)',
        'PUT /books/:id': 'Update book (requires API key)',
        'DELETE /books/:id': 'Delete book (requires API key)',
        'POST /books/complete': 'Create complete book with all content (requires API key)',
        'POST /books/video-upload': 'Upload MP4 file and create video storybook in one step (requires API key)'
      },
      upload: {
        'POST /upload/image': 'Upload image file (requires API key)',
        'POST /upload/audio': 'Upload audio file (requires API key)',
        'POST /upload/video': 'Upload video file (requires API key)',
        'POST /upload/batch': 'Upload multiple files (requires API key)'
      },
      video: {
        'POST /video/extract-frame': 'Extract first frame from uploaded video (requires API key)',
        'POST /video/extract-frame-from-path': 'Extract first frame from existing video file (requires API key)',
        'GET /video/ffmpeg-status': 'Check FFmpeg availability status'
      },
      keys: {
        'GET /keys': 'Get API keys (admin only)',
        'POST /keys': 'Create API key (admin only)',
        'DELETE /keys/:id': 'Delete API key (admin only)'
      },
      test: {
        'POST /test/video': 'Generate single test video (development only)',
        'POST /test/videos': 'Generate multiple test videos (development only)',
        'DELETE /test/cleanup': 'Clean up test data (development only)'
      }
    },
    authentication: {
      admin: 'Bearer token in Authorization header',
      api: 'X-API-Key header'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'File too large',
      message: 'The uploaded file exceeds the maximum size limit'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Initialize server
const initializeServer = async () => {
  try {
    // Ensure uploads directory exists
    const uploadsDir = join(__dirname, 'uploads');
    const imagesDir = join(uploadsDir, 'images');
    const audioDir = join(uploadsDir, 'audio');
    const videosDir = join(uploadsDir, 'videos');
    try {
      await fs.access(uploadsDir);
    } catch {
      await fs.mkdir(uploadsDir, { recursive: true });
    }
    try {
      await fs.access(imagesDir);
    } catch {
      await fs.mkdir(imagesDir, { recursive: true });
    }
    try {
      await fs.access(audioDir);
    } catch {
      await fs.mkdir(audioDir, { recursive: true });
    }
    try {
      await fs.access(videosDir);
    } catch {
      await fs.mkdir(videosDir, { recursive: true });
    }

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://0.0.0.0:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://0.0.0.0:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

initializeServer();

export default app;