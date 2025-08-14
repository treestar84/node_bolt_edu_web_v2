// API 키 관리 유틸리티
// localStorage를 사용한 간단한 API 키 저장/관리 시스템

export interface ApiKeyConfig {
  google?: string;
  microsoft?: string;
  papago?: {
    clientId: string;
    clientSecret: string;
  };
}

const API_KEY_STORAGE_KEY = 'translation_api_keys';

/**
 * API 키를 localStorage에서 로드
 */
export function loadApiKeys(): ApiKeyConfig {
  try {
    const stored = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('API 키 로드 실패:', error);
  }
  
  return {};
}

/**
 * API 키를 localStorage에 저장
 */
export function saveApiKeys(config: ApiKeyConfig): void {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, JSON.stringify(config));
    console.log('API 키 저장 완료');
  } catch (error) {
    console.error('API 키 저장 실패:', error);
  }
}

/**
 * 특정 서비스의 API 키 설정
 */
export function setApiKey(service: 'google' | 'microsoft', key: string): void {
  const config = loadApiKeys();
  config[service] = key;
  saveApiKeys(config);
}

/**
 * Papago API 키 설정 (clientId, clientSecret 필요)
 */
export function setPapagoApiKeys(clientId: string, clientSecret: string): void {
  const config = loadApiKeys();
  config.papago = { clientId, clientSecret };
  saveApiKeys(config);
}

/**
 * API 키 삭제
 */
export function removeApiKey(service: 'google' | 'microsoft' | 'papago'): void {
  const config = loadApiKeys();
  delete config[service];
  saveApiKeys(config);
}

/**
 * 모든 API 키 삭제
 */
export function clearAllApiKeys(): void {
  localStorage.removeItem(API_KEY_STORAGE_KEY);
  console.log('모든 API 키 삭제됨');
}

/**
 * API 키 유효성 검사 (간단한 형태 검증)
 */
export function validateApiKey(service: string, key: string): boolean {
  if (!key || key.trim().length < 10) {
    return false;
  }
  
  switch (service) {
    case 'google':
      // Google API 키는 AIza로 시작함
      return key.startsWith('AIza') && key.length >= 35;
    
    case 'microsoft':
      // Microsoft API 키는 32자리 hexadecimal
      return /^[a-f0-9]{32}$/i.test(key);
    
    default:
      return key.length >= 10;
  }
}

/**
 * API 키 마스킹 (보안을 위해 일부만 표시)
 */
export function maskApiKey(key: string): string {
  if (!key || key.length < 8) {
    return '****';
  }
  
  const start = key.substring(0, 4);
  const end = key.substring(key.length - 4);
  return `${start}${'*'.repeat(key.length - 8)}${end}`;
}

/**
 * API 키 상태 체크
 */
export function getApiKeyStatus(): {
  google: boolean;
  microsoft: boolean;
  papago: boolean;
} {
  const config = loadApiKeys();
  
  return {
    google: !!(config.google && validateApiKey('google', config.google)),
    microsoft: !!(config.microsoft && validateApiKey('microsoft', config.microsoft)),
    papago: !!(config.papago?.clientId && config.papago?.clientSecret)
  };
}