import crypto from 'crypto';

// Environment-based API key management
const API_KEYS = {
  // Load from environment variables - much safer than JSON files
  'primary': {
    id: 'primary-key-2025',
    key: process.env.VITE_API_KEY || '9d4d66b259384b44be5dccee037a4cc1',
    name: 'Primary API Key',
    description: 'Main API key for application access',
    active: true,
    createdAt: '2025-08-03T00:00:00.000Z',
    lastUsed: null,
    usageCount: 0
  },
  // You can add more keys here or load from a secure database
  'backup': {
    id: 'backup-key-2025',
    key: process.env.BACKUP_API_KEY || 'backup-key-placeholder',
    name: 'Backup API Key',
    description: 'Backup API key for redundancy',
    active: process.env.BACKUP_API_KEY ? true : false,
    createdAt: '2025-08-03T00:00:00.000Z',
    lastUsed: null,
    usageCount: 0
  }
};

// Get all API keys (without exposing the actual key values)
export const getApiKeys = async () => {
  const keys = Object.values(API_KEYS)
    .filter(key => key.active)
    .map(key => ({
      id: key.id,
      name: key.name,
      description: key.description,
      active: key.active,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      keyPreview: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`
    }));
  
  return keys;
};

// Get API key for authentication (returns full key data)
export const getApiKeyForAuth = async (keyValue) => {
  const foundKey = Object.values(API_KEYS).find(
    key => key.key === keyValue && key.active
  );
  
  if (foundKey) {
    // Update usage stats (in a real app, you'd persist this to DB)
    foundKey.lastUsed = new Date().toISOString();
    foundKey.usageCount += 1;
    console.log(`API key used: ${foundKey.name} (${foundKey.usageCount} times)`);
  }
  
  return foundKey || null;
};

// Add new API key (for demo purposes - in production, this would be admin-only)
export const addApiKey = async (keyData) => {
  const newKey = {
    id: `key-${Date.now()}`,
    key: crypto.randomBytes(16).toString('hex'),
    name: keyData.name,
    description: keyData.description || '',
    active: true,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0
  };
  
  // In a real app, you'd save this to a secure database
  console.warn('⚠️  New API key generated. In production, store this securely!');
  console.log('📝 Generated key:', newKey);
  
  return newKey;
};

// Delete API key
export const deleteApiKey = async (id) => {
  // In this environment-based approach, we can't actually delete env-based keys
  // This would typically interact with a database
  console.log(`🗑️  API key deletion requested for ID: ${id}`);
  console.warn('⚠️  Cannot delete environment-based keys. Use database implementation for dynamic key management.');
  
  return false; // Cannot delete environment-based keys
};

// Validate API key format
export const isValidApiKeyFormat = (key) => {
  if (!key || typeof key !== 'string') return false;
  // Should be at least 32 characters (basic security check)
  return key.length >= 32;
};

export default {
  getApiKeys,
  getApiKeyForAuth,
  addApiKey,
  deleteApiKey,
  isValidApiKeyFormat
};