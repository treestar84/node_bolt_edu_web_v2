// 번역 품질 검증 시스템 - 기존 기능에 영향 없이 추가
import { ref, computed } from 'vue';
import type { SupportedLanguageCode } from '@/constants/languages';

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  warnings: string[];
  suggestions: string[];
  autoFix?: string;
}

export interface TranslationValidation {
  originalText: string;
  translatedText: string;
  fromLang: SupportedLanguageCode;
  toLang: SupportedLanguageCode;
  validation: ValidationResult;
  userVerified?: boolean;
  correctedText?: string;
}

export function useTranslationValidator() {
  const validations = ref<Record<string, TranslationValidation>>({});
  const isValidating = ref(false);

  /**
   * 번역 품질 검증 (기존 번역 결과에 추가 검증만 수행)
   */
  const validateTranslation = async (
    originalText: string,
    translatedText: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<ValidationResult> => {
    isValidating.value = true;
    
    try {
      const validation = performQualityChecks(originalText, translatedText, fromLang, toLang);
      
      // 검증 결과 저장 (기존 번역은 그대로 유지)
      const key = `${fromLang}-${toLang}-${originalText}`;
      validations.value[key] = {
        originalText,
        translatedText,
        fromLang,
        toLang,
        validation,
        userVerified: false
      };
      
      return validation;
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * 품질 검사 로직 (휴리스틱 기반)
   */
  const performQualityChecks = (
    original: string,
    translated: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): ValidationResult => {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let confidence = 0.8; // 기본 신뢰도

    // 1. 기본 검증
    if (!translated || translated.trim() === '') {
      warnings.push('번역 결과가 비어있습니다');
      return { isValid: false, confidence: 0, warnings, suggestions };
    }

    // 2. 길이 검증
    const lengthRatio = translated.length / original.length;
    if (lengthRatio < 0.3) {
      warnings.push('번역 결과가 너무 짧습니다');
      confidence -= 0.2;
    } else if (lengthRatio > 3.0) {
      warnings.push('번역 결과가 너무 깁니다');
      confidence -= 0.1;
    }

    // 3. 문자 종류 검증
    if (fromLang === 'ko' && toLang === 'en') {
      if (!/[a-zA-Z]/.test(translated)) {
        warnings.push('영어 번역에 영문자가 포함되지 않았습니다');
        confidence -= 0.3;
      }
    } else if (fromLang === 'en' && toLang === 'ko') {
      if (!/[가-힣]/.test(translated)) {
        warnings.push('한국어 번역에 한글이 포함되지 않았습니다');
        confidence -= 0.3;
      }
    }

    // 4. 동일 텍스트 검증 (번역이 안된 경우)
    if (original.toLowerCase() === translated.toLowerCase()) {
      warnings.push('원문과 번역문이 동일합니다');
      confidence -= 0.4;
    }

    // 5. 특수 문자나 숫자 유지 검증
    const originalNumbers = original.match(/\d+/g) || [];
    const translatedNumbers = translated.match(/\d+/g) || [];
    if (originalNumbers.length !== translatedNumbers.length) {
      warnings.push('숫자가 제대로 번역되지 않았을 수 있습니다');
      suggestions.push('원문의 숫자가 번역문에도 포함되었는지 확인하세요');
    }

    // 6. 언어별 특수 검증
    performLanguageSpecificChecks(original, translated, fromLang, toLang, warnings, suggestions);

    // 7. 최종 신뢰도 계산
    confidence = Math.max(0, Math.min(1, confidence));
    const isValid = confidence > 0.4 && warnings.length === 0;

    return {
      isValid,
      confidence,
      warnings,
      suggestions
    };
  };

  /**
   * 언어별 특수 검증
   */
  const performLanguageSpecificChecks = (
    original: string,
    translated: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode,
    warnings: string[],
    suggestions: string[]
  ) => {
    // 한국어 관련 검증
    if (toLang === 'ko') {
      // 존댓말/반말 일관성 (단어 학습용이므로 반말 권장)
      if (/습니다|시겠|하십시오/.test(translated)) {
        suggestions.push('아이용 학습 자료이므로 반말 형태를 권장합니다');
      }
    }

    // 영어 관련 검증
    if (toLang === 'en') {
      // 대소문자 검증
      if (translated === translated.toUpperCase() || translated === translated.toLowerCase()) {
        suggestions.push('적절한 대소문자 사용을 확인하세요');
      }
    }

    // 일본어 관련 검증
    if (toLang === 'ja') {
      // 히라가나/가타카나/한자 균형
      const hiragana = (translated.match(/[ひらがな]/g) || []).length;
      const katakana = (translated.match(/[カタカナ]/g) || []).length;
      if (hiragana === 0 && katakana === 0) {
        suggestions.push('일본어 문자(히라가나/가타카나)가 포함되어야 합니다');
      }
    }
  };

  /**
   * 사용자 검증 승인
   */
  const approveTranslation = (
    originalText: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode,
    correctedText?: string
  ) => {
    const key = `${fromLang}-${toLang}-${originalText}`;
    if (validations.value[key]) {
      validations.value[key].userVerified = true;
      if (correctedText) {
        validations.value[key].correctedText = correctedText;
      }
    }
  };

  /**
   * 검증 결과 조회
   */
  const getValidation = (
    originalText: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): TranslationValidation | null => {
    const key = `${fromLang}-${toLang}-${originalText}`;
    return validations.value[key] || null;
  };

  /**
   * 전체 검증 통계
   */
  const validationStats = computed(() => {
    const allValidations = Object.values(validations.value);
    const total = allValidations.length;
    const approved = allValidations.filter(v => v.userVerified).length;
    const withWarnings = allValidations.filter(v => v.validation.warnings.length > 0).length;
    
    return {
      total,
      approved,
      withWarnings,
      approvalRate: total > 0 ? (approved / total * 100).toFixed(1) : '0',
      avgConfidence: total > 0 
        ? (allValidations.reduce((sum, v) => sum + v.validation.confidence, 0) / total * 100).toFixed(1)
        : '0'
    };
  });

  /**
   * 검증이 필요한 번역들 (경고가 있거나 신뢰도가 낮은 것들)
   */
  const needsReview = computed(() => {
    return Object.values(validations.value).filter(v => 
      !v.userVerified && (
        v.validation.warnings.length > 0 || 
        v.validation.confidence < 0.7
      )
    );
  });

  return {
    // 상태
    validations: computed(() => validations.value),
    isValidating: computed(() => isValidating.value),
    validationStats,
    needsReview,

    // 메서드
    validateTranslation,
    approveTranslation,
    getValidation,

    // 유틸리티
    performQualityChecks
  };
}