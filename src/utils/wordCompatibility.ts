// 기존 시스템과 새로운 다국어 시스템 간의 완벽한 호환성을 보장하는 헬퍼 함수들
// 기존 코드 수정 없이 새로운 기능을 점진적으로 적용 가능

import type { WordItem } from '@/types';
import type { 
  MultiLangWordItem, 
  TranslationResult,
  SupportedLanguageCode 
} from '@/types/multilingual';
import { SUPPORTED_LANGUAGES, DEFAULT_PRIMARY_LANGUAGE, DEFAULT_SECONDARY_LANGUAGE } from '@/constants/languages';

/**
 * 기존 시스템과 새 시스템 간의 호환성을 관리하는 중앙 클래스
 */
export class WordCompatibilityHelper {
  /**
   * 기존 WordItem을 새로운 MultiLangWordItem 구조로 마이그레이션
   */
  static migrateToMultiLangStructure(oldWord: WordItem): MultiLangWordItem {
    console.log(`🔄 Migrating word to multilingual structure: ${oldWord.name}`);
    
    const newWord: MultiLangWordItem = {
      // 기존 필드 그대로 복사
      ...oldWord,
      
      // 새로운 다국어 시스템 초기화
      translations: {
        ko: {
          name: oldWord.name,
          audioUrl: oldWord.audioKo || '',
          isCustomAudio: !!oldWord.audioKo,
          translatedBy: 'user',
          confidence: 1.0,
          verified: true
        },
        en: {
          name: oldWord.nameEn,
          audioUrl: oldWord.audioEn || '',
          isCustomAudio: !!oldWord.audioEn,
          translatedBy: 'user',
          confidence: 1.0,
          verified: true
        }
      },
      
      // 메타데이터 설정
      primaryLanguage: DEFAULT_PRIMARY_LANGUAGE,
      secondaryLanguage: DEFAULT_SECONDARY_LANGUAGE,
      autoTranslatedLanguages: [],
      imageSource: oldWord.imageUrl ? 'pexels' : undefined,
      isFullyProcessed: false,
      
      customizations: {
        hasCustomImage: false,
        hasCustomAudios: [
          ...(oldWord.audioKo ? ['ko'] : []),
          ...(oldWord.audioEn ? ['en'] : [])
        ],
        modifiedTranslations: []
      }
    };
    
    console.log(`✅ Migration completed for word: ${oldWord.name}`);
    return newWord;
  }

  /**
   * 새로운 구조를 기존 구조로 변환 (저장 시 하위 호환성 유지)
   */
  static convertToLegacyFormat(multiLangWord: MultiLangWordItem): WordItem {
    const legacyWord: WordItem = {
      id: multiLangWord.id,
      name: this.getName(multiLangWord, 'ko'),
      nameEn: this.getName(multiLangWord, 'en'),
      imageUrl: multiLangWord.imageUrl,
      audioKo: this.getAudioUrl(multiLangWord, 'ko'),
      audioEn: this.getAudioUrl(multiLangWord, 'en'),
      category: multiLangWord.category,
      minAge: multiLangWord.minAge,
      maxAge: multiLangWord.maxAge,
      ownerType: multiLangWord.ownerType,
      ownerId: multiLangWord.ownerId,
      imageWidth: multiLangWord.imageWidth,
      imageHeight: multiLangWord.imageHeight,
      imageAspectRatio: multiLangWord.imageAspectRatio,
      createdAt: multiLangWord.createdAt,
      updatedAt: multiLangWord.updatedAt
    };
    
    return legacyWord;
  }

  /**
   * 현재 언어에 맞는 단어 이름 반환 (기존 코드와 호환)
   */
  static getName(word: MultiLangWordItem, languageCode: string = 'ko'): string {
    // 새로운 다국어 시스템에서 우선 검색
    const translation = word.translations?.[languageCode];
    if (translation?.name) {
      return translation.name;
    }
    
    // 기존 시스템 fallback
    if (languageCode === 'ko') {
      return word.name || '';
    }
    if (languageCode === 'en') {
      return word.nameEn || '';
    }
    
    // 다른 언어인 경우 사용 가능한 첫 번째 번역 반환
    if (word.translations) {
      const availableTranslations = Object.values(word.translations);
      if (availableTranslations.length > 0) {
        return availableTranslations[0].name;
      }
    }
    
    // 최종 fallback: 기본 이름
    return word.name || word.nameEn || '';
  }

