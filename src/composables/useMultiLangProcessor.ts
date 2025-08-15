// 다국어 단어 처리를 위한 통합 composable
// 이미지 검색 + 번역 + TTS 처리를 모두 관리

import { ref, computed } from 'vue';
import { useTranslation } from './useTranslation';
import { useAutoImageFetch } from './useAutoImageFetch';
import { useMultiLangAudio } from './useMultiLangAudio';
import { useTranslationValidator } from './useTranslationValidator';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import type { 
  MultiLangFormData, 
  AutoProcessingStatus,
  TranslationResult as MultiLangTranslationResult,
  SupportedLanguageCode
} from '@/types/multilingual';

export interface ProcessingResult {
  imageUrl: string;
  translations: Record<SupportedLanguageCode, MultiLangTranslationResult>;
  audioSupport: Record<SupportedLanguageCode, boolean>;
  metadata: {
    processingTime: number;
    successRate: number;
    failedLanguages: string[];
  };
}

export function useMultiLangProcessor() {
  // Composables
  const translation = useTranslation();
  const imageService = useAutoImageFetch();
  const audioService = useMultiLangAudio();
  const validator = useTranslationValidator();

  // 상태 관리
  const processingStatus = ref<AutoProcessingStatus>({
    currentPhase: 'idle',
    overallProgress: 0,
    phaseProgress: {
      image: { status: 'pending', progress: 0 },
      translation: { status: 'pending', progress: 0, completedLanguages: [], failedLanguages: [], currentLanguage: '' },
      tts: { status: 'pending', progress: 0, supportedLanguages: [], testedLanguages: [] }
    },
    results: {
      imageUrl: '',
      translations: {},
      audioSupport: {}
    },
    errors: []
  });

  const isProcessing = ref(false);
  const startTime = ref(0);

  /**
   * 전체 다국어 처리 프로세스 실행
   */
  const processMultiLangWord = async (
    formData: MultiLangFormData & { languages: { primary: string; secondary: string } }
  ): Promise<ProcessingResult> => {
    console.log('🚀 다국어 단어 처리 시작:', formData);
    
    isProcessing.value = true;
    startTime.value = Date.now();
    resetStatus();

    try {
      // Phase 1: 이미지 검색
      const imageUrl = await processImageSearch(formData);
      
      // Phase 2: 번역 처리  
      const translations = await processTranslations(formData);
      
      // Phase 3: TTS 테스트
      const audioSupport = await processTTSTests(translations);
      
      // 완료 처리
      processingStatus.value.currentPhase = 'completed';
      processingStatus.value.overallProgress = 100;
      
      const processingTime = Date.now() - startTime.value;
      const successRate = (Object.keys(translations).length / getTargetLanguagesCount(formData)) * 100;
      
      const result: ProcessingResult = {
        imageUrl,
        translations,
        audioSupport,
        metadata: {
          processingTime,
          successRate,
          failedLanguages: getFailedLanguages(formData, translations)
        }
      };
      
      console.log('✅ 다국어 처리 완료:', result);
      return result;
      
    } catch (error) {
      console.error('❌ 다국어 처리 실패:', error);
      processingStatus.value.currentPhase = 'error';
      processingStatus.value.errors.push(error instanceof Error ? error.message : '알 수 없는 오류');
      throw error;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Phase 1: 이미지 검색 처리
   */
  const processImageSearch = async (
    formData: MultiLangFormData & { languages: { primary: string; secondary: string } }
  ): Promise<string> => {
    console.log('📸 1단계: 이미지 검색 시작');
    
    processingStatus.value.currentPhase = 'image';
    processingStatus.value.phaseProgress.image.status = 'in-progress';
    updateOverallProgress();

    try {
      // 기존 Pexels 서비스 활용 (100% 재활용)
      const imageUrl = await imageService.fetchAndUploadImage(
        formData.primaryText,
        formData.secondaryText
      );

      if (imageUrl) {
        processingStatus.value.phaseProgress.image = {
          status: 'completed',
          progress: 100,
          generatedImageUrl: imageUrl
        };

        processingStatus.value.results.imageUrl = imageUrl;
        updateOverallProgress();

        console.log('✅ 이미지 검색 완료:', imageUrl);
        return imageUrl;
      } else {
        // 이미지 검색 실패해도 계속 진행 (이미지 없이 단어 등록 허용)
        console.warn('⚠️ 이미지 검색 실패, 이미지 없이 진행');
        
        processingStatus.value.phaseProgress.image = {
          status: 'completed',
          progress: 100,
          generatedImageUrl: ''
        };

        processingStatus.value.results.imageUrl = '';
        updateOverallProgress();

        return ''; // 빈 이미지로 진행
      }

    } catch (error) {
      // 이미지 검색 오류도 치명적이지 않으므로 계속 진행
      console.warn('⚠️ 이미지 검색 오류, 이미지 없이 진행:', error);
      
      processingStatus.value.phaseProgress.image = {
        status: 'completed',
        progress: 100,
        generatedImageUrl: ''
      };

      processingStatus.value.results.imageUrl = '';
      updateOverallProgress();

      return ''; // 빈 이미지로 진행
    }
  }

  /**
   * Phase 2: 번역 처리 (브라우저 번역 우선)
   */
  const processTranslations = async (
    formData: MultiLangFormData & { languages: { primary: string; secondary: string } }
  ): Promise<Record<SupportedLanguageCode, MultiLangTranslationResult>> => {
    console.log('🌍 2단계: 번역 처리 시작');
    
    processingStatus.value.currentPhase = 'translation';
    processingStatus.value.phaseProgress.translation.status = 'in-progress';

    // 번역 대상 언어 결정
    const targetLanguages = getTargetLanguages(formData.languages);
    const translations: Record<SupportedLanguageCode, MultiLangTranslationResult> = {} as any;
    
    // 원본 언어들 추가 (번역하지 않음)
    translations[formData.languages.primary as SupportedLanguageCode] = {
      name: formData.primaryText,
      confidence: 1.0,
      source: 'manual',
      audioUrl: '',
      isCustomAudio: false,
      translatedBy: 'user',
      verified: true
    };

    translations[formData.languages.secondary as SupportedLanguageCode] = {
      name: formData.secondaryText,
      confidence: 1.0,
      source: 'manual',
      audioUrl: '',
      isCustomAudio: false,
      translatedBy: 'user',
      verified: true
    };

    let completedCount = 2; // 이미 원본 2개 언어 완료
    const totalCount = targetLanguages.length + 2;

    try {
      // 각 대상 언어별로 번역 수행
      console.log(`📋 번역 대상 언어들: ${targetLanguages.join(', ')}`);
      
      for (const targetLang of targetLanguages) {
        processingStatus.value.phaseProgress.translation.currentLanguage = targetLang;
        
        try {
          console.log(`🔄 ${targetLang} 번역 시작: "${formData.secondaryText}" (en → ${targetLang})`);
          
          // 영어를 기준으로 대상 언어로 번역 (영어가 번역 품질이 더 좋음)
          const translationResult = await translation.translateSingle(
            formData.secondaryText,
            'en' as SupportedLanguageCode,
            targetLang as SupportedLanguageCode
          );

          if (translationResult) {
            // 번역 품질 검증 (기존 기능에 영향 없이 추가)
            let validation = null;
            try {
              validation = await validator.validateTranslation(
                formData.secondaryText,
                translationResult.translatedText,
                'en' as SupportedLanguageCode,
                targetLang as SupportedLanguageCode
              );
            } catch (validationError) {
              console.warn(`⚠️ ${targetLang} 번역 검증 실패:`, validationError);
              // 검증 실패해도 번역은 그대로 진행
            }

            translations[targetLang as SupportedLanguageCode] = {
              name: translationResult.translatedText,
              confidence: validation ? Math.min(translationResult.confidence, validation.confidence) : translationResult.confidence,
              source: 'auto',
              audioUrl: '',
              isCustomAudio: false,
              translatedBy: translationResult.translatedBy === 'manual' ? 'user' : 'auto',
              verified: validation ? validation.isValid : false,
              validation: validation as any // 검증 결과 추가 (선택사항)
            };
            
            completedCount++;
            processingStatus.value.phaseProgress.translation.completedLanguages.push(targetLang);
            
            const qualityIndicator = validation ? 
              (validation.isValid ? '✅' : validation.warnings.length > 0 ? '⚠️' : '❌') : '✅';
            console.log(`${qualityIndicator} ${targetLang} 번역 완료: "${translationResult.translatedText}"`);
          } else {
            console.warn(`⚠️ ${targetLang} 번역 실패: 결과가 null`);
          }
          
        } catch (error) {
          console.error(`❌ ${targetLang} 번역 오류:`, error);
          // 개별 언어 실패는 전체를 중단하지 않음
        }

        // 진행률 업데이트
        const progress = (completedCount / totalCount) * 100;
        processingStatus.value.phaseProgress.translation.progress = progress;
        updateOverallProgress();

        // API 한도 보호를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      processingStatus.value.phaseProgress.translation.status = 'completed';
      processingStatus.value.results.translations = translations;
      updateOverallProgress();

      console.log(`✅ 번역 처리 완료: ${Object.keys(translations).length}개 언어`);
      return translations;

    } catch (error) {
      processingStatus.value.phaseProgress.translation.status = 'failed';
      console.error('❌ 번역 처리 실패:', error);
      throw new Error(`번역 처리 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * Phase 3: TTS 지원 여부 테스트
   */
  const processTTSTests = async (
    translations: Record<SupportedLanguageCode, MultiLangTranslationResult>
  ): Promise<Record<SupportedLanguageCode, boolean>> => {
    console.log('🎤 3단계: TTS 테스트 시작');
    
    processingStatus.value.currentPhase = 'tts';
    processingStatus.value.phaseProgress.tts.status = 'in-progress';

    const audioSupport: Record<SupportedLanguageCode, boolean> = {} as any;
    const languages = Object.keys(translations) as SupportedLanguageCode[];
    let testedCount = 0;

    try {
      for (const langCode of languages) {
        // const _translation = translations[langCode];
        
        try {
          // TTS 지원 여부 확인 (실제 음성 재생하지 않고 지원만 확인)
          const isSupported = audioService.checkTTSSupport(langCode);
          audioSupport[langCode] = isSupported;
          
          if (isSupported) {
            processingStatus.value.phaseProgress.tts.supportedLanguages.push(langCode);
          }
          
          processingStatus.value.phaseProgress.tts.testedLanguages.push(langCode);
          testedCount++;
          
          console.log(`${isSupported ? '✅' : '❌'} ${langCode} TTS 지원: ${isSupported}`);
          
        } catch (error) {
          console.warn(`⚠️ ${langCode} TTS 테스트 실패:`, error);
          audioSupport[langCode] = false;
          testedCount++;
        }

        // 진행률 업데이트
        const progress = (testedCount / languages.length) * 100;
        processingStatus.value.phaseProgress.tts.progress = progress;
        updateOverallProgress();
      }

      processingStatus.value.phaseProgress.tts.status = 'completed';
      processingStatus.value.results.audioSupport = audioSupport;
      updateOverallProgress();

      console.log(`✅ TTS 테스트 완료: ${processingStatus.value.phaseProgress.tts.supportedLanguages.length}개 언어 지원`);
      return audioSupport;

    } catch (error) {
      processingStatus.value.phaseProgress.tts.status = 'failed';
      console.error('❌ TTS 테스트 실패:', error);
      throw new Error(`TTS 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * 번역 대상 언어 목록 반환 (원본 언어 제외)
   */
  const getTargetLanguages = (languages: { primary: string; secondary: string }): string[] => {
    const allLanguages = Object.keys(SUPPORTED_LANGUAGES);
    return allLanguages.filter(lang => 
      lang !== languages.primary && lang !== languages.secondary
    );
  }

  /**
   * 번역 대상 언어 개수 반환
   */
  const getTargetLanguagesCount = (formData: { languages: { primary: string; secondary: string } }): number => {
    return getTargetLanguages(formData.languages).length;
  }

  /**
   * 실패한 언어 목록 반환
   */
  const getFailedLanguages = (
    formData: { languages: { primary: string; secondary: string } },
    translations: Record<string, any>
  ): string[] => {
    const targetLanguages = getTargetLanguages(formData.languages);
    return targetLanguages.filter(lang => !translations[lang]);
  }

  /**
   * 전체 진행률 업데이트
   */
  const updateOverallProgress = (): void => {
    const phases = processingStatus.value.phaseProgress;
    const imageWeight = 20; // 이미지 검색 20%
    const translationWeight = 60; // 번역 60%
    const ttsWeight = 20; // TTS 20%

    const imageProgress = (phases.image.progress || 0) * (imageWeight / 100);
    const translationProgress = (phases.translation.progress || 0) * (translationWeight / 100);
    const ttsProgress = (phases.tts.progress || 0) * (ttsWeight / 100);

    processingStatus.value.overallProgress = Math.min(100, imageProgress + translationProgress + ttsProgress);
  }

  /**
   * 상태 초기화
   */
  const resetStatus = (): void => {
    processingStatus.value = {
      currentPhase: 'idle',
      overallProgress: 0,
      phaseProgress: {
        image: { status: 'pending', progress: 0 },
        translation: { status: 'pending', progress: 0, completedLanguages: [], failedLanguages: [], currentLanguage: '' },
        tts: { status: 'pending', progress: 0, supportedLanguages: [], testedLanguages: [] }
      },
      results: {
        imageUrl: '',
        translations: {},
        audioSupport: {}
      },
      errors: []
    };
  }

  /**
   * 처리 중단
   */
  const cancelProcessing = (): void => {
    if (isProcessing.value) {
      console.log('⏹️ 다국어 처리 중단 요청');
      isProcessing.value = false;
      processingStatus.value.currentPhase = 'idle';
    }
  };

  /**
   * 특정 언어 재번역
   */
  const retranslateLanguage = async (
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<MultiLangTranslationResult | null> => {
    console.log(`🔄 ${toLang} 재번역 시도...`);
    
    try {
      const result = await translation.translateSingle(text, fromLang, toLang);
      
      if (result) {
        const translationResult: MultiLangTranslationResult = {
          name: result.translatedText,
          confidence: result.confidence,
          source: 'auto',
          audioUrl: '',
          isCustomAudio: false,
          translatedBy: result.translatedBy === 'manual' ? 'user' : 'auto',
          verified: false
        };
        
        // 상태 업데이트
        if (processingStatus.value.results.translations) {
          processingStatus.value.results.translations[toLang] = translationResult;
        }
        
        console.log(`✅ ${toLang} 재번역 성공: "${result.translatedText}"`);
        return translationResult;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ ${toLang} 재번역 실패:`, error);
      return null;
    }
  };

  return {
    // 상태
    processingStatus: computed(() => processingStatus.value),
    isProcessing: computed(() => isProcessing.value),
    
    // 번역 상태 정보
    quotaStatus: translation.quotaStatus,
    availableServices: computed(() => translation.getAvailableServices()),
    
    // 메서드  
    processMultiLangWord,
    cancelProcessing,
    retranslateLanguage,
    
    // 유틸리티
    resetStatus,
    updateOverallProgress,
    
    // 통계
    getTranslationStats: translation.getTranslationStats,
    
    // 검증 (기존 기능에 영향 없이 추가)
    validationStats: validator.validationStats,
    needsReview: validator.needsReview,
    approveTranslation: validator.approveTranslation
  };
}