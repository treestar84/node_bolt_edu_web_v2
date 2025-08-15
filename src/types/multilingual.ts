// 다국어 자동화 시스템을 위한 새로운 타입 정의
// 기존 시스템과의 100% 호환성 보장

export interface LanguageConfig {
  /** 언어 코드 (ISO 639-1) */
  code: string;
  /** 한국어 언어명 */
  name: string;
  /** 현지어 언어명 */
  nativeName: string;
  /** 국기 이모지 */
  flag: string;
  /** TTS 설정 */
  ttsConfig: {
    /** 브라우저 TTS 언어 코드 */
    lang: string;
    /** 발음 속도 (0.1 - 2.0) */
    rate: number;
    /** 음성 높이 (0.0 - 2.0) */
    pitch: number;
    /** 선호 음성 키워드 (성별, 연령대 등) */
    voiceKeywords?: string[];
  };
  /** 번역 품질 우선순위 (1: 높음, 2: 보통, 3: 낮음) */
  translationPriority: 1 | 2 | 3;
  /** 이 언어가 주요 언어인지 (UI에서 우선 표시) */
  isPopular?: boolean;
}

export interface TranslationResult {
  /** 번역된 텍스트 */
  name: string;
  /** 번역 신뢰도 (0.0 - 1.0) */
  confidence: number;
  /** 번역 방식 */
  translatedBy: 'user' | 'auto' | 'hybrid';
  /** 번역 출처 */
  source: 'manual' | 'auto';
  /** 커스텀 업로드 음성 URL (선택사항) */
  audioUrl: string;
  /** 커스텀 음성 사용 여부 */
  isCustomAudio: boolean;
  /** 사용자가 번역을 검증했는지 */
  verified?: boolean;
  /** 번역 에러 정보 (실패 시) */
  error?: string;
  /** 번역에 사용된 API 제공자 */
  provider?: 'google' | 'deepl' | 'azure';
  /** 번역 시간 (milliseconds) */
  translationTime?: number;
  /** 검증 결과 */
  validation?: TranslationQualityScore | null;
}

export interface MultiLangWordItem {
  // === 기존 필드 (하위 호환성 보장) ===
  id: string;
  name: string;        // 기본 언어 (보통 한국어)
  nameEn: string;      // 영어 (기존 시스템)
  imageUrl: string;    // 이미지 URL
  audioKo: string;     // 한국어 음성 (기존 시스템)
  audioEn: string;     // 영어 음성 (기존 시스템)
  category: string;
  minAge: number;
  maxAge: number;
  ownerType: 'global' | 'user';
  ownerId?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageAspectRatio?: number;
  createdAt?: string;
  updatedAt?: string;
  
  // === 새로운 다국어 시스템 ===
  /** 언어별 번역 데이터 */
  translations?: {
    [languageCode: string]: TranslationResult;
  };
  
  /** 사용자가 선택한 주요 입력 언어 (모국어) */
  primaryLanguage?: string;
  
  /** 사용자가 선택한 보조 입력 언어 (공용어) */
  secondaryLanguage?: string;
  
  /** 자동 번역이 완료된 언어 목록 */
  autoTranslatedLanguages?: string[];
  
  /** 이미지 출처 정보 */
  imageSource?: 'pexels' | 'custom' | 'placeholder';
  
  /** 이미지 검색 키워드 (자동 생성 시 사용된) */
  imageSearchKeywords?: string[];
  
  /** 전체 자동화 처리 완료 여부 */
  isFullyProcessed?: boolean;
  
  /** 사용자 커스터마이징 정보 */
  customizations?: {
    hasCustomImage: boolean;
    hasCustomAudios: string[]; // 커스텀 음성이 있는 언어 코드들
    modifiedTranslations: string[]; // 사용자가 수정한 번역 언어들
  };
}

export interface BatchTranslationRequest {
  /** 번역할 원본 텍스트 */
  sourceText: string;
  /** 원본 언어 코드 */
  sourceLang: string;
  /** 번역할 대상 언어들 */
  targetLanguages: string[];
  /** 단어 카테고리 (번역 최적화를 위해) */
  category?: string;
  /** 최소 요구 신뢰도 (이하면 재번역) */
  minConfidence?: number;
  /** 캐시 사용 여부 */
  useCache?: boolean;
}

export interface BatchTranslationResponse {
  /** 언어별 번역 결과 */
  results: Record<string, TranslationResult>;
  /** 처리 메타데이터 */
  metadata: {
    /** 총 처리 시간 */
    totalProcessingTime: number;
    /** 캐시에서 가져온 결과 수 */
    cacheHits: number;
    /** API 호출 횟수 */
    apiCalls: number;
    /** 실패한 번역 수 */
    failures: number;
  };
}