  /**
   * 현재 언어에 맞는 음성 URL 반환 (TTS/커스텀 음성 구분)
   */
  static getAudioUrl(word: MultiLangWordItem, languageCode: string = 'ko'): string {
    // 새로운 다국어 시스템에서 커스텀 음성 확인
    const translation = word.translations?.[languageCode];
    if (translation?.isCustomAudio && translation.audioUrl) {
      return translation.audioUrl;
    }
    
    // 기존 시스템 fallback (커스텀 음성이 있는 경우만)
    if (languageCode === 'ko' && word.audioKo) {
      return word.audioKo;
    }
    if (languageCode === 'en' && word.audioEn) {
      return word.audioEn;
    }
    
    // 다른 언어이거나 커스텀 음성이 없으면 빈 문자열 (TTS 사용)
    return '';
  }

  /**
   * TTS 사용 여부 확인
   */
  static shouldUseTTS(word: MultiLangWordItem, languageCode: string): boolean {
    const audioUrl = this.getAudioUrl(word, languageCode);
    return !audioUrl; // 음성 URL이 없으면 TTS 사용
  }

  /**
   * 특정 언어의 번역이 사용자 입력인지 자동 번역인지 확인
   */
  static isUserTranslation(word: MultiLangWordItem, languageCode: string): boolean {
    const translation = word.translations?.[languageCode];
    return translation?.translatedBy === 'user';
  }

  /**
   * Convert a regular WordItem to MultiLangWordItem
   */
  static convertToMultiLang(word: WordItem): MultiLangWordItem {
    return {
      id: word.id,
      name: word.name,
      nameEn: word.nameEn,
      imageUrl: word.imageUrl,
      audioKo: word.audioKo || '',
      audioEn: word.audioEn || '',
      category: word.category,
      minAge: word.minAge,
      maxAge: word.maxAge,
      ownerType: word.ownerType,
      ownerId: word.ownerId,
      translations: {
        ko: {
          name: word.name,
          confidence: 1.0,
          source: 'manual'
        },
        en: {
          name: word.nameEn,
          confidence: 1.0,
          source: 'manual'
        }
      },
      primaryLanguage: 'ko',
      secondaryLanguage: 'en',
      autoTranslatedLanguages: []
    };
  }

  /**
   * Convert MultiLangWordItem back to regular WordItem format
   */
  static convertToWordItem(multiWord: MultiLangWordItem): WordItem {
    return {
      id: multiWord.id,
      name: multiWord.name,
      nameEn: multiWord.nameEn,
      imageUrl: multiWord.imageUrl,
      audioKo: multiWord.audioKo || '',
      audioEn: multiWord.audioEn || '',
      category: multiWord.category,
      minAge: multiWord.minAge,
      maxAge: multiWord.maxAge,
      ownerType: multiWord.ownerType,
      ownerId: multiWord.ownerId
    };
  }

  /**
   * Check if a word has multilingual data
   */
  static hasMultilingualData(word: WordItem): boolean {
    const multiWord = word as MultiLangWordItem;
    return !!(multiWord.translations && Object.keys(multiWord.translations).length > 2) ||
           !!(multiWord.autoTranslatedLanguages && multiWord.autoTranslatedLanguages.length > 0) ||
           !!(multiWord.primaryLanguage && multiWord.primaryLanguage !== 'ko') ||
           !!(multiWord.secondaryLanguage && multiWord.secondaryLanguage !== 'en');
  }

  /**
   * 단어가 다국어 자동화 처리를 거쳤는지 확인
   */
  static isMultilingualWord(word: MultiLangWordItem): boolean {
    return !!(word.translations && Object.keys(word.translations).length > 2);
  }

  /**
   * 자동 번역 완료 언어 개수 반환
   */
  static getAutoTranslatedCount(word: MultiLangWordItem): number {
    if (!word.translations) return 0;
    
    return Object.values(word.translations).filter(
      t => t.translatedBy === 'auto'
    ).length;
  }

