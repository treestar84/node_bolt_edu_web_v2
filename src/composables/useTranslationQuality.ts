// 번역 품질 검증 시스템을 위한 Composable
// Vue 3 Composition API를 활용한 번역 품질 관리

import { ref, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { getTranslationQualityService } from '@/services/translationQualityService';
import type {
  TranslationQualityScore,
  TranslationQualityFeedback,
  UserTranslationValidation,
  QualityValidationSettings,
  EnhancedTranslationResult,
  TranslationResult,
  SupportedLanguageCode
} from '@/types/multilingual';

export function useTranslationQuality() {
  // Services
  const qualityService = getTranslationQualityService();
  const { t } = useI18n();

  // State
  const isValidating = ref(false);
  const isLoadingAlternatives = ref(false);
  const validationError = ref<string | null>(null);
  
  const currentValidation = ref<{
    sourceText: string;
    translation: string;
    sourceLang: SupportedLanguageCode;
    targetLang: SupportedLanguageCode;
    qualityScore?: TranslationQualityScore;
    alternatives: string[];
  } | null>(null);

  const settings = reactive<QualityValidationSettings>(qualityService.getSettings());

  // Computed
  const statistics = computed(() => qualityService.getQualityStatistics());

  /**
   * 번역 품질 점수 계산
   */
  const calculateQuality = (
    translation: TranslationResult,
    sourceText: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode
  ): TranslationQualityScore => {
    try {
      return qualityService.calculateQualityScore(translation, sourceText, sourceLang, targetLang);
    } catch (error) {
      console.error('품질 점수 계산 실패:', error);
      // 기본 품질 점수 반환
      return {
        overall: 50,
        breakdown: {
          providerReliability: 50,
          languagePairQuality: 50,
          contextComplexity: 50,
          lengthAppropriateness: 50
        },
        grade: 'fair',
        confidence: 'medium',
        recommendations: [t('quality.error.calculationFailed')],
        needsValidation: true
      };
    }
  };

  /**
   * 번역 결과를 개선된 형태로 변환
   */
  const enhanceTranslation = (
    translation: TranslationResult,
    sourceText: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode
  ): EnhancedTranslationResult => {
    try {
      return qualityService.enhanceTranslationResult(translation, sourceText, sourceLang, targetLang);
    } catch (error) {
      console.error('번역 개선 실패:', error);
      return {
        ...translation,
        qualityScore: calculateQuality(translation, sourceText, sourceLang, targetLang),
        validationStatus: 'unvalidated',
        alternatives: [],
        userCorrections: [],
        qualityFlags: ['error']
      };
    }
  };

  /**
   * 대안 번역 제안 가져오기
   */
  const getSuggestedAlternatives = async (
    sourceText: string,
    currentTranslation: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode
  ): Promise<string[]> => {
    if (!settings.showAlternatives) {
      return [];
    }

    isLoadingAlternatives.value = true;
    validationError.value = null;

    try {
      const alternatives = await qualityService.suggestAlternatives(
        sourceText,
        currentTranslation,
        sourceLang,
        targetLang
      );

      console.log(`🔄 대안 번역 ${alternatives.length}개 제안됨`);
      return alternatives;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '대안 번역 로드 실패';
      validationError.value = errorMessage;
      console.error('대안 번역 로드 실패:', error);
      return [];
    } finally {
      isLoadingAlternatives.value = false;
    }
  };

  /**
   * 번역 검증 프로세스 시작
   */
  const startValidation = async (
    sourceText: string,
    translation: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    qualityScore?: TranslationQualityScore
  ) => {
    if (!settings.enableUserValidation) {
      console.warn('사용자 검증이 비활성화되어 있습니다.');
      return;
    }

    isValidating.value = true;
    validationError.value = null;

    try {
      // 대안 번역 로드
      const alternatives = await getSuggestedAlternatives(
        sourceText,
        translation,
        sourceLang,
        targetLang
      );

      currentValidation.value = {
        sourceText,
        translation,
        sourceLang,
        targetLang,
        qualityScore,
        alternatives
      };

      console.log('🔍 번역 검증 프로세스 시작됨');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '검증 시작 실패';
      validationError.value = errorMessage;
      console.error('검증 시작 실패:', error);
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * 사용자 검증 결과 제출
   */
  const submitValidation = async (validation: UserTranslationValidation): Promise<boolean> => {
    if (!currentValidation.value) {
      console.error('현재 진행중인 검증이 없습니다.');
      return false;
    }

    isValidating.value = true;
    validationError.value = null;

    try {
      // 번역 ID 생성
      const { sourceText, translation, sourceLang, targetLang } = currentValidation.value;
      const translationId = generateTranslationId(sourceText, sourceLang, targetLang);

      // 검증 데이터 저장
      qualityService.addUserValidation(translationId, validation);

      // 학습 데이터 수집 동의 여부에 따라 처리
      if (settings.allowLearningDataCollection && validation.correctedTranslation !== validation.originalTranslation) {
        console.log('📊 학습 데이터로 활용됩니다.');
      }

      console.log('✅ 번역 검증 완료:', validation);
      
      // 검증 완료 후 상태 초기화
      currentValidation.value = null;
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '검증 제출 실패';
      validationError.value = errorMessage;
      console.error('검증 제출 실패:', error);
      return false;
    } finally {
      isValidating.value = false;
    }
  };

  /**
   * 번역이 정확하다고 확인
   */
  const confirmTranslationCorrect = async (validation: UserTranslationValidation): Promise<boolean> => {
    return await submitValidation({
      ...validation,
      correctedTranslation: validation.originalTranslation // 수정 없음을 의미
    });
  };

  /**
   * 번역 문제 신고
   */
  const reportTranslationIssue = async (
    sourceText: string,
    translation: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode,
    issueDescription: string
  ): Promise<boolean> => {
    try {
      const validation: UserTranslationValidation = {
        originalTranslation: translation,
        correctedTranslation: translation, // 수정 제안 없이 문제만 신고
        correctionReason: 'other',
        correctionNote: `신고된 문제: ${issueDescription}`,
        validatedAt: new Date().toISOString()
      };

      const translationId = generateTranslationId(sourceText, sourceLang, targetLang);
      qualityService.addUserValidation(translationId, validation);

      console.log('🚩 번역 문제 신고 완료');
      return true;
    } catch (error) {
      console.error('문제 신고 실패:', error);
      return false;
    }
  };

  /**
   * 품질 설정 업데이트
   */
  const updateSettings = (newSettings: Partial<QualityValidationSettings>) => {
    Object.assign(settings, newSettings);
    qualityService.saveSettings(settings);
    console.log('⚙️ 품질 설정 업데이트됨:', newSettings);
  };

  /**
   * 번역 품질에 따른 UI 스타일 클래스 생성
   */
  const getQualityStyleClass = (qualityScore: TranslationQualityScore): string => {
    const baseClass = 'translation-quality';
    const gradeClass = `${baseClass}--${qualityScore.grade}`;
    const confidenceClass = `${baseClass}--${qualityScore.confidence}-confidence`;
    
    return `${baseClass} ${gradeClass} ${confidenceClass}`;
  };

  /**
   * 품질 점수에 따른 색상 코드 반환
   */
  const getQualityColor = (score: number): string => {
    if (score >= 90) return '#22c55e'; // green
    if (score >= 80) return '#3b82f6'; // blue
    if (score >= 70) return '#f59e0b'; // amber
    if (score >= 50) return '#ef4444'; // red
    return '#991b1b'; // dark red
  };

  /**
   * 품질 등급에 따른 아이콘 반환
   */
  const getQualityIcon = (grade: string): string => {
    const icons: Record<string, string> = {
      excellent: '🌟',
      good: '✅',
      fair: '⚠️',
      poor: '❌',
      needs_review: '🚨'
    };
    return icons[grade] || '❓';
  };

  /**
   * 사용자 친화적인 품질 설명 생성
   */
  const getQualityDescription = (qualityScore: TranslationQualityScore): string => {
    const { grade, confidence, overall } = qualityScore;
    
    const descriptions: Record<string, Record<string, string>> = {
      excellent: {
        high: t('quality.description.excellentHigh'),
        medium: t('quality.description.excellentMedium'),
        low: t('quality.description.excellentLow')
      },
      good: {
        high: t('quality.description.goodHigh'),
        medium: t('quality.description.goodMedium'),
        low: t('quality.description.goodLow')
      },
      fair: {
        high: t('quality.description.fairHigh'),
        medium: t('quality.description.fairMedium'),
        low: t('quality.description.fairLow')
      },
      poor: {
        high: t('quality.description.poorHigh'),
        medium: t('quality.description.poorMedium'),
        low: t('quality.description.poorLow')
      },
      needs_review: {
        high: t('quality.description.needsReviewHigh'),
        medium: t('quality.description.needsReviewMedium'),
        low: t('quality.description.needsReviewLow')
      }
    };

    return descriptions[grade]?.[confidence] || t('quality.description.unknown');
  };

  /**
   * 검증 상태 초기화
   */
  const resetValidation = () => {
    currentValidation.value = null;
    validationError.value = null;
    isValidating.value = false;
    isLoadingAlternatives.value = false;
  };

  /**
   * 번역 ID 생성 (서비스와 동일한 로직)
   */
  const generateTranslationId = (sourceText: string, sourceLang: string, targetLang: string): string => {
    const data = `${sourceLang}-${targetLang}-${sourceText}`;
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  };

  /**
   * 번역 품질이 유아 학습에 적합한지 확인
   */
  const isQualitySuitableForChildren = (qualityScore: TranslationQualityScore): boolean => {
    // 유아 학습용으로는 더 높은 품질 기준 적용
    return qualityScore.overall >= 80 && 
           qualityScore.confidence !== 'low' &&
           qualityScore.grade !== 'poor' &&
           qualityScore.grade !== 'needs_review';
  };

  /**
   * 부모/교육자를 위한 품질 경고 메시지 생성
   */
  const getParentalGuidanceMessage = (qualityScore: TranslationQualityScore): string | null => {
    if (!isQualitySuitableForChildren(qualityScore)) {
      return t('quality.parentalGuidance.lowQualityWarning');
    }
    
    if (qualityScore.needsValidation) {
      return t('quality.parentalGuidance.needsValidation');
    }
    
    return null;
  };

  return {
    // State
    isValidating: computed(() => isValidating.value),
    isLoadingAlternatives: computed(() => isLoadingAlternatives.value),
    validationError: computed(() => validationError.value),
    currentValidation: computed(() => currentValidation.value),
    settings: computed(() => settings),
    statistics,

    // Methods
    calculateQuality,
    enhanceTranslation,
    getSuggestedAlternatives,
    startValidation,
    submitValidation,
    confirmTranslationCorrect,
    reportTranslationIssue,
    updateSettings,
    resetValidation,

    // Utility methods
    getQualityStyleClass,
    getQualityColor,
    getQualityIcon,
    getQualityDescription,
    isQualitySuitableForChildren,
    getParentalGuidanceMessage
  };
}

// 유틸리티 함수들 (컴포넌트에서 직접 사용 가능)
export const useTranslationQualityUtils = () => {
  const { t } = useI18n();

  return {
    formatQualityScore: (score: number): string => `${score}%`,
    
    getGradeColor: (grade: string): string => {
      const colors: Record<string, string> = {
        excellent: '#22c55e',
        good: '#3b82f6',
        fair: '#f59e0b',
        poor: '#ef4444',
        needs_review: '#991b1b'
      };
      return colors[grade] || '#6b7280';
    },

    formatConfidenceLevel: (confidence: string): string => {
      const labels: Record<string, string> = {
        high: t('quality.confidence.high'),
        medium: t('quality.confidence.medium'),
        low: t('quality.confidence.low')
      };
      return labels[confidence] || confidence;
    },

    shouldShowQualityIndicator: (qualityScore: TranslationQualityScore): boolean => {
      return qualityScore.overall < 85 || qualityScore.needsValidation;
    }
  };
};