export interface AutoProcessingStatus {
  /** 현재 진행 단계 */
  currentPhase: 'idle' | 'image' | 'translation' | 'tts' | 'completed' | 'error';
  /** 전체 진행률 (0-100) */
  overallProgress: number;
  /** 단계별 진행 상황 */
  phaseProgress: {
    image: {
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      progress: number;
      message?: string;
      generatedImageUrl?: string;
    };
    translation: {
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      progress: number;
      currentLanguage?: string;
      completedLanguages: string[];
      failedLanguages: string[];
    };
    tts: {
      status: 'pending' | 'in-progress' | 'completed' | 'failed';
      progress: number;
      testedLanguages: string[];
      supportedLanguages: string[];
    };
  };
  /** 처리 결과 */
  results: {
    imageUrl: string;
    translations: Record<string, TranslationResult>;
    audioSupport: Record<string, boolean>;
  };
  /** 에러 메시지 목록 */
  errors: string[];
  /** 에러 정보 */
  error?: {
    phase: string;
    message: string;
    code?: string;
    recoverable: boolean;
  };
}

export interface MultiLangFormData {
  /** 주요 언어 텍스트 */
  primaryText: string;
  /** 보조 언어 텍스트 */
  secondaryText: string;
  /** 카테고리 */
  category: string;
  /** 연령 범위 */
  minAge: number;
  maxAge: number;
  /** 자동 생성된 이미지 URL */
  generatedImageUrl?: string;
  /** 커스텀 업로드 이미지 URL */
  customImageUrl?: string;
  /** 언어별 커스텀 음성 */
  customAudios?: Record<string, string>;
  /** 번역 수정 오버라이드 */
  translationOverrides?: Record<string, string>;
}

export interface TranslationCache {
  /** 캐시 키 */
  key: string;
  /** 원본 텍스트 */
  sourceText: string;
  /** 원본 언어 */
  sourceLang: string;
  /** 대상 언어 */
  targetLang: string;
  /** 번역 결과 */
  translatedText: string;
  /** 신뢰도 */
  confidence: number;
  /** 번역 제공자 */
  provider: string;
  /** 생성 시간 */
  createdAt: string;
  /** 만료 시간 */
  expiresAt: string;
  /** 히트 카운트 (사용 빈도) */
  hitCount: number;
}

export interface TTSTestResult {
  /** 언어 코드 */
  languageCode: string;
  /** 테스트 텍스트 */
  text: string;
  /** TTS 지원 여부 */
  isSupported: boolean;
  /** 사용 가능한 음성 목록 */
  availableVoices: string[];
  /** 최적 음성 선택 결과 */
  selectedVoice?: string;
  /** 테스트 결과 품질 점수 (1-5) */
  qualityScore?: number;
}

export interface LanguageStatistics {
  /** 언어 코드 */
  languageCode: string;
  /** 총 번역 요청 수 */
  totalTranslations: number;
  /** 평균 번역 신뢰도 */
  averageConfidence: number;
  /** 사용자 수정 비율 */
  userModificationRate: number;
  /** 평균 번역 시간 */
  averageTranslationTime: number;
  /** 최근 30일 사용량 */
  recentUsage: number;
}

// 하위 호환성을 위한 타입 aliases
export type WordItem = MultiLangWordItem;
export type Language = string;

// === 번역 품질 검증 시스템 ===

export interface TranslationQualityScore {
  /** 전체 품질 점수 (0-100) */
  overall: number;
  /** 세부 점수 */
  breakdown: {
    /** 번역 서비스 신뢰도 (0-100) */
    providerReliability: number;
    /** 언어 쌍 품질 (0-100) */
    languagePairQuality: number;
    /** 단어 복잡도 고려 (0-100) */
    contextComplexity: number;
    /** 길이 적절성 (0-100) */
    lengthAppropriateness: number;
  };
  /** 품질 등급 */
  grade: 'excellent' | 'good' | 'fair' | 'poor' | 'needs_review';
  /** 신뢰도 레벨 */
  confidence: 'high' | 'medium' | 'low';
  /** 권장사항 */
  recommendations: string[];
  /** 검증 필요 여부 */
  needsValidation: boolean;
}

export interface UserTranslationValidation {
  /** 사용자 ID */
  userId?: string;
  /** 원본 번역 */
  originalTranslation: string;
  /** 사용자 수정 번역 */
  correctedTranslation: string;
  /** 수정 이유 */
  correctionReason?: 'grammar' | 'vocabulary' | 'context' | 'cultural' | 'other';
  /** 수정 설명 */
  correctionNote?: string;
  /** 검증 시간 */
  validatedAt: string;
  /** 원어민 여부 */
  isNativeSpeaker?: boolean;
  /** 언어 숙련도 */
  languageProficiency?: 'native' | 'fluent' | 'intermediate' | 'basic';
}

