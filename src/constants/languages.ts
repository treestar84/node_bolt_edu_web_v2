// 10개 언어 지원을 위한 완전한 언어 설정 시스템
// TTS 최적화, 번역 품질, UI 표시 등 모든 언어별 설정 포함

import type { LanguageConfig, SupportedLanguageCode } from '@/types/multilingual';

/**
 * 지원하는 10개 언어의 완전한 설정
 * 각 언어별로 TTS, 번역, UI 표시 최적화 정보 포함
 */
export const SUPPORTED_LANGUAGES: Record<SupportedLanguageCode, LanguageConfig> = {
  ko: {
    code: 'ko',
    name: '한국어',
    nativeName: '한국어',
    flag: '🇰🇷',
    ttsConfig: {
      lang: 'ko-KR',
      rate: 0.7,
      pitch: 1.1,
      voiceKeywords: ['female', 'woman', 'girl', 'korean']
    },
    translationPriority: 1,
    isPopular: true
  },
  
  zh: {
    code: 'zh',
    name: '중국어',
    nativeName: '中文',
    flag: '🇨🇳',
    ttsConfig: {
      lang: 'zh-CN',
      rate: 0.8,
      pitch: 1.0,
      voiceKeywords: ['female', 'mandarin', 'chinese']
    },
    translationPriority: 2,
    isPopular: true
  },
  
  en: {
    code: 'en',
    name: '영어',
    nativeName: 'English',
    flag: '🇺🇸',
    ttsConfig: {
      lang: 'en-US',
      rate: 0.8,
      pitch: 1.2,
      voiceKeywords: ['female', 'american', 'child']
    },
    translationPriority: 1,
    isPopular: true
  },
  
  ja: {
    code: 'ja',
    name: '일본어',
    nativeName: '日本語',
    flag: '🇯🇵',
    ttsConfig: {
      lang: 'ja-JP',
      rate: 0.7,
      pitch: 1.1,
      voiceKeywords: ['female', 'japanese']
    },
    translationPriority: 2,
    isPopular: true
  },
  
  es: {
    code: 'es',
    name: '스페인어',
    nativeName: 'Español',
    flag: '🇪🇸',
    ttsConfig: {
      lang: 'es-ES',
      rate: 0.9,
      pitch: 1.0,
      voiceKeywords: ['female', 'spanish', 'spain']
    },
    translationPriority: 1,
    isPopular: false
  },
  
  fr: {
    code: 'fr',
    name: '프랑스어',
    nativeName: 'Français',
    flag: '🇫🇷',
    ttsConfig: {
      lang: 'fr-FR',
      rate: 0.8,
      pitch: 1.0,
      voiceKeywords: ['female', 'french', 'france']
    },
    translationPriority: 1,
    isPopular: false
  },
  
  de: {
    code: 'de',
    name: '독일어',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    ttsConfig: {
      lang: 'de-DE',
      rate: 0.8,
      pitch: 0.9,
      voiceKeywords: ['female', 'german', 'deutschland']
    },
    translationPriority: 1,
    isPopular: false
  },
  
  ar: {
    code: 'ar',
    name: '아랍어',
    nativeName: 'العربية',
    flag: '🇸🇦',
    ttsConfig: {
      lang: 'ar-SA',
      rate: 0.7,
      pitch: 1.0,
      voiceKeywords: ['female', 'arabic', 'saudi']
    },
    translationPriority: 3,
    isPopular: false
  },
  
  hi: {
    code: 'hi',
    name: '힌디어',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    ttsConfig: {
      lang: 'hi-IN',
      rate: 0.8,
      pitch: 1.1,
      voiceKeywords: ['female', 'hindi', 'indian']
    },
    translationPriority: 3,
    isPopular: false
  },
  
  pt: {
    code: 'pt',
    name: '포르투갈어',
    nativeName: 'Português',
    flag: '🇧🇷',
    ttsConfig: {
      lang: 'pt-BR',
      rate: 0.9,
      pitch: 1.0,
      voiceKeywords: ['female', 'portuguese', 'brazilian', 'brasil']
    },
    translationPriority: 2,
    isPopular: false
  }
};

/**
 * 인기 있는 언어들 (UI에서 우선 표시)
 */
export const POPULAR_LANGUAGES: SupportedLanguageCode[] = [
  'ko', 'en', 'zh', 'ja'
];

/**
 * 언어별 번역 품질 우선순위 그룹
 */