  /**
   * 전체 지원 언어 중 완성된 언어 비율 반환 (0-1)
   */
  static getCompletionRatio(word: MultiLangWordItem): number {
    if (!word.translations) return 0.2; // 기존 2개 언어만 있으면 20%
    
    const totalSupported = Object.keys(SUPPORTED_LANGUAGES).length;
    const completed = Object.keys(word.translations).length;
    
    return Math.min(completed / totalSupported, 1);
  }

  /**
   * 번역 품질이 낮은 언어들 반환 (수정이 필요한)
   */
  static getLowQualityTranslations(word: MultiLangWordItem, threshold: number = 0.8): string[] {
    if (!word.translations) return [];
    
    return Object.entries(word.translations)
      .filter(([_, translation]) => 
        translation.translatedBy === 'auto' && 
        (translation.confidence || 0) < threshold
      )
      .map(([langCode, _]) => langCode);
  }

  /**
   * 검증이 필요한 번역들 반환
   */
  static getUnverifiedTranslations(word: MultiLangWordItem): string[] {
    if (!word.translations) return [];
    
    return Object.entries(word.translations)
      .filter(([_, translation]) => 
        translation.translatedBy === 'auto' && !translation.verified
      )
      .map(([langCode, _]) => langCode);
  }

  /**
   * 단어의 번역 상태 요약 반환
   */
  static getTranslationSummary(word: MultiLangWordItem): {
    total: number;
    userTranslations: number;
    autoTranslations: number;
    lowQuality: number;
    unverified: number;
    completionRatio: number;
  } {
    const translations = word.translations || {};
    const translationList = Object.values(translations);
    
    return {
      total: translationList.length,
      userTranslations: translationList.filter(t => t.translatedBy === 'user').length,
      autoTranslations: translationList.filter(t => t.translatedBy === 'auto').length,
      lowQuality: this.getLowQualityTranslations(word).length,
      unverified: this.getUnverifiedTranslations(word).length,
      completionRatio: this.getCompletionRatio(word)
    };
  }

  /**
   * 기존 코드에서 사용하던 방식으로 현재 언어 텍스트 반환
   */
  static getCurrentLanguageText(
    word: MultiLangWordItem, 
    currentLanguage: string,
    fallbackLanguage: string = 'en'
  ): string {
    // 현재 언어 시도
    let text = this.getName(word, currentLanguage);
    if (text) return text;
    
    // fallback 언어 시도
    text = this.getName(word, fallbackLanguage);
    if (text) return text;
    
    // 최종 fallback
    return word.name || word.nameEn || '';
  }

  /**
   * Vue 컴포넌트에서 사용할 반응형 호환성 객체 반환
   */
  static createReactiveProxy(word: MultiLangWordItem, currentLanguage: string) {
    return {
      get name() {
        return WordCompatibilityHelper.getName(word, currentLanguage);
      },
      get audioUrl() {
        return WordCompatibilityHelper.getAudioUrl(word, currentLanguage);
      },
      get shouldUseTTS() {
        return WordCompatibilityHelper.shouldUseTTS(word, currentLanguage);
      },
      get isUserTranslation() {
        return WordCompatibilityHelper.isUserTranslation(word, currentLanguage);
      },
      get translationSummary() {
        return WordCompatibilityHelper.getTranslationSummary(word);
      }
    };
  }
}

// === 전역 헬퍼 함수들 (기존 코드와의 호환성) ===

/**
 * 기존 useAppStore에서 사용하던 방식 호환
 */
export function getLocalizedWordName(
  word: WordItem | MultiLangWordItem, 
  language: string
): string {
  return WordCompatibilityHelper.getName(word as MultiLangWordItem, language);
}

/**
 * 기존 useAudio에서 사용하던 방식 호환
 */
export function getLocalizedAudioUrl(
  word: WordItem | MultiLangWordItem, 
  language: string
): string {
  return WordCompatibilityHelper.getAudioUrl(word as MultiLangWordItem, language);
}

/**
 * TTS 사용 여부 체크 (기존 useAudio 호환)
 */
export function shouldUseTTSForWord(
  word: WordItem | MultiLangWordItem,
  language: string
): boolean {
  return WordCompatibilityHelper.shouldUseTTS(word as MultiLangWordItem, language);
}

/**
 * 단어가 새로운 다국어 시스템을 사용하는지 확인
 */
export function isMultilingualWord(word: WordItem | MultiLangWordItem): word is MultiLangWordItem {
  return 'translations' in word && !!word.translations;
}

