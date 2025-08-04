import { createI18n } from 'vue-i18n';
import type { Language } from '@/types';

// 지원하는 언어 목록
export const SUPPORTED_LANGUAGES: Language[] = ['ko', 'en'];

// 기본 언어
export const DEFAULT_LANGUAGE: Language = 'ko';

// 언어팩 동적 로딩 함수
const loadLocaleMessages = async (locale: Language) => {
  try {
    const messages = await import(`../locales/${locale}.json`);
    return messages.default;
  } catch (error) {
    console.warn(`Failed to load locale messages for ${locale}:`, error);
    // 기본 언어로 폴백
    if (locale !== DEFAULT_LANGUAGE) {
      console.log(`Falling back to default language: ${DEFAULT_LANGUAGE}`);
      return await loadLocaleMessages(DEFAULT_LANGUAGE);
    }
    throw error;
  }
};

// 브라우저 언어 감지
export const detectBrowserLanguage = (): Language => {
  const browserLang = navigator.language || navigator.languages?.[0] || DEFAULT_LANGUAGE;
  
  // 브라우저 언어를 지원하는 언어로 매핑
  if (browserLang.startsWith('ko')) return 'ko';
  if (browserLang.startsWith('en')) return 'en';
  
  return DEFAULT_LANGUAGE;
};

// localStorage에서 언어 설정 불러오기
export const getStoredLanguage = (): Language => {
  try {
    const stored = localStorage.getItem('app-language') as Language;
    return SUPPORTED_LANGUAGES.includes(stored) ? stored : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
};

// localStorage에 언어 설정 저장
export const setStoredLanguage = (language: Language): void => {
  try {
    localStorage.setItem('app-language', language);
  } catch (error) {
    console.warn('Failed to store language preference:', error);
  }
};

// 초기 언어 결정 (우선순위: localStorage > 브라우저 언어 > 기본 언어)
export const getInitialLanguage = (): Language => {
  const stored = getStoredLanguage();
  if (stored !== DEFAULT_LANGUAGE) {
    return stored;
  }
  
  return detectBrowserLanguage();
};

// i18n 인스턴스 생성
let i18nInstance: ReturnType<typeof createI18n> | null = null;

export const createI18nInstance = async (initialLocale?: Language) => {
  const locale = initialLocale || getInitialLanguage();
  
  // 초기 언어팩 로드
  const messages = {
    [locale]: await loadLocaleMessages(locale)
  };
  
  i18nInstance = createI18n({
    legacy: false,
    locale,
    fallbackLocale: DEFAULT_LANGUAGE,
    messages,
    globalInjection: true,
    // 개발 환경에서만 missing key 경고 표시
    silentTranslationWarn: import.meta.env.PROD,
    // 폴백 경고 비활성화 (프로덕션)
    silentFallbackWarn: import.meta.env.PROD
  });
  
  return i18nInstance;
};

// 언어 동적 변경 함수
export const changeLanguage = async (language: Language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    console.warn(`Unsupported language: ${language}`);
    return false;
  }
  
  if (!i18nInstance) {
    console.error('i18n instance not initialized');
    return false;
  }
  
  try {
    // 이미 로드된 언어인지 확인
    if (!i18nInstance.global.availableLocales.includes(language)) {
      // 새로운 언어팩 로드
      const messages = await loadLocaleMessages(language);
      i18nInstance.global.setLocaleMessage(language, messages);
      console.log(`✅ Loaded locale messages for: ${language}`);
    }
    
    // 언어 변경
    (i18nInstance.global.locale as any).value = language;
    
    // localStorage에 저장
    setStoredLanguage(language);
    
    // HTML lang 속성 업데이트
    document.documentElement.lang = language;
    
    console.log(`🌐 Language changed to: ${language}`);
    return true;
  } catch (error) {
    console.error(`Failed to change language to ${language}:`, error);
    return false;
  }
};

// 현재 언어 가져오기
export const getCurrentLanguage = (): Language => {
  return (i18nInstance?.global.locale as any)?.value as Language || DEFAULT_LANGUAGE;
};

// 언어팩 미리 로드 (성능 최적화)
export const preloadLanguage = async (language: Language) => {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    return false;
  }
  
  if (!i18nInstance) {
    return false;
  }
  
  try {
    if (!i18nInstance.global.availableLocales.includes(language)) {
      const messages = await loadLocaleMessages(language);
      i18nInstance.global.setLocaleMessage(language, messages);
      console.log(`✅ Preloaded locale messages for: ${language}`);
    }
    return true;
  } catch (error) {
    console.error(`Failed to preload language ${language}:`, error);
    return false;
  }
};

// 언어 표시명 가져오기
export const getLanguageDisplayName = (language: Language, currentLanguage: Language = getCurrentLanguage()): string => {
  const displayNames: Record<Language, Record<Language, string>> = {
    ko: {
      ko: '한국어',
      en: '영어'
    },
    en: {
      ko: 'Korean',
      en: 'English'
    }
  };
  
  return displayNames[currentLanguage]?.[language] || language;
};

// 다음 언어 가져오기 (언어 토글용)
export const getNextLanguage = (currentLanguage: Language = getCurrentLanguage()): Language => {
  const currentIndex = SUPPORTED_LANGUAGES.indexOf(currentLanguage);
  const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
  return SUPPORTED_LANGUAGES[nextIndex];
};

// 언어 관련 이벤트 타입
export interface LanguageChangeEvent {
  oldLanguage: Language;
  newLanguage: Language;
  success: boolean;
}

// 언어 변경 이벤트 리스너 (추후 확장용)
type LanguageChangeListener = (event: LanguageChangeEvent) => void;
const languageChangeListeners: LanguageChangeListener[] = [];

export const addLanguageChangeListener = (listener: LanguageChangeListener) => {
  languageChangeListeners.push(listener);
};

export const removeLanguageChangeListener = (listener: LanguageChangeListener) => {
  const index = languageChangeListeners.indexOf(listener);
  if (index > -1) {
    languageChangeListeners.splice(index, 1);
  }
};

// 언어 변경 이벤트 발생
const emitLanguageChangeEvent = (oldLanguage: Language, newLanguage: Language, success: boolean) => {
  const event: LanguageChangeEvent = { oldLanguage, newLanguage, success };
  languageChangeListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in language change listener:', error);
    }
  });
};

// changeLanguage 함수 개선 (이벤트 발생 포함)
export const changeLanguageWithEvent = async (language: Language) => {
  const oldLanguage = getCurrentLanguage();
  const success = await changeLanguage(language);
  emitLanguageChangeEvent(oldLanguage, language, success);
  return success;
};

export { i18nInstance };
export default i18nInstance;