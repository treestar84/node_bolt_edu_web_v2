import express from 'express';
import { authenticateApiKey } from '../middleware/auth.js';
import { getBooks, addBook, updateBook, deleteBook } from '../data/store.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { spawn } from 'child_process';
import sharp from 'sharp';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

/**
 * Auto-generate cover image from video using FFmpeg
 */
const generateCoverFromVideo = async (videoPath, outputPath) => {
  return new Promise((resolve, reject) => {
    console.log('🎬 Generating cover from video:', videoPath);
    
    const ffmpeg = spawn('ffmpeg', [
      '-i', videoPath,
      '-vframes', '1',
      '-q:v', '2',
      '-f', 'image2',
      '-y',
      outputPath
    ]);
    
    let errorOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Cover generated from video:', outputPath);
        resolve(true);
      } else {
        console.error('❌ FFmpeg failed with code:', code);
        reject(new Error(`FFmpeg failed: ${errorOutput}`));
      }
    });
    
    ffmpeg.on('error', (error) => {
      reject(error);
    });
  });
};

/**
 * Generate cover from first page image
 */
const generateCoverFromFirstPage = async (firstPageImagePath, outputPath) => {
  try {
    console.log('🖼️ Generating cover from first page:', firstPageImagePath);
    
    await sharp(firstPageImagePath)
      .resize(320, 240, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toFile(outputPath);
    
    console.log('✅ Cover generated from first page:', outputPath);
    return true;
  } catch (error) {
    console.error('❌ Failed to generate cover from first page:', error);
    throw error;
  }
};

/**
 * Generate placeholder cover
 */
const generatePlaceholderCover = async (title, outputPath) => {
  try {
    console.log('🎨 Generating placeholder cover for:', title);
    
    const placeholderSvg = `
      <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="320" height="240" fill="url(#grad1)" />
        <text x="160" y="100" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" font-weight="bold">
          📖 ${title}
        </text>
        <text x="160" y="130" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
          스토리북
        </text>
      </svg>
    `;
    
    await sharp(Buffer.from(placeholderSvg))
      .png()
      .toFile(outputPath);
    
    console.log('✅ Placeholder cover generated:', outputPath);
    return true;
  } catch (error) {
    console.error('❌ Failed to generate placeholder cover:', error);
    throw error;
  }
};

/**
 * Check if FFmpeg is available
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
 * Auto-generate cover image with priority system:
 * 1. Use user-uploaded cover (if provided)
 * 2. Extract from video (if video exists and FFmpeg available)
 * 3. Use first page image (if pages exist)
 * 4. Generate placeholder
 */
const autoGenerateCover = async (bookData) => {
  try {
    // 1. If cover image is already provided, use it
    if (bookData.coverImage && bookData.coverImage.trim()) {
      console.log('📷 Using provided cover image:', bookData.coverImage);
      return bookData.coverImage;
    }
    
    console.log('🤖 Auto-generating cover for:', bookData.title);
    
    const coverId = uuidv4();
    const coverPath = join(__dirname, '../uploads/images', `${coverId}.jpg`);
    const coverUrl = `/uploads/images/${coverId}.jpg`;
    
    let coverGenerated = false;
    
    // 2. Try to extract from video (if video mode and FFmpeg available)
    if (bookData.isVideoMode && bookData.videoUrl) {
      const hasFFmpeg = await checkFFmpegAvailability();
      
      if (hasFFmpeg) {
        try {
          const videoPath = join(__dirname, '..', bookData.videoUrl);
          
          // Check if video file exists
          await fs.access(videoPath);
          
          await generateCoverFromVideo(videoPath, coverPath);
          coverGenerated = true;
          console.log('✅ Cover extracted from video');
        } catch (error) {
          console.warn('⚠️ Failed to extract cover from video:', error.message);
        }
      } else {
        console.warn('⚠️ FFmpeg not available, skipping video frame extraction');
      }
    }
    
    // 3. Try to use first page image (if traditional book with pages)
    if (!coverGenerated && !bookData.isVideoMode && bookData.pages && bookData.pages.length > 0) {
      try {
        const firstPageImagePath = join(__dirname, '..', bookData.pages[0].imageUrl);
        
        // Check if first page image exists
        await fs.access(firstPageImagePath);
        
        await generateCoverFromFirstPage(firstPageImagePath, coverPath);
        coverGenerated = true;
        console.log('✅ Cover generated from first page');
      } catch (error) {
        console.warn('⚠️ Failed to generate cover from first page:', error.message);
      }
    }
    
    // 4. Generate placeholder as fallback
    if (!coverGenerated) {
      await generatePlaceholderCover(bookData.title, coverPath);
      coverGenerated = true;
      console.log('✅ Placeholder cover generated');
    }
    
    return coverGenerated ? coverUrl : '';
    
  } catch (error) {
    console.error('❌ Auto cover generation failed:', error);
    // Return empty string if all methods fail
    return '';
  }
};

/**
 * @swagger
 * /books:
 *   get:
 *     summary: Get all books
 *     description: Retrieve all storybooks in the database. No authentication required.
 *     tags: [Books]
 *     security: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Book'
 *                 count:
 *                   type: integer
 *                   description: Total number of books
 *                   example: 15
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get all books (public endpoint)
router.get('/', async (req, res) => {
  try {
    const books = await getBooks();
    res.json({
      success: true,
      data: books,
      count: books.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   get:
 *     summary: Get book by ID
 *     description: Retrieve a specific storybook by its ID. No authentication required.
 *     tags: [Books]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *         example: book-123
 *     responses:
 *       200:
 *         description: Successfully retrieved the book
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get book by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const books = await getBooks();
    const book = books.find(b => b.id === req.params.id);
    
    if (!book) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /books:
 *   post:
 *     summary: Create new storybook
 *     description: Create a new storybook (traditional or video mode). Requires API key authentication.
 *     tags: [Books]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 title: Traditional Book
 *                 required: [title, coverImage, pages]
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: 아기 동물들의 하루
 *                   coverImage:
 *                     type: string
 *                     example: /uploads/images/cover.png
 *                   isVideoMode:
 *                     type: boolean
 *                     example: false
 *                   pages:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/BookPage'
 *                   minAge:
 *                     type: integer
 *                     example: 3
 *                   maxAge:
 *                     type: integer
 *                     example: 7
 *               - type: object
 *                 title: Video Book
 *                 required: [title, videoUrl]
 *                 properties:
 *                   title:
 *                     type: string
 *                     example: 비디오 동화책
 *                   coverImage:
 *                     type: string
 *                     example: /uploads/images/video-cover.png
 *                   isVideoMode:
 *                     type: boolean
 *                     example: true
 *                   videoUrl:
 *                     type: string
 *                     example: /uploads/videos/story.mp4
 *                   minAge:
 *                     type: integer
 *                     example: 3
 *                   maxAge:
 *                     type: integer
 *                     example: 7
 *     responses:
 *       201:
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Create new book (requires API key)
router.post('/', authenticateApiKey, async (req, res) => {
  try {
    const { title, coverImage, pages, isVideoMode, videoUrl, minAge, maxAge } = req.body;
    
    // Basic validation
    if (!title) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Title is required'
      });
    }

    // Cover image is only required for non-video mode
    if (!isVideoMode && !coverImage) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Cover image is required for traditional books'
      });
    }

    let bookData;

    if (isVideoMode) {
      // Video mode validation
      if (!videoUrl) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Video URL is required for video mode books'
        });
      }
      
      bookData = {
        title: title.trim(),
        coverImage: coverImage ? coverImage.trim() : '', // Allow empty coverImage for video mode
        isVideoMode: true,
        videoUrl: videoUrl.trim(),
        pages: [], // Video mode books don't have individual pages
        minAge: minAge || 3,
        maxAge: maxAge || 7
      };
    } else {
      // Traditional page mode validation
      if (!Array.isArray(pages) || pages.length === 0) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Pages array is required for traditional books'
        });
      }
      
      // Validate each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        if (!page.imageUrl || !(page.audio || page.audioUrl)) {
          return res.status(400).json({
            error: 'Bad request',
            message: `Page ${i + 1} must have imageUrl and audioUrl`
          });
        }
      }
      
      bookData = {
        title: title.trim(),
        coverImage: coverImage.trim(),
        isVideoMode: false,
        pages: pages.map((page, index) => ({
          id: uuidv4(),
          imageUrl: page.imageUrl.trim(),
          audioUrl: (page.audioUrl || page.audio || '').trim(),
          textContent: page.textContent ? page.textContent.trim() : (page.text ? page.text.trim() : undefined)
        })),
        minAge: minAge || 3,
        maxAge: maxAge || 7
      };
    }
    
    // Auto-generate cover if not provided
    const finalCoverImage = await autoGenerateCover(bookData);
    if (finalCoverImage) {
      bookData.coverImage = finalCoverImage;
    }
    
    const newBook = await addBook(bookData);
    
    res.status(201).json({
      success: true,
      data: newBook,
      message: 'Book created successfully',
      coverGenerated: finalCoverImage !== (bookData.coverImage || '')
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /books/video-upload:
 *   post:
 *     summary: Upload video and create storybook
 *     description: |
 *       Upload video file and optional cover image, then create a video storybook in one step. Requires API key authentication.
 *       
 *       **curl Example:**
 *       ```bash
 *       curl -X POST \
 *         -H "X-API-Key: YOUR_API_KEY" \
 *         -F "title=My Story" \
 *         -F "minAge=3" \
 *         -F "maxAge=7" \
 *         -F "video=@/path/to/video.mp4;type=video/mp4" \
 *         -F "coverImage=@/path/to/cover.png;type=image/png" \
 *         http://localhost:3001/api/books/video-upload
 *       ```
 *     tags: [Books]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [title, video]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the video storybook
 *                 example: 새로운 비디오 동화
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file (MP4, AVI, MOV, etc.)
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional cover image (PNG, JPG, etc.)
 *               minAge:
 *                 type: integer
 *                 description: Minimum recommended age
 *                 example: 3
 *               maxAge:
 *                 type: integer
 *                 description: Maximum recommended age
 *                 example: 7
 *     responses:
 *       201:
 *         description: Video storybook created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Book'
 *                     - type: object
 *                       properties:
 *                         uploadedFiles:
 *                           type: object
 *                           properties:
 *                             video:
 *                               type: object
 *                               properties:
 *                                 filename:
 *                                   type: string
 *                                 originalName:
 *                                   type: string
 *                                 size:
 *                                   type: integer
 *                                 mimetype:
 *                                   type: string
 *                                 url:
 *                                   type: string
 *                             coverImage:
 *                               type: object
 *                               nullable: true
 *                 message:
 *                   type: string
 *                   example: Video storybook created successfully
 *       400:
 *         description: Bad request - missing required fields or files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Upload video and create storybook in one step (requires API key)
router.post('/video-upload', authenticateApiKey, upload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 }
]), handleUploadError, async (req, res) => {
  try {
    const { title, minAge, maxAge } = req.body;
    
    // Basic validation
    if (!title) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Title is required'
      });
    }
    
    if (!req.files || !req.files.video || req.files.video.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Video file is required'
      });
    }
    
    const videoFile = req.files.video[0];
    const coverImageFile = req.files.coverImage ? req.files.coverImage[0] : null;
    
    // Construct file URLs
    const videoUrl = `/uploads/videos/${videoFile.filename}`;
    const coverImageUrl = coverImageFile ? `/uploads/images/${coverImageFile.filename}` : '';
    
    // Create video storybook data
    const bookData = {
      title: title.trim(),
      coverImage: coverImageUrl,
      isVideoMode: true,
      videoUrl: videoUrl,
      pages: [], // Video mode books don't have individual pages
      minAge: minAge ? parseInt(minAge) : 3,
      maxAge: maxAge ? parseInt(maxAge) : 7
    };
    
    // Auto-generate cover if not provided
    const finalCoverImage = await autoGenerateCover(bookData);
    if (finalCoverImage) {
      bookData.coverImage = finalCoverImage;
    }
    
    const newBook = await addBook(bookData);
    
    res.status(201).json({
      success: true,
      data: {
        ...newBook,
        uploadedFiles: {
          video: {
            filename: videoFile.filename,
            originalName: videoFile.originalname,
            size: videoFile.size,
            mimetype: videoFile.mimetype,
            url: videoUrl
          },
          coverImage: coverImageFile ? {
            filename: coverImageFile.filename,
            originalName: coverImageFile.originalname,
            size: coverImageFile.size,
            mimetype: coverImageFile.mimetype,
            url: coverImageUrl
          } : null
        }
      },
      message: 'Video storybook created successfully',
      coverGenerated: finalCoverImage !== coverImageUrl
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /books/complete:
 *   post:
 *     summary: Create complete book with all 4 pages
 *     description: Create a complete traditional storybook with exactly 4 pages in a single request. Requires API key authentication.
 *     tags: [Books]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, coverImage, page1Image, page1Audio, page2Image, page2Audio, page3Image, page3Audio, page4Image, page4Audio]
 *             properties:
 *               title:
 *                 type: string
 *                 example: 완전한 동화책
 *               coverImage:
 *                 type: string
 *                 example: /uploads/images/cover.png
 *               page1Image:
 *                 type: string
 *                 example: /uploads/images/page1.png
 *               page1Audio:
 *                 type: string
 *                 example: /uploads/audio/page1.mp3
 *               page1Text:
 *                 type: string
 *                 example: 첫 번째 페이지 내용
 *               page2Image:
 *                 type: string
 *                 example: /uploads/images/page2.png
 *               page2Audio:
 *                 type: string
 *                 example: /uploads/audio/page2.mp3
 *               page2Text:
 *                 type: string
 *                 example: 두 번째 페이지 내용
 *               page3Image:
 *                 type: string
 *                 example: /uploads/images/page3.png
 *               page3Audio:
 *                 type: string
 *                 example: /uploads/audio/page3.mp3
 *               page3Text:
 *                 type: string
 *                 example: 세 번째 페이지 내용
 *               page4Image:
 *                 type: string
 *                 example: /uploads/images/page4.png
 *               page4Audio:
 *                 type: string
 *                 example: /uploads/audio/page4.mp3
 *               page4Text:
 *                 type: string
 *                 example: 네 번째 페이지 내용
 *     responses:
 *       201:
 *         description: Complete book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Create complete book with all content (one-shot API)
router.post('/complete', authenticateApiKey, async (req, res) => {
  try {
    const { 
      title, 
      coverImage, 
      page1Image, page1Audio, page1Text,
      page2Image, page2Audio, page2Text,
      page3Image, page3Audio, page3Text,
      page4Image, page4Audio, page4Text
    } = req.body;
    
    // Validation
    if (!title || !coverImage || 
        !page1Image || !page1Audio ||
        !page2Image || !page2Audio ||
        !page3Image || !page3Audio ||
        !page4Image || !page4Audio) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Title, coverImage, and all page images and audio are required'
      });
    }
    
    const bookData = {
      title: title.trim(),
      coverImage: coverImage.trim(),
      pages: [
        {
          id: uuidv4(),
          imageUrl: page1Image.trim(),
          audioUrl: page1Audio.trim(),
          text: page1Text ? page1Text.trim() : undefined
        },
        {
          id: uuidv4(),
          imageUrl: page2Image.trim(),
          audioUrl: page2Audio.trim(),
          text: page2Text ? page2Text.trim() : undefined
        },
        {
          id: uuidv4(),
          imageUrl: page3Image.trim(),
          audioUrl: page3Audio.trim(),
          text: page3Text ? page3Text.trim() : undefined
        },
        {
          id: uuidv4(),
          imageUrl: page4Image.trim(),
          audioUrl: page4Audio.trim(),
          text: page4Text ? page4Text.trim() : undefined
        }
      ]
    };
    
    // Auto-generate cover if not provided
    const finalCoverImage = await autoGenerateCover(bookData);
    if (finalCoverImage) {
      bookData.coverImage = finalCoverImage;
    }
    
    const newBook = await addBook(bookData);
    
    res.status(201).json({
      success: true,
      data: newBook,
      message: 'Complete book created successfully',
      coverGenerated: finalCoverImage !== bookData.coverImage
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   put:
 *     summary: Update book
 *     description: Update an existing storybook by ID. Requires API key authentication.
 *     tags: [Books]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *         example: book-123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the book
 *               coverImage:
 *                 type: string
 *                 description: URL path to cover image
 *               isVideoMode:
 *                 type: boolean
 *                 description: Whether this is a video-based book
 *               videoUrl:
 *                 type: string
 *                 description: URL path to video file (for video mode)
 *               pages:
 *                 type: array
 *                 description: Array of book pages (exactly 4 for traditional books)
 *                 items:
 *                   $ref: '#/components/schemas/BookPage'
 *           example:
 *             title: 수정된 동화책 제목
 *             coverImage: /uploads/images/new-cover.png
 *     responses:
 *       200:
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - validation error or no fields provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Update book (requires API key)
router.put('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { title, coverImage, pages, isVideoMode, videoUrl } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (coverImage) updateData.coverImage = coverImage.trim();
    if (videoUrl) updateData.videoUrl = videoUrl.trim();
    if (typeof isVideoMode === 'boolean') updateData.isVideoMode = isVideoMode;
    
    if (pages && Array.isArray(pages)) {
      // 비디오 모드가 아닌 경우에만 4페이지 체크
      if (!isVideoMode && pages.length !== 4) {
        return res.status(400).json({
          error: 'Bad request',
          message: 'Exactly 4 pages are required for traditional books'
        });
      }
      updateData.pages = pages.map((page, index) => ({
        id: page.id || uuidv4(),
        imageUrl: page.imageUrl ? page.imageUrl.trim() : '',
        audioUrl: (page.audioUrl || page.audio || '').trim(),
        textContent: page.textContent ? page.textContent.trim() : (page.text ? page.text.trim() : undefined)
      }));
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'At least one field must be provided for update'
      });
    }
    
    const updatedBook = await updateBook(req.params.id, updateData);
    
    if (!updatedBook) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedBook,
      message: 'Book updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /books/{id}:
 *   delete:
 *     summary: Delete book
 *     description: Delete an existing storybook by ID. Requires API key authentication.
 *     tags: [Books]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Book ID
 *         example: book-123
 *     responses:
 *       200:
 *         description: Book deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Book deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Book not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Delete book (requires API key)
router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    const deleted = await deleteBook(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Book not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;