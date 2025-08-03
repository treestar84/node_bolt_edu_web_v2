/**
 * @fileoverview Test suite for Books API endpoints
 * @description Tests for storybook registration and management - critical for external integrations
 */

const request = require('supertest');
const express = require('express');

// Mock the data store BEFORE importing
const mockGetBooks = jest.fn();
const mockAddBook = jest.fn();
const mockUpdateBook = jest.fn();
const mockDeleteBook = jest.fn();

jest.mock('../../server/data/store.js', () => ({
  mockGetBooks: mockGetBooks,
  mockAddBook: mockAddBook,
  mockUpdateBook: mockUpdateBook,
  mockDeleteBook: mockDeleteBook
}));

// Mock the auth middleware
jest.mock('../../server/middleware/auth.js', () => ({
  authenticateApiKey: (req, res, next) => {
    if (req.headers['x-api-key'] === global.testUtils.validApiKey) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized', message: 'Invalid or missing API key' });
    }
  }
}));

// Mock the upload middleware
jest.mock('../../server/middleware/upload.js', () => ({
  upload: {
    fields: () => (req, res, next) => {
      // Mock successful file upload
      req.files = {
        video: [{ filename: 'test-video.mp4', originalname: 'story.mp4', size: 1000000, mimetype: 'video/mp4' }],
        coverImage: [{ filename: 'test-cover.png', originalname: 'cover.png', size: 50000, mimetype: 'image/png' }]
      };
      next();
    }
  },
  handleUploadError: (req, res, next) => next()
}));

// Import after mocking
const booksRouter = require('../../server/routes/books.js').default;

const app = express();
app.use(express.json());
app.use('/books', booksRouter);

