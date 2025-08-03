/**
 * @fileoverview Test suite for Words API endpoints
 * @description Tests for word registration and management - critical for external integrations
 */

const request = require('supertest');
const express = require('express');

// Mock the data store BEFORE importing
const mockGetWords = jest.fn();
const mockAddWord = jest.fn();
const mockUpdateWord = jest.fn();
const mockDeleteWord = jest.fn();

jest.mock('../../server/data/store.js', () => ({
  mockGetWords: mockGetWords,
  mockAddWord: mockAddWord,
  mockUpdateWord: mockUpdateWord,
  mockDeleteWord: mockDeleteWord
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

// Import after mocking
const wordsRouter = require('../../server/routes/words.js').default;

const app = express();
app.use(express.json());
app.use('/words', wordsRouter);

describe('Words API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /words', () => {
    it('should return all words successfully', async () => {
      const mockWords = [
        global.testUtils.createTestWord({ id: '1' }),
        global.testUtils.createTestWord({ id: '2', name: '고양이', nameEn: 'cat', category: '동물' })
      ];
      
      mockGetWords.mockResolvedValue(mockWords);

      const response = await request(app)
        .get('/words')
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
      expect(mockGetWords).toHaveBeenCalledTimes(1);
    });

    it('should handle empty words list', async () => {
      mockGetWords.mockResolvedValue([]);

      const response = await request(app)
        .get('/words')
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.count).toBe(0);
    });

    it('should handle server errors', async () => {
      mockGetWords.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .get('/words')
        .expect(500);

      global.testUtils.expectErrorResponse(response, 500);
      expect(response.body.message).toBe('Database connection failed');
    });
  });

  describe('GET /words/:id', () => {
    it('should return specific word by ID', async () => {
      const mockWords = [
        global.testUtils.createTestWord({ id: '1' }),
        global.testUtils.createTestWord({ id: '2' })
      ];
      
      mockGetWords.mockResolvedValue(mockWords);

      const response = await request(app)
        .get('/words/1')
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data.id).toBe('1');
    });

    it('should return 404 for non-existent word', async () => {
      mockGetWords.mockResolvedValue([]);

      const response = await request(app)
        .get('/words/999')
        .expect(404);

      global.testUtils.expectErrorResponse(response, 404, 'Word not found');
    });
  });

  describe('POST /words - Word Registration (Critical)', () => {
    it('should create new word with valid API key and data', async () => {
      const testWord = global.testUtils.createTestWord();
      const newWord = { ...testWord, id: 'new-word-id' };
      
      mockAddWord.mockResolvedValue(newWord);

      const response = await request(app)
        .post('/words')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(testWord)
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.data).toEqual(newWord);
      expect(response.body.message).toBe('Word created successfully');
      expect(mockAddWord).toHaveBeenCalledWith({
        name: testWord.name.trim(),
        nameEn: testWord.nameEn.trim(),
        imageUrl: testWord.imageUrl.trim(),
        audioKo: testWord.audioKo.trim(),
        audioEn: testWord.audioEn.trim(),
        category: testWord.category.trim()
      });
    });

    it('should reject request without API key', async () => {
      const testWord = global.testUtils.createTestWord();

      const response = await request(app)
        .post('/words')
        .send(testWord)
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockAddWord).not.toHaveBeenCalled();
    });

    it('should reject request with invalid API key', async () => {
      const testWord = global.testUtils.createTestWord();

      const response = await request(app)
        .post('/words')
        .set('x-api-key', 'invalid-key')
        .send(testWord)
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockAddWord).not.toHaveBeenCalled();
    });

    it('should validate required fields', async () => {
      const invalidWord = { name: '테스트' }; // Missing required fields

      const response = await request(app)
        .post('/words')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(invalidWord)
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'All fields are required');
      expect(mockAddWord).not.toHaveBeenCalled();
    });

    it('should handle each missing required field', async () => {
      const requiredFields = ['name', 'nameEn', 'imageUrl', 'audioKo', 'audioEn', 'category'];
      
      for (const field of requiredFields) {
        const incompleteWord = global.testUtils.createTestWord();
        delete incompleteWord[field];

        const response = await request(app)
          .post('/words')
          .set('x-api-key', global.testUtils.validApiKey)
          .send(incompleteWord)
          .expect(400);

        global.testUtils.expectErrorResponse(response, 400, 'All fields are required');
        expect(mockAddWord).not.toHaveBeenCalled();
      }
    });

    it('should trim whitespace from input fields', async () => {
      const wordWithSpaces = {
        name: '  테스트 단어  ',
        nameEn: '  test word  ',
        imageUrl: '  /uploads/images/test.png  ',
        audioKo: '  /uploads/audio/test-ko.mp3  ',
        audioEn: '  /uploads/audio/test-en.mp3  ',
        category: '  동물  '
      };
      
      const newWord = { ...wordWithSpaces, id: 'new-word-id' };
      mockAddWord.mockResolvedValue(newWord);

      const response = await request(app)
        .post('/words')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(wordWithSpaces)
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(mockAddWord).toHaveBeenCalledWith({
        name: '테스트 단어',
        nameEn: 'test word',
        imageUrl: '/uploads/images/test.png',
        audioKo: '/uploads/audio/test-ko.mp3',
        audioEn: '/uploads/audio/test-en.mp3',
        category: '동물'
      });
    });

    it('should handle server errors during word creation', async () => {
      const testWord = global.testUtils.createTestWord();
      mockAddWord.mockRejectedValue(new Error('Database write failed'));

      const response = await request(app)
        .post('/words')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(testWord)
        .expect(500);

      global.testUtils.expectErrorResponse(response, 500);
      expect(response.body.message).toBe('Database write failed');
    });
  });

  describe('POST /words/batch - Batch Word Registration (Critical)', () => {
    it('should create multiple words successfully', async () => {
      const testWords = [
        global.testUtils.createTestWord({ name: '고양이', nameEn: 'cat' }),
        global.testUtils.createTestWord({ name: '개', nameEn: 'dog' }),
        global.testUtils.createTestWord({ name: '새', nameEn: 'bird' })
      ];

      // Mock successful creation for all words
      mockAddWord
        .mockResolvedValueOnce({ ...testWords[0], id: '1' })
        .mockResolvedValueOnce({ ...testWords[1], id: '2' })
        .mockResolvedValueOnce({ ...testWords[2], id: '3' });

      const response = await request(app)
        .post('/words/batch')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({ words: testWords })
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.data.created).toHaveLength(3);
      expect(response.body.data.errors).toHaveLength(0);
      expect(response.body.data.summary.total).toBe(3);
      expect(response.body.data.summary.created).toBe(3);
      expect(response.body.data.summary.failed).toBe(0);
      expect(response.body.message).toContain('3 created, 0 failed');
      expect(mockAddWord).toHaveBeenCalledTimes(3);
    });

    it('should handle partial success with some invalid words', async () => {
      const testWords = [
        global.testUtils.createTestWord({ name: '고양이', nameEn: 'cat' }),
        { name: '개' }, // Missing required fields
        global.testUtils.createTestWord({ name: '새', nameEn: 'bird' })
      ];

      // Mock successful creation for valid words only
      mockAddWord
        .mockResolvedValueOnce({ ...testWords[0], id: '1' })
        .mockResolvedValueOnce({ ...testWords[2], id: '3' });

      const response = await request(app)
        .post('/words/batch')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({ words: testWords })
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.data.created).toHaveLength(2);
      expect(response.body.data.errors).toHaveLength(1);
      expect(response.body.data.errors[0].index).toBe(1);
      expect(response.body.data.errors[0].error).toBe('Missing required fields');
      expect(response.body.data.summary.total).toBe(3);
      expect(response.body.data.summary.created).toBe(2);
      expect(response.body.data.summary.failed).toBe(1);
      expect(mockAddWord).toHaveBeenCalledTimes(2);
    });

    it('should handle database errors during batch creation', async () => {
      const testWords = [
        global.testUtils.createTestWord({ name: '고양이', nameEn: 'cat' }),
        global.testUtils.createTestWord({ name: '개', nameEn: 'dog' })
      ];

      // Mock success for first, error for second
      mockAddWord
        .mockResolvedValueOnce({ ...testWords[0], id: '1' })
        .mockRejectedValueOnce(new Error('Database constraint violation'));

      const response = await request(app)
        .post('/words/batch')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({ words: testWords })
        .expect(201);

      global.testUtils.expectSuccessResponse(response, 201);
      expect(response.body.data.created).toHaveLength(1);
      expect(response.body.data.errors).toHaveLength(1);
      expect(response.body.data.errors[0].error).toBe('Database constraint violation');
    });

    it('should reject empty words array', async () => {
      const response = await request(app)
        .post('/words/batch')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({ words: [] })
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Words array is required and must not be empty');
      expect(mockAddWord).not.toHaveBeenCalled();
    });

    it('should reject non-array words', async () => {
      const response = await request(app)
        .post('/words/batch')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({ words: 'not-an-array' })
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'Words array is required and must not be empty');
      expect(mockAddWord).not.toHaveBeenCalled();
    });

    it('should require API key for batch operations', async () => {
      const testWords = [global.testUtils.createTestWord()];

      const response = await request(app)
        .post('/words/batch')
        .send({ words: testWords })
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockAddWord).not.toHaveBeenCalled();
    });
  });

  describe('PUT /words/:id - Word Updates', () => {
    it('should update word with valid data', async () => {
      const updateData = { name: '수정된 단어', category: '새 카테고리' };
      const updatedWord = { ...global.testUtils.createTestWord(), ...updateData, id: '1' };
      
      mockUpdateWord.mockResolvedValue(updatedWord);

      const response = await request(app)
        .put('/words/1')
        .set('x-api-key', global.testUtils.validApiKey)
        .send(updateData)
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.data).toEqual(updatedWord);
      expect(response.body.message).toBe('Word updated successfully');
      expect(mockUpdateWord).toHaveBeenCalledWith('1', {
        name: '수정된 단어',
        category: '새 카테고리'
      });
    });

    it('should return 404 for non-existent word', async () => {
      mockUpdateWord.mockResolvedValue(null);

      const response = await request(app)
        .put('/words/999')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({ name: '수정된 단어' })
        .expect(404);

      global.testUtils.expectErrorResponse(response, 404, 'Word not found');
    });

    it('should reject update with no fields', async () => {
      const response = await request(app)
        .put('/words/1')
        .set('x-api-key', global.testUtils.validApiKey)
        .send({})
        .expect(400);

      global.testUtils.expectErrorResponse(response, 400, 'At least one field must be provided for update');
      expect(mockUpdateWord).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /words/:id - Word Deletion', () => {
    it('should delete word successfully', async () => {
      mockDeleteWord.mockResolvedValue(true);

      const response = await request(app)
        .delete('/words/1')
        .set('x-api-key', global.testUtils.validApiKey)
        .expect(200);

      global.testUtils.expectSuccessResponse(response);
      expect(response.body.message).toBe('Word deleted successfully');
      expect(mockDeleteWord).toHaveBeenCalledWith('1');
    });

    it('should return 404 for non-existent word', async () => {
      mockDeleteWord.mockResolvedValue(false);

      const response = await request(app)
        .delete('/words/999')
        .set('x-api-key', global.testUtils.validApiKey)
        .expect(404);

      global.testUtils.expectErrorResponse(response, 404, 'Word not found');
    });

    it('should require API key for deletion', async () => {
      const response = await request(app)
        .delete('/words/1')
        .expect(401);

      global.testUtils.expectErrorResponse(response, 401, 'Invalid or missing API key');
      expect(mockDeleteWord).not.toHaveBeenCalled();
    });
  });
});