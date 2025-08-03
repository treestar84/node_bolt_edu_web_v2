import express from 'express';
import { authenticateAdmin } from '../middleware/auth.js';
import { getApiKeys, addApiKey, deleteApiKey } from '../data/hybridApiKeyManager.js';
import { migrateFromJsonToDb } from '../data/dbApiKeyManager.js';
import { getApiKeys as getJsonApiKeys } from '../data/store.js';

const router = express.Router();

// Get all API keys (admin only)
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const apiKeys = await getApiKeys();
    
    // API keys are already safe (no actual key values exposed)
    res.json({
      success: true,
      data: apiKeys,
      count: apiKeys.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Create new API key (admin only)
router.post('/', authenticateAdmin, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'API key name is required'
      });
    }
    
    const newKey = await addApiKey({
      name: name.trim(),
      description: description ? description.trim() : ''
    });
    
    res.status(201).json({
      success: true,
      data: newKey,
      message: 'API key created successfully',
      warning: 'Save this key securely - it will not be shown again!'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Delete API key (admin only)
router.delete('/:id', authenticateAdmin, async (req, res) => {
  try {
    const deleted = await deleteApiKey(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'API key not found'
      });
    }
    
    res.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Migrate API keys from JSON to DB (admin only)
router.post('/migrate', authenticateAdmin, async (req, res) => {
  try {
    console.log('🔄 Starting API keys migration...');
    
    // JSON 파일에서 기존 키들 읽기
    const jsonApiKeys = await getJsonApiKeys();
    
    if (jsonApiKeys.length === 0) {
      return res.json({
        success: true,
        message: 'No API keys found in JSON file to migrate',
        migrated: 0
      });
    }

    // DB로 마이그레이션
    const success = await migrateFromJsonToDb(jsonApiKeys);
    
    if (success) {
      res.json({
        success: true,
        message: `Successfully migrated ${jsonApiKeys.length} API keys to database`,
        migrated: jsonApiKeys.length
      });
    } else {
      res.status(500).json({
        error: 'Migration failed',
        message: 'Failed to migrate API keys to database'
      });
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

export default router;