import express from 'express';
import { authenticateApiKey } from '../middleware/auth.js';
import { getBooks, addBook, updateBook, deleteBook } from '../data/store.js';
import { upload, handleUploadError } from '../middleware/upload.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

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
    
    const newBook = await addBook(bookData);
    
    res.status(201).json({
      success: true,
      data: newBook,
      message: 'Book created successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

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
      message: 'Video storybook created successfully'
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

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
    
    const newBook = await addBook(bookData);
    
    res.status(201).json({
      success: true,
      data: newBook,
      message: 'Complete book created successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

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