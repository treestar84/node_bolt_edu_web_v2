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

// Rate limiting - 개발 환경에서는 더 관대하게 설정
const isDevelopment = process.env.NODE_ENV !== 'production';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // 개발: 1000, 프로덕션: 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 500 : 50, // 개발: 500, 프로덕션: 50 API requests per windowMs
  message: {
    error: 'Too many API requests from this IP, please try again later.'
  }
});

// Rate limiting 완전 비활성화 (임시)
console.log('🔧 Rate limiting completely disabled for testing');
// if (!isDevelopment) {
//   app.use(limiter);
//   app.use('/api', apiLimiter);
// } else {
//   console.log('🔧 Development mode: Rate limiting disabled');
// }

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

// Static file serving for uploads
app.use('/uploads', cors({
  origin: '*',
  methods: ['GET', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
  credentials: false
}), express.static(join(__dirname, 'uploads')));

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
        'POST /books/complete': 'Create complete book with all content (requires API key)'
      },
      upload: {
        'POST /upload/image': 'Upload image file (requires API key)',
        'POST /upload/audio': 'Upload audio file (requires API key)',
        'POST /upload/batch': 'Upload multiple files (requires API key)'
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

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 API Server running on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
};

initializeServer();

export default app;