/**
 * 배열의 모든 단어를 새로운 구조로 일괄 마이그레이션
 */
export function migrateWordsArray(words: WordItem[]): MultiLangWordItem[] {
  console.log(`🔄 Migrating ${words.length} words to multilingual structure...`);
  
  return words.map(word => {
    if (isMultilingualWord(word)) {
      return word; // 이미 새 구조
    }
    return WordCompatibilityHelper.migrateToMultiLangStructure(word);
  });
}

/**
 * 단어 배열에서 현재 언어로 검색
 */
export function searchWordsInLanguage(
  words: (WordItem | MultiLangWordItem)[],
  searchTerm: string,
  language: string
): (WordItem | MultiLangWordItem)[] {
  const normalizedSearch = searchTerm.toLowerCase().trim();
  
  return words.filter(word => {
    const wordName = getLocalizedWordName(word, language);
    return wordName.toLowerCase().includes(normalizedSearch);
  });
}

/**
 * 기존 QuizView에서 사용하던 방식 호환
 */
export function getQuizDisplayInfo(
  word: WordItem | MultiLangWordItem,
  currentLanguage: string
): { name: string; audioUrl: string; shouldUseTTS: boolean } {
  const multiLangWord = word as MultiLangWordItem;
  
  return {
    name: WordCompatibilityHelper.getName(multiLangWord, currentLanguage),
    audioUrl: WordCompatibilityHelper.getAudioUrl(multiLangWord, currentLanguage),
    shouldUseTTS: WordCompatibilityHelper.shouldUseTTS(multiLangWord, currentLanguage)
  };
}

// === 타입 가드 함수들 ===

/**
 * MultiLangWordItem 타입 가드
 */
export function isMultiLangWordItem(word: unknown): word is MultiLangWordItem {
  return (
    typeof word === 'object' &&
    word !== null &&
    'translations' in word
  );
}

/**
 * TranslationResult 타입 가드
 */
export function isTranslationResult(obj: unknown): obj is TranslationResult {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    'confidence' in obj &&
    'translatedBy' in obj
  );
}

// === 개발자 디버깅 유틸리티 ===

/**
 * 단어의 다국어 상태를 콘솔에 예쁘게 출력 (개발용)
 */
export function debugWordTranslations(word: MultiLangWordItem): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  console.group(`🌍 Word: "${word.name}" (${word.id})`);
  
  const summary = WordCompatibilityHelper.getTranslationSummary(word);
  console.log(`📊 Summary: ${summary.total} languages, ${Math.round(summary.completionRatio * 100)}% complete`);
  
  if (word.translations) {
    Object.entries(word.translations).forEach(([langCode, translation]) => {
      const langConfig = SUPPORTED_LANGUAGES[langCode as SupportedLanguageCode];
      const flag = langConfig?.flag || '🏳️';
      const confidence = Math.round((translation.confidence || 0) * 100);
      
      console.log(
        `${flag} ${langCode}: "${translation.name}" | ` +
        `${translation.translatedBy} | ${confidence}% | ` +
        `${translation.isCustomAudio ? '🎤 custom' : '🤖 TTS'}`
      );
    });
  }
  
  console.groupEnd();
}

/**
 * 전체 단어 목록의 다국어 통계 출력 (개발용)
 */
export function debugMultilingualStats(words: MultiLangWordItem[]): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const stats = {
    total: words.length,
    multiLingual: words.filter(w => WordCompatibilityHelper.isMultilingualWord(w)).length,
    fullyProcessed: words.filter(w => w.isFullyProcessed).length,
    averageCompletion: words.reduce((sum, w) => sum + WordCompatibilityHelper.getCompletionRatio(w), 0) / words.length
  };
  
  console.group('🌍 Multilingual Statistics');
  console.log(`📝 Total words: ${stats.total}`);
  console.log(`🚀 Multilingual: ${stats.multiLingual} (${Math.round(stats.multiLingual / stats.total * 100)}%)`);
  console.log(`✅ Fully processed: ${stats.fullyProcessed} (${Math.round(stats.fullyProcessed / stats.total * 100)}%)`);
  console.log(`📊 Average completion: ${Math.round(stats.averageCompletion * 100)}%`);
  console.groupEnd();
}