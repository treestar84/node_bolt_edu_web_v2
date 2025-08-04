// 하이브리드 API 키 관리: DB + 환경변수 조합
import { getApiKeys as getDbApiKeys, getApiKeyForAuth as getDbApiKeyForAuth, addApiKey as addDbApiKey, deleteApiKey as deleteDbApiKey } from './dbApiKeyManager.js';

// 환경변수 기반 기본 API 키 (항상 사용 가능)
const ENV_API_KEYS = [
  {
    id: 'env-primary-key',
    key: process.env.VITE_API_KEY || '9d4d66b259384b44be5dccee037a4cc1',
    name: 'Primary Environment Key',
    description: 'Primary API key from environment variables',
    active: true,
    createdAt: '2025-08-03T00:00:00.000Z',
    lastUsed: null,
    usageCount: 0
  }
];

// 모든 API 키 조회 (DB + 환경변수)
export const getApiKeys = async () => {
  try {
    // DB에서 키 조회 시도
    const dbKeys = await getDbApiKeys();
    
    // 환경변수 키들 (보안상 실제 키값은 숨김)
    const envKeys = ENV_API_KEYS.map(key => ({
      id: key.id,
      name: key.name,
      description: key.description,
      active: key.active,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      keyPreview: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`,
      source: 'environment'
    }));

    // DB 키들에 소스 표시 추가
    const dbKeysWithSource = dbKeys.map(key => ({
      ...key,
      source: 'database'
    }));

    console.log(`🔑 Found ${envKeys.length} environment keys and ${dbKeys.length} database keys`);
    
    return [...envKeys, ...dbKeysWithSource];
  } catch (error) {
    console.error('❌ Error in hybrid getApiKeys:', error);
    // DB 실패시 환경변수 키만 반환
    return ENV_API_KEYS.map(key => ({
      id: key.id,
      name: key.name,
      description: key.description,
      active: key.active,
      createdAt: key.createdAt,
      lastUsed: key.lastUsed,
      usageCount: key.usageCount,
      keyPreview: `${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`,
      source: 'environment'
    }));
  }
};

// API 키 인증 (DB + 환경변수 모두 확인)
export const getApiKeyForAuth = async (keyValue) => {
  try {
    if (!keyValue) return null;

    // 1. 환경변수 키 먼저 확인
    const envKey = ENV_API_KEYS.find(key => key.key === keyValue && key.active);
    if (envKey) {
      console.log(`🔑 Environment API key used: ${envKey.name}`);
      return {
        ...envKey,
        lastUsed: new Date().toISOString(),
        usageCount: envKey.usageCount + 1
      };
    }

    // 2. DB 키 확인
    const dbKey = await getDbApiKeyForAuth(keyValue);
    if (dbKey) {
      console.log(`🔑 Database API key used: ${dbKey.name}`);
      return dbKey;
    }

    return null;
  } catch (error) {
    console.error('❌ Error in hybrid getApiKeyForAuth:', error);
    return null;
  }
};

// 새 API 키 생성 (DB에 저장 시도, 실패시 경고)
export const addApiKey = async (keyData) => {
  try {
    return await addDbApiKey(keyData);
  } catch (error) {
    console.error('❌ Failed to create API key in database:', error);
    throw new Error('Database API key creation failed. Please check Supabase configuration.');
  }
};

// API 키 삭제 (환경변수 키는 삭제 불가)
export const deleteApiKey = async (id) => {
  // 환경변수 키는 삭제 불가
  if (ENV_API_KEYS.some(key => key.id === id)) {
    console.log('⚠️ Cannot delete environment-based API key');
    return false;
  }

  try {
    return await deleteDbApiKey(id);
  } catch (error) {
    console.error('❌ Failed to delete API key from database:', error);
    return false;
  }
};

export default {
  getApiKeys,
  getApiKeyForAuth,
  addApiKey,
  deleteApiKey
};