export interface TranslationQualityFeedback {
  /** 번역 ID (소스-타겟-텍스트 해시) */
  translationId: string;
  /** 언어 쌍 */
  languagePair: {
    source: SupportedLanguageCode;
    target: SupportedLanguageCode;
  };
  /** 원본 텍스트 */
  sourceText: string;
  /** 번역 텍스트 */
  translatedText: string;
  /** 사용된 번역 서비스 */
  provider: TranslationProvider | 'browser';
  /** 품질 점수 */
  qualityScore: TranslationQualityScore;
  /** 사용자 검증 데이터 */
  userValidations: UserTranslationValidation[];
  /** 대안 번역 제안 */
  alternatives?: string[];
  /** 자동 플래그 */
  autoFlags: {
    /** 길이 이상 */
    lengthAnomaly: boolean;
    /** 반복 텍스트 */
    repeatedText: boolean;
    /** 번역 실패 의심 */
    suspectedFailure: boolean;
    /** 부적절한 내용 */
    inappropriateContent: boolean;
  };
  /** 학습 데이터로 사용 여부 */
  useForLearning: boolean;
  /** 생성 시간 */
  createdAt: string;
  /** 마지막 업데이트 */
  updatedAt: string;
}

export interface QualityValidationSettings {
  /** 최소 신뢰 점수 */
  minConfidenceThreshold: number;
  /** 자동 검증 활성화 */
  enableAutoValidation: boolean;
  /** 사용자 검증 활성화 */
  enableUserValidation: boolean;
  /** 대안 번역 표시 */
  showAlternatives: boolean;
  /** 원어민 우선 검증 */
  prioritizeNativeValidation: boolean;
  /** 학습 데이터 수집 동의 */
  allowLearningDataCollection: boolean;
}

export interface LanguagePairQuality {
  /** 언어 쌍 */
  pair: {
    source: SupportedLanguageCode;
    target: SupportedLanguageCode;
  };
  /** 기본 품질 점수 (0-100) */
  baseQuality: number;
  /** 샘플 수 */
  sampleCount: number;
  /** 평균 사용자 만족도 */
  averageUserSatisfaction: number;
  /** 일반적인 문제점들 */
  commonIssues: string[];
  /** 강점 영역 */
  strengths: string[];
  /** 마지막 업데이트 */
  lastUpdated: string;
}

export interface TranslationQualityDatabase {
  /** 언어 쌍별 품질 데이터 */
  languagePairs: Record<string, LanguagePairQuality>;
  /** 제공업체별 성능 데이터 */
  providerPerformance: Record<string, {
    averageQuality: number;
    bestLanguagePairs: string[];
    worstLanguagePairs: string[];
    reliability: number;
  }>;
  /** 사용자 피드백 통계 */
  userFeedbackStats: {
    totalValidations: number;
    averageCorrectionRate: number;
    mostCommonCorrectionReasons: Record<string, number>;
    nativeSpeakerContributions: number;
  };
  /** 학습된 패턴 */
  learnedPatterns: {
    commonErrors: Record<string, string[]>;
    contextualRules: Record<string, string>;
    vocabularyPreferences: Record<string, Record<string, string>>;
  };
}

// 기존 TranslationResult에 품질 정보 추가
export interface EnhancedTranslationResult extends TranslationResult {
  /** 품질 점수 */
  qualityScore?: TranslationQualityScore;
  /** 검증 상태 */
  validationStatus?: 'unvalidated' | 'auto_validated' | 'user_validated' | 'rejected';
  /** 대안 번역들 */
  alternatives?: string[];
  /** 사용자 수정 내역 */
  userCorrections?: UserTranslationValidation[];
  /** 품질 플래그 */
  qualityFlags?: string[];
}

// 유틸리티 타입들
export type SupportedLanguageCode = 
  | 'ko' | 'zh' | 'en' | 'ja' | 'es' 
  | 'fr' | 'de' | 'ar' | 'hi' | 'pt';

export type TranslationProvider = 'google' | 'deepl' | 'azure';

export type ProcessingPhase = 'image' | 'translation' | 'tts' | 'completed';

export type ImageSource = 'pexels' | 'custom' | 'placeholder';

export type TTSQuality = 'high' | 'medium' | 'low' | 'unavailable';

export type QualityGrade = 'excellent' | 'good' | 'fair' | 'poor' | 'needs_review';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type CorrectionReason = 'grammar' | 'vocabulary' | 'context' | 'cultural' | 'other';

export type ValidationStatus = 'unvalidated' | 'auto_validated' | 'user_validated' | 'rejected';

// 이벤트 타입들 (Vue 컴포넌트 간 통신용)
export interface MultiLangEvents {
  'language-changed': { primary: string; secondary: string };
  'translation-completed': { results: Record<string, TranslationResult> };
  'image-generated': { url: string; source: ImageSource };
  'processing-started': { phase: ProcessingPhase };
  'processing-completed': { totalTime: number };
  'error-occurred': { phase: string; error: string };
  'word-saved': { wordId: string; languages: string[] };
}