import express from 'express';
import { authenticateApiKey } from '../middleware/auth.js';
import { getWords, addWord, updateWord, deleteWord } from '../data/store.js';

const router = express.Router();

/**
 * @swagger
 * /words:
 *   get:
 *     summary: Get all words
 *     description: Retrieve all words in the database. No authentication required.
 *     tags: [Words]
 *     security: []
 *     responses:
 *       200:
 *         description: Successfully retrieved all words
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
 *                     $ref: '#/components/schemas/Word'
 *                 count:
 *                   type: integer
 *                   description: Total number of words
 *                   example: 25
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
// Get all words (public endpoint)
router.get('/', async (req, res) => {
  try {
    const words = await getWords();
    res.json({
      success: true,
      data: words,
      count: words.length
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
 * /words/{id}:
 *   get:
 *     summary: Get word by ID
 *     description: Retrieve a specific word by its ID. No authentication required.
 *     tags: [Words]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Word ID
 *         example: word-123
 *     responses:
 *       200:
 *         description: Successfully retrieved the word
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Word'
 *       404:
 *         description: Word not found
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
// Get word by ID (public endpoint)
router.get('/:id', async (req, res) => {
  try {
    const words = await getWords();
    const word = words.find(w => w.id === req.params.id);
    
    if (!word) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Word not found'
      });
    }
    
    res.json({
      success: true,
      data: word
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
 * /words:
 *   post:
 *     summary: Create new word
 *     description: Create a new word. Requires API key authentication.
 *     tags: [Words]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, nameEn, imageUrl, audioKo, audioEn, category]
 *             properties:
 *               name:
 *                 type: string
 *                 description: Korean name of the word
 *                 example: 고양이
 *               nameEn:
 *                 type: string
 *                 description: English name of the word
 *                 example: cat
 *               imageUrl:
 *                 type: string
 *                 description: URL path to the word image
 *                 example: /uploads/images/cat.png
 *               audioKo:
 *                 type: string
 *                 description: URL path to Korean audio file
 *                 example: /uploads/audio/cat-ko.mp3
 *               audioEn:
 *                 type: string
 *                 description: URL path to English audio file
 *                 example: /uploads/audio/cat-en.mp3
 *               category:
 *                 type: string
 *                 description: Category of the word
 *                 example: 동물
 *     responses:
 *       201:
 *         description: Word created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Word'
 *                 message:
 *                   type: string
 *                   example: Word created successfully
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
// Create new word (requires API key)
router.post('/', authenticateApiKey, async (req, res) => {
  try {
    const { name, nameEn, imageUrl, audioKo, audioEn, category } = req.body;
    
    // Validation
    if (!name || !nameEn || !imageUrl || !audioKo || !audioEn || !category) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'All fields are required: name, nameEn, imageUrl, audioKo, audioEn, category'
      });
    }
    
    const wordData = {
      name: name.trim(),
      nameEn: nameEn.trim(),
      imageUrl: imageUrl.trim(),
      audioKo: audioKo.trim(),
      audioEn: audioEn.trim(),
      category: category.trim()
    };
    
    const newWord = await addWord(wordData);
    
    res.status(201).json({
      success: true,
      data: newWord,
      message: 'Word created successfully'
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
 * /words/batch:
 *   post:
 *     summary: Create multiple words (batch operation)
 *     description: Create multiple words in a single request. Requires API key authentication. Partial success is allowed - some words may succeed while others fail.
 *     tags: [Words]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BatchWordRequest'
 *           example:
 *             words:
 *               - name: 고양이
 *                 nameEn: cat
 *                 imageUrl: /uploads/images/cat.png
 *                 audioKo: /uploads/audio/cat-ko.mp3
 *                 audioEn: /uploads/audio/cat-en.mp3
 *                 category: 동물
 *               - name: 개
 *                 nameEn: dog
 *                 imageUrl: /uploads/images/dog.png
 *                 audioKo: /uploads/audio/dog-ko.mp3
 *                 audioEn: /uploads/audio/dog-en.mp3
 *                 category: 동물
 *     responses:
 *       201:
 *         description: Batch operation completed (may include partial failures)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BatchWordResponse'
 *       400:
 *         description: Bad request - invalid input format
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
// Create multiple words (batch creation)
router.post('/batch', authenticateApiKey, async (req, res) => {
  try {
    const { words } = req.body;
    
    if (!Array.isArray(words) || words.length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Words array is required and must not be empty'
      });
    }
    
    const createdWords = [];
    const errors = [];
    
    for (let i = 0; i < words.length; i++) {
      const wordData = words[i];
      const { name, nameEn, imageUrl, audioKo, audioEn, category } = wordData;
      
      // Validation for each word
      if (!name || !nameEn || !imageUrl || !audioKo || !audioEn || !category) {
        errors.push({
          index: i,
          error: 'Missing required fields',
          data: wordData
        });
        continue;
      }
      
      try {
        const newWord = await addWord({
          name: name.trim(),
          nameEn: nameEn.trim(),
          imageUrl: imageUrl.trim(),
          audioKo: audioKo.trim(),
          audioEn: audioEn.trim(),
          category: category.trim()
        });
        createdWords.push(newWord);
      } catch (error) {
        errors.push({
          index: i,
          error: error.message,
          data: wordData
        });
      }
    }
    
    res.status(201).json({
      success: true,
      data: {
        created: createdWords,
        errors: errors,
        summary: {
          total: words.length,
          created: createdWords.length,
          failed: errors.length
        }
      },
      message: `Batch operation completed: ${createdWords.length} created, ${errors.length} failed`
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
 * /words/{id}:
 *   put:
 *     summary: Update word
 *     description: Update an existing word by ID. Requires API key authentication.
 *     tags: [Words]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Word ID
 *         example: word-123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Korean name of the word
 *               nameEn:
 *                 type: string
 *                 description: English name of the word
 *               imageUrl:
 *                 type: string
 *                 description: URL path to the word image
 *               audioKo:
 *                 type: string
 *                 description: URL path to Korean audio file
 *               audioEn:
 *                 type: string
 *                 description: URL path to English audio file
 *               category:
 *                 type: string
 *                 description: Category of the word
 *           example:
 *             name: 새로운 고양이
 *             category: 애완동물
 *     responses:
 *       200:
 *         description: Word updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - no fields provided for update
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
 *         description: Word not found
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
// Update word (requires API key)
router.put('/:id', authenticateApiKey, async (req, res) => {
  try {
    const { name, nameEn, imageUrl, audioKo, audioEn, category } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (nameEn) updateData.nameEn = nameEn.trim();
    if (imageUrl) updateData.imageUrl = imageUrl.trim();
    if (audioKo) updateData.audioKo = audioKo.trim();
    if (audioEn) updateData.audioEn = audioEn.trim();
    if (category) updateData.category = category.trim();
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'At least one field must be provided for update'
      });
    }
    
    const updatedWord = await updateWord(req.params.id, updateData);
    
    if (!updatedWord) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Word not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedWord,
      message: 'Word updated successfully'
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
 * /words/{id}:
 *   delete:
 *     summary: Delete word
 *     description: Delete an existing word by ID. Requires API key authentication.
 *     tags: [Words]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Word ID
 *         example: word-123
 *     responses:
 *       200:
 *         description: Word deleted successfully
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
 *                   example: Word deleted successfully
 *       401:
 *         description: Unauthorized - invalid or missing API key
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Word not found
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
// Delete word (requires API key)
router.delete('/:id', authenticateApiKey, async (req, res) => {
  try {
    const deleted = await deleteWord(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Word not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Word deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;