// 번역 기능을 위한 composable - 무료 API 우선 사용으로 비용 최소화
import { ref, computed } from 'vue';
import { getTranslationService } from '@/services/translationService';
import type { SupportedLanguageCode } from '@/constants/languages';
import type { TranslationResult } from '@/services/translationService';

export function useTranslation() {
  const translationService = getTranslationService();
  
  // 상태 관리
  const isTranslating = ref(false);
  const translationProgress = ref(0);
  const currentlyTranslating = ref<string>('');
  const translationError = ref<string | null>(null);
  const translationResults = ref<Record<string, TranslationResult>>({});

  // 할당량 정보
  const quotaStatus = computed(() => translationService.getQuotaStatus());
  const quotaStatusText = computed(() => translationService.getQuotaStatusFormatted());

  /**
   * 단일 텍스트 번역
   */
  const translateSingle = async (
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<TranslationResult | null> => {
    if (!text.trim()) {
      console.warn('번역할 텍스트가 비어있습니다.');
      return null;
    }

    isTranslating.value = true;
    translationError.value = null;
    currentlyTranslating.value = `${fromLang} → ${toLang}`;

    try {
      console.log(`🌍 번역 요청: "${text}" (${fromLang} → ${toLang})`);
      
      const result = await translationService.translateText({
        text,
        fromLang,
        toLang
      });

      const resultKey = `${fromLang}-${toLang}-${text}`;
      translationResults.value[resultKey] = result;

      console.log(`✅ 번역 완료: "${result.translatedText}" (신뢰도: ${Math.round(result.confidence * 100)}%)`);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '번역 중 알 수 없는 오류가 발생했습니다.';
      translationError.value = errorMessage;
      console.error('❌ 번역 실패:', errorMessage);
      return null;
    } finally {
      isTranslating.value = false;
      currentlyTranslating.value = '';
      translationProgress.value = 0;
    }
  };

  /**
   * 배치 번역 (한 텍스트를 여러 언어로)
   */
  const translateToMultiple = async (
    text: string,
    fromLang: SupportedLanguageCode,
    toLangs: SupportedLanguageCode[],
    onProgress?: (completed: number, total: number, currentLang: string) => void
  ): Promise<Record<SupportedLanguageCode, TranslationResult>> => {
    if (!text.trim()) {
      console.warn('번역할 텍스트가 비어있습니다.');
      return {} as Record<SupportedLanguageCode, TranslationResult>;
    }

    isTranslating.value = true;
    translationError.value = null;
    translationProgress.value = 0;

    const results: Record<SupportedLanguageCode, TranslationResult> = {} as any;
    const errors: string[] = [];

    try {
      console.log(`🔄 배치 번역 시작: "${text}" → ${toLangs.length}개 언어`);

      for (let i = 0; i < toLangs.length; i++) {
        const toLang = toLangs[i];
        currentlyTranslating.value = `${fromLang} → ${toLang}`;
        
        // 진행률 업데이트
        translationProgress.value = (i / toLangs.length) * 100;
        onProgress?.(i, toLangs.length, toLang);

        try {
          const result = await translateSingle(text, fromLang, toLang);
          if (result) {
            results[toLang] = result;
            console.log(`✅ ${toLang} 번역 완료: "${result.translatedText}"`);
          } else {
            throw new Error('번역 결과가 null입니다.');
          }
        } catch (error) {
          const errorMsg = `${toLang} 번역 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }

        // 다음 번역 전 잠시 대기 (API 한도 보호)
        if (i < toLangs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      translationProgress.value = 100;
      onProgress?.(toLangs.length, toLangs.length, '완료');

      if (Object.keys(results).length === 0) {
        throw new Error(`모든 번역 실패: ${errors.join(', ')}`);
      }

      console.log(`✅ 배치 번역 완료: ${Object.keys(results).length}/${toLangs.length} 성공`);
      
      if (errors.length > 0) {
        console.warn(`⚠️ 일부 번역 실패: ${errors.join(', ')}`);
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '배치 번역 중 알 수 없는 오류가 발생했습니다.';
      translationError.value = errorMessage;
      console.error('❌ 배치 번역 실패:', errorMessage);
      return results; // 부분 성공된 결과라도 반환
    } finally {
      isTranslating.value = false;
      currentlyTranslating.value = '';
      translationProgress.value = 0;
    }
  };

  /**
   * 번역 품질 평가
   */
  const evaluateTranslationQuality = (result: TranslationResult): {
    quality: 'excellent' | 'good' | 'fair' | 'poor';
    score: number;
    recommendations: string[];
  } => {
    const confidence = result.confidence;
    const recommendations: string[] = [];

    let quality: 'excellent' | 'good' | 'fair' | 'poor';
    let score: number;

    if (confidence >= 0.9) {
      quality = 'excellent';
      score = 95 + (confidence - 0.9) * 50; // 95-100점
    } else if (confidence >= 0.8) {
      quality = 'good'; 
      score = 80 + (confidence - 0.8) * 150; // 80-95점
    } else if (confidence >= 0.7) {
      quality = 'fair';
      score = 65 + (confidence - 0.7) * 150; // 65-80점
    } else {
      quality = 'poor';
      score = confidence * 65; // 0-65점
    }

    // 제공업체별 신뢰도 조정
    switch (result.translatedBy) {
      case 'google':
        score = Math.min(100, score + 5); // Google은 일반적으로 품질이 좋음
        break;
      case 'microsoft':
        score = Math.min(100, score + 3); // Microsoft도 품질이 좋음
        break;
      case 'papago':
        if (['ko', 'en', 'ja', 'zh'].includes(result.targetLanguage) && 
            ['ko', 'en', 'ja', 'zh'].includes(result.sourceLanguage)) {
          score = Math.min(100, score + 7); // 동아시아 언어에서 Papago가 우수
        }
        break;
      case 'libre':
        score = Math.max(0, score - 10); // LibreTranslate는 품질이 낮을 수 있음
        recommendations.push('무료 서비스로 정확도가 낮을 수 있습니다. 수동 검토를 권장합니다.');
        break;
    }

    // 권장사항 추가
    if (score < 70) {
      recommendations.push('번역 품질이 낮습니다. 수동으로 수정하는 것을 권장합니다.');
    }
    if (result.originalText.length > 100) {
      recommendations.push('긴 텍스트는 문맥상 오류가 있을 수 있습니다.');
    }

    return {
      quality,
      score: Math.round(score),
      recommendations
    };
  };

  /**
   * 번역 캐시 조회
   */
  const getCachedTranslation = (
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): TranslationResult | null => {
    const key = `${fromLang}-${toLang}-${text}`;
    return translationResults.value[key] || null;
  };

  /**
   * 사용 가능한 번역 서비스 확인
   */
  const getAvailableServices = (): string[] => {
    const services: string[] = [];
    const quotas = quotaStatus.value;

    Object.entries(quotas).forEach(([service, quota]) => {
      if (quota.remaining > 0) {
        services.push(service);
      }
    });

    return services;
  };

  /**
   * 오류 초기화
   */
  const clearError = () => {
    translationError.value = null;
  };

  /**
   * 번역 결과 초기화
   */
  const clearResults = () => {
    translationResults.value = {};
  };

  /**
   * 번역 통계 정보
   */
  const getTranslationStats = () => {
    const totalTranslations = Object.keys(translationResults.value).length;
    const byProvider: Record<string, number> = {};
    const qualityDistribution = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };

    Object.values(translationResults.value).forEach(result => {
      // 제공업체별 통계
      byProvider[result.translatedBy] = (byProvider[result.translatedBy] || 0) + 1;
      
      // 품질별 통계
      const evaluation = evaluateTranslationQuality(result);
      qualityDistribution[evaluation.quality]++;
    });

    return {
      totalTranslations,
      byProvider,
      qualityDistribution,
      averageQuality: totalTranslations > 0 
        ? Object.values(translationResults.value)
            .reduce((sum, result) => sum + result.confidence, 0) / totalTranslations 
        : 0
    };
  };

  return {
    // 상태
    isTranslating: computed(() => isTranslating.value),
    translationProgress: computed(() => translationProgress.value),
    currentlyTranslating: computed(() => currentlyTranslating.value),
    translationError: computed(() => translationError.value),
    quotaStatus,
    quotaStatusText,

    // 메서드
    translateSingle,
    translateToMultiple,
    evaluateTranslationQuality,
    getCachedTranslation,
    getAvailableServices,
    clearError,
    clearResults,
    getTranslationStats
  };
}