describe('Books API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /books', () => {
    it('should return all books successfully', async () => {
      const mockBooks = [
        global.testUtils.createTestBook({ id: '1' }),
        global.testUtils.createTestVideoBook({ id: '2' })
      ];
      
      mockGetBooks.mockResolvedValue(mockBooks);

      const response = await request(app)
        .get('/books')
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(mockGetBooks).toHaveBeenCalledTimes(1);
    });

    it('should handle empty books list', async () => {
      mockGetBooks.mockResolvedValue([]);

      const response = await request(app)
        .get('/books')
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should handle server errors', async () => {
      mockGetBooks.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/books')
        .expect(500);

      global.testUtils.expectErrorResponse(response, 500);
      expect(response.body.message).toBe('Database connection failed');
    });
  });

  describe('GET /books/:id', () => {
    it('should return specific book by ID', async () => {
      const mockBooks = [
        global.testUtils.createTestBook({ id: '1' }),
        global.testUtils.createTestBook({ id: '2' })
      ];
      
      mockGetBooks.mockResolvedValue(mockBooks);

      const response = await request(app)
        .get('/books/1')
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 for non-existent book', async () => {
      mockGetBooks.mockResolvedValue([]);

      const response = await request(app)
        .get('/books/999')
        .expect(404);

      global.testUtils.expectErrorResponse(response, 404, 'Book not found');
    });
  });

  describe('POST /books - Traditional Book Registration (Critical)', () => {
    it('should create traditional book with valid API key and data', async () => {
      const testBook = global.testUtils.createTestBook();
      const newBook = { ...testBook, id: 'new-book-id' };
      
      mockAddBook.mockResolvedValue(newBook);

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(testBook)
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.data).toEqual(newBook);
      expect(response.body.message).toBe('Book created successfully');
      expect(mockAddBook).toHaveBeenCalledWith(expect.objectContaining({
        title: testBook.title.trim(),
        coverImage: testBook.coverImage.trim(),
        isVideoMode: false,
        pages: expect.arrayContaining([
          expect.objectContaining({
            imageUrl: expect.any(String),
            audioUrl: expect.any(String),
            textContent: expect.any(String)
          })
        ])
      }));
    });

    it('should create video book with valid data', async () => {
      const testVideoBook = global.testUtils.createTestVideoBook();
      const newBook = { ...testVideoBook, id: 'new-video-book-id' };
      
      mockAddBook.mockResolvedValue(newBook);

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(testVideoBook)
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.data).toEqual(newBook);
      expect(mockAddBook).toHaveBeenCalledWith(expect.objectContaining({
        title: testVideoBook.title.trim(),
        coverImage: testVideoBook.coverImage.trim(),
        isVideoMode: true,
        videoUrl: testVideoBook.videoUrl.trim(),
        pages: []
      }));
    });

    it('should reject request without API key', async () => {
      const testBook = global.testUtils.createTestBook();

      const response = await request(app)
        .post('/books')
        .send(testBook)
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      const testBook = global.testUtils.createTestBook();

      const response = await request(app)
        .post('/books')
        .set('x-api-key', 'invalid-key')
        .send(testBook)
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should validate required title field', async () => {
      const invalidBook = { coverImage: '/test.png', pages: [] };

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(invalidBook)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Title is required');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should validate cover image for traditional books', async () => {
      const bookWithoutCover = {
        title: '테스트 책',
        isVideoMode: false,
        pages: [
          { imageUrl: '/page1.png', audioUrl: '/page1.mp3' }
        ]
      };

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(bookWithoutCover)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Cover image is required for traditional books');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should validate video URL for video mode books', async () => {
      const videoBookWithoutUrl = {
        title: '테스트 비디오 책',
        isVideoMode: true,
        coverImage: '/cover.png'
      };

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(videoBookWithoutUrl)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Video URL is required for video mode books');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should validate pages array for traditional books', async () => {
      const bookWithoutPages = {
        title: '테스트 책',
        coverImage: '/cover.png',
        isVideoMode: false,
        pages: []
      };

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(bookWithoutPages)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Pages array is required for traditional books');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should validate individual page content', async () => {
      const bookWithInvalidPage = {
        title: '테스트 책',
        coverImage: '/cover.png',
        isVideoMode: false,
        pages: [
          { imageUrl: '/page1.png' }, // Missing audioUrl
          { audioUrl: '/page2.mp3' }  // Missing imageUrl
        ]
      };

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(bookWithInvalidPage)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Page 1 must have imageUrl and audioUrl');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should trim whitespace from input fields', async () => {
      const bookWithSpaces = {
        title: '  테스트 책  ',
        coverImage: '  /uploads/images/cover.png  ',
        isVideoMode: false,
        pages: [
          {
            imageUrl: '  /uploads/images/page1.png  ',
            audioUrl: '  /uploads/audio/page1.mp3  ',
            textContent: '  첫 번째 페이지  '
          }
        ],
        minAge: 3,
        maxAge: 7
      };
      
      const newBook = { ...bookWithSpaces, id: 'new-book-id' };
      mockAddBook.mockResolvedValue(newBook);

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(bookWithSpaces)
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(mockAddBook).toHaveBeenCalledWith(expect.objectContaining({
        title: '테스트 책',
        coverImage: '/uploads/images/cover.png',
        pages: expect.arrayContaining([
          expect.objectContaining({
            imageUrl: '/uploads/images/page1.png',
            audioUrl: '/uploads/audio/page1.mp3',
            textContent: '첫 번째 페이지'
          })
        ])
      }));
    });

    it('should handle server errors during book creation', async () => {
      const testBook = global.testUtils.createTestBook();
      mockAddBook.mockRejectedValue(new Error('Database write failed'));

      const response = await request(app)
        .post('/books')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(testBook)
        .expect(500);

      global.testUtils.expectErrorResponse(response, 500);
      expect(response.body.message).toBe('Database write failed');
    });
  });

  describe('POST /books/video-upload - Video Upload & Book Creation (Critical)', () => {
    it('should create video book with file upload', async () => {
      const newVideoBook = {
        id: 'new-video-book-id',
        title: '업로드된 비디오 책',
        coverImage: '/uploads/images/test-cover.png',
        isVideoMode: true,
        videoUrl: '/uploads/videos/test-video.mp4',
        pages: [],
        minAge: 3,
        maxAge: 7
      };
      
      mockAddBook.mockResolvedValue(newVideoBook);

      const response = await request(app)
        .post('/books/video-upload')
        .set('x-api-key', global.testUtils.validApiKey)
        .field('title', '업로드된 비디오 책')
        .field('minAge', '3')
        .field('maxAge', '7')
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.data.uploadedFiles).toBeDefined();
      expect(response.body.data.uploadedFiles.video).toMatchObject({
        filename: 'test-video.mp4',
        originalName: 'story.mp4',
        url: '/uploads/videos/test-video.mp4'
      });
      expect(response.body.data.uploadedFiles.coverImage).toMatchObject({
        filename: 'test-cover.png',
        originalName: 'cover.png',
        url: '/uploads/images/test-cover.png'
      });
      expect(response.body.message).toBe('Video storybook created successfully');
    });

    it('should reject upload without API key', async () => {
      const response = await request(app)
        .post('/books/video-upload')
        .field('title', '테스트 비디오')
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should validate required title field', async () => {
      const response = await request(app)
        .post('/books/video-upload')
        .set('x-api-key', global.testUtils.validApiKey)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Title is required');
      expect(mockAddBook).not.toHaveBeenCalled();
    });

    it('should validate video file requirement', async () => {
      // Mock no files uploaded
      jest.doMock('../../server/middleware/upload.js', () => ({
        upload: {
          fields: () => (req, res, next) => {
            req.files = {}; // No files
            next();
          }
        },
        handleUploadError: (req, res, next) => next()
      }));

      const response = await request(app)
        .post('/books/video-upload')
        .set('x-api-key', global.testUtils.validApiKey)
        .field('title', '테스트 비디오')
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Video file is required');
      expect(mockAddBook).not.toHaveBeenCalled();
    });
  });

  describe('POST /books/complete - Complete Book Creation', () => {
    it('should create complete book with all 4 pages', async () => {
      const completeBookData = {
        title: '완전한 책',
        coverImage: '/uploads/images/cover.png',
        page1Image: '/uploads/images/page1.png',
        page1Audio: '/uploads/audio/page1.mp3',
        page1Text: '첫 번째 페이지',
        page2Image: '/uploads/images/page2.png',
        page2Audio: '/uploads/audio/page2.mp3',
        page2Text: '두 번째 페이지',
        page3Image: '/uploads/images/page3.png',
        page3Audio: '/uploads/audio/page3.mp3',
        page3Text: '세 번째 페이지',
        page4Image: '/uploads/images/page4.png',
        page4Audio: '/uploads/audio/page4.mp3',
        page4Text: '네 번째 페이지'
      };

      const newBook = { ...completeBookData, id: 'complete-book-id' };
      mockAddBook.mockResolvedValue(newBook);

      const response = await request(app)
        .post('/books/complete')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(completeBookData)
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.message).toBe('Complete book created successfully');
      expect(mockAddBook).toHaveBeenCalledWith(expect.objectContaining({
        title: '완전한 책',
        coverImage: '/uploads/images/cover.png',
        pages: expect.arrayContaining([
          expect.objectContaining({
            imageUrl: '/uploads/images/page1.png',
            audioUrl: '/uploads/audio/page1.mp3',
            text: '첫 번째 페이지'
          }),
          expect.objectContaining({
            imageUrl: '/uploads/images/page4.png',
            audioUrl: '/uploads/audio/page4.mp3',
            text: '네 번째 페이지'
          })
        ])
      }));
      expect(mockAddBook.mock.calls[0][0].pages).toHaveLength(4);
    });

    it('should validate all required fields for complete book', async () => {
      const incompleteData = {
        title: '불완전한 책',
        coverImage: '/cover.png',
        page1Image: '/page1.png',
        // Missing page1Audio and other required fields
      };

      const response = await request(app)
        .post('/books/complete')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(incompleteData)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Title, coverImage, and all page images and audio are required');
      expect(mockAddBook).not.toHaveBeenCalled();
    });
  });

  describe('PUT /books/:id - Book Updates', () => {
    it('should update book with valid data', async () => {
      const updateData = { title: '수정된 책 제목' };
      const updatedBook = { ...global.testUtils.createTestBook(), ...updateData, id: '1' };
      
      mockUpdateBook.mockResolvedValue(updatedBook);

      const response = await request(app)
        .put('/books/1')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(updateData)
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data).toEqual(updatedBook);
      expect(response.body.message).toBe('Book updated successfully');
      expect(mockUpdateBook).toHaveBeenCalledWith('1', { title: '수정된 책 제목' });
    });

    it('should return 404 for non-existent book', async () => {
      mockUpdateBook.mockResolvedValue(null);

      const response = await request(app)
        .put('/books/999')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({ title: '수정된 책' })
        .expect(404);

      global.testUtils.expectErrorResponse(response, 404, 'Book not found');
    });

    it('should reject update with no fields', async () => {
      const response = await request(app)
        .put('/books/1')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({})
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'At least one field must be provided for update');
      expect(mockUpdateBook).not.toHaveBeenCalled();
    });

    it('should validate page count for traditional books', async () => {
      const updateData = {
        isVideoMode: false,
        pages: [
          { imageUrl: '/page1.png', audioUrl: '/page1.mp3' },
          { imageUrl: '/page2.png', audioUrl: '/page2.mp3' }
          // Only 2 pages instead of required 4
        ]
      };

      const response = await request(app)
        .put('/books/1')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(updateData)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Exactly 4 pages are required for traditional books');
      expect(mockUpdateBook).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /books/:id - Book Deletion', () => {
    it('should delete book successfully', async () => {
      mockDeleteBook.mockResolvedValue(true);

      const response = await request(app)
        .delete('/books/1')
        .set('x-api-key', global.testUtils.validApiKey)
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.message).toBe('Book deleted successfully');
      expect(mockDeleteBook).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent book', async () => {
      mockDeleteBook.mockResolvedValue(false);

      const response = await request(app)
        .delete('/books/999')
        .set('x-api-key', global.testUtils.validApiKey)
        .expect(404);

      global.testUtils.expectErrorResponse(response, 404, 'Book not found');
    });

    it('should require API key for deletion', async () => {
      const response = await request(app)
        .delete('/books/1')
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockDeleteBook).not.toHaveBeenCalled();
    });
  });
});