export const TRANSLATION_PRIORITY_GROUPS = {
  high: ['ko', 'en', 'es', 'fr', 'de'] as SupportedLanguageCode[],
  medium: ['zh', 'ja', 'pt'] as SupportedLanguageCode[],
  low: ['ar', 'hi'] as SupportedLanguageCode[]
};

/**
 * 언어별 TTS 품질 예상도
 * (브라우저별로 다를 수 있지만 일반적인 지원도)
 */
export const TTS_QUALITY_EXPECTATIONS = {
  excellent: ['en', 'ko'] as SupportedLanguageCode[],
  good: ['zh', 'ja', 'es', 'fr', 'de'] as SupportedLanguageCode[],
  fair: ['pt', 'ar'] as SupportedLanguageCode[],
  poor: ['hi'] as SupportedLanguageCode[]
};

/**
 * 언어 쌍별 번역 품질 매트릭스
 * (어떤 언어에서 어떤 언어로 번역할 때 품질이 좋은지)
 */
export const TRANSLATION_QUALITY_MATRIX: Record<string, Record<string, number>> = {
  // 영어 기준 번역 (가장 정확함)
  en: {
    ko: 0.85, zh: 0.80, ja: 0.82, es: 0.90, fr: 0.88, 
    de: 0.87, ar: 0.70, hi: 0.65, pt: 0.86
  },
  
  // 한국어 기준 번역
  ko: {
    en: 0.85, zh: 0.75, ja: 0.80, es: 0.78, fr: 0.76,
    de: 0.74, ar: 0.60, hi: 0.58, pt: 0.72
  },
  
  // 중국어 기준 번역
  zh: {
    en: 0.80, ko: 0.75, ja: 0.85, es: 0.73, fr: 0.71,
    de: 0.69, ar: 0.62, hi: 0.60, pt: 0.70
  }
  
  // 나머지 언어들은 영어를 거쳐 번역하는 것이 더 정확할 것으로 예상
};

/**
 * 언어별 특수 문자 및 방향성 정보
 */
export const LANGUAGE_CHARACTERISTICS = {
  ko: { direction: 'ltr', hasSpaces: true, script: 'hangul' },
  zh: { direction: 'ltr', hasSpaces: false, script: 'han' },
  en: { direction: 'ltr', hasSpaces: true, script: 'latin' },
  ja: { direction: 'ltr', hasSpaces: false, script: 'mixed' },
  es: { direction: 'ltr', hasSpaces: true, script: 'latin' },
  fr: { direction: 'ltr', hasSpaces: true, script: 'latin' },
  de: { direction: 'ltr', hasSpaces: true, script: 'latin' },
  ar: { direction: 'rtl', hasSpaces: true, script: 'arabic' },
  hi: { direction: 'ltr', hasSpaces: true, script: 'devanagari' },
  pt: { direction: 'ltr', hasSpaces: true, script: 'latin' }
} as const;

/**
 * 카테고리별 언어 우선순위
 * (특정 카테고리에서 어떤 언어로 번역하는 것이 더 정확한지)
 */
export const CATEGORY_LANGUAGE_PREFERENCES = {
  animals: {
    primary: ['en', 'ko'] as SupportedLanguageCode[],
    secondary: ['zh', 'ja', 'es', 'fr', 'de'] as SupportedLanguageCode[]
  },
  colors: {
    primary: ['en', 'ko', 'es', 'fr'] as SupportedLanguageCode[],
    secondary: ['zh', 'ja', 'de', 'pt'] as SupportedLanguageCode[]
  },
  food: {
    primary: ['en', 'zh', 'ja', 'ko'] as SupportedLanguageCode[],
    secondary: ['es', 'fr', 'de', 'pt'] as SupportedLanguageCode[]
  },
  family: {
    primary: ['ko', 'en', 'zh', 'ja'] as SupportedLanguageCode[],
    secondary: ['es', 'fr', 'de', 'ar', 'hi'] as SupportedLanguageCode[]
  }
};

/**
 * 브라우저별 TTS 지원 언어 매트릭스
 * (참고용, 실제로는 런타임에 체크해야 함)
 */
export const BROWSER_TTS_SUPPORT = {
  chrome: ['ko', 'en', 'zh', 'ja', 'es', 'fr', 'de', 'ar', 'hi', 'pt'],
  firefox: ['ko', 'en', 'zh', 'ja', 'es', 'fr', 'de'],
  safari: ['ko', 'en', 'zh', 'ja', 'es', 'fr'],
  edge: ['ko', 'en', 'zh', 'ja', 'es', 'fr', 'de', 'ar']
} as const;

// === 유틸리티 함수들 ===

/**
 * 언어 코드로 언어 설정 정보 가져오기
 */
export function getLanguageConfig(code: string): LanguageConfig | null {
  return SUPPORTED_LANGUAGES[code as SupportedLanguageCode] || null;
}

/**
 * 인기 언어들 먼저 정렬한 언어 목록 반환
 */
export function getSortedLanguages(): LanguageConfig[] {
  const popular = POPULAR_LANGUAGES.map(code => SUPPORTED_LANGUAGES[code]);
  const others = Object.values(SUPPORTED_LANGUAGES).filter(
    lang => !POPULAR_LANGUAGES.includes(lang.code as SupportedLanguageCode)
  );
  
  return [...popular, ...others];
}

/**
 * 특정 언어를 제외한 언어 목록 반환
 */
export function getAvailableLanguages(excludeLanguages: string[] = []): LanguageConfig[] {
  return Object.values(SUPPORTED_LANGUAGES).filter(
    lang => !excludeLanguages.includes(lang.code)
  );
}

/**
 * 두 언어 간 예상 번역 품질 반환
 */
export function getExpectedTranslationQuality(
  fromLang: string, 
  toLang: string
): number {
  return TRANSLATION_QUALITY_MATRIX[fromLang]?.[toLang] || 0.70; // 기본 70%
}

/**
 * 언어의 TTS 품질 등급 반환
 */
export function getTTSQualityGrade(languageCode: string): 'excellent' | 'good' | 'fair' | 'poor' {
  for (const [grade, languages] of Object.entries(TTS_QUALITY_EXPECTATIONS)) {
    if (languages.includes(languageCode as SupportedLanguageCode)) {
      return grade as 'excellent' | 'good' | 'fair' | 'poor';
    }
  }
  return 'poor';
}

/**
 * 카테고리에 최적화된 언어 우선순위 반환
 */
export function getCategoryOptimizedLanguages(category: string): {
  primary: SupportedLanguageCode[];
  secondary: SupportedLanguageCode[];
} {
  return CATEGORY_LANGUAGE_PREFERENCES[category as keyof typeof CATEGORY_LANGUAGE_PREFERENCES] || {
    primary: ['en', 'ko'],
    secondary: ['zh', 'ja', 'es', 'fr', 'de', 'ar', 'hi', 'pt']
  };
}

/**
 * 언어가 RTL(오른쪽에서 왼쪽) 방향인지 확인
 */
export function isRTLLanguage(languageCode: string): boolean {
  return LANGUAGE_CHARACTERISTICS[languageCode as SupportedLanguageCode]?.direction === 'rtl';
}

/**
 * 언어가 공백으로 단어를 구분하는지 확인
 */
export function hasWordSpaces(languageCode: string): boolean {
  return LANGUAGE_CHARACTERISTICS[languageCode as SupportedLanguageCode]?.hasSpaces ?? true;
}

/**
 * 언어별 최적 음성 검색 키워드 반환
 */
export function getTTSVoiceKeywords(languageCode: string): string[] {
  const config = getLanguageConfig(languageCode);
  return config?.ttsConfig.voiceKeywords || [];
}

/**
 * 언어별 번역 우선순위 반환 (1: 높음, 3: 낮음)
 */
export function getTranslationPriority(languageCode: string): 1 | 2 | 3 {
  const config = getLanguageConfig(languageCode);
  return config?.translationPriority || 3;
}

// === 상수 정의 ===

/** 지원하는 모든 언어 코드 배열 */
export const ALL_LANGUAGE_CODES = Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguageCode[];

/** 총 지원 언어 수 */
export const TOTAL_LANGUAGES = ALL_LANGUAGE_CODES.length;

/** 기본 주 언어 (한국어) */
export const DEFAULT_PRIMARY_LANGUAGE: SupportedLanguageCode = 'ko';

/** 기본 보조 언어 (영어) */
export const DEFAULT_SECONDARY_LANGUAGE: SupportedLanguageCode = 'en';

/** 번역 품질 임계값 (이하면 경고 표시) */
export const TRANSLATION_QUALITY_THRESHOLD = 0.8;

/** TTS 테스트 타임아웃 (milliseconds) */
export const TTS_TEST_TIMEOUT = 5000;

/** 번역 캐시 기본 만료 시간 (7일) */
export const TRANSLATION_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;