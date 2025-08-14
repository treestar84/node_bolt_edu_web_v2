// 사용 가능한 언어를 동적으로 감지하는 composable
import { computed, ref } from 'vue';
import { useAppStore } from '@/stores/app';
import type { Language } from '@/types';
import { SUPPORTED_LANGUAGES, ALL_LANGUAGE_CODES } from '@/constants/languages';

export function useAvailableLanguages() {
  const store = useAppStore();

  /**
   * 현재 로드된 단어들에서 사용 가능한 언어 추출
   */
  const availableLanguages = computed(() => {
    // 모든 지원 언어를 포함하도록 변경
    const languages = new Set<Language>(ALL_LANGUAGE_CODES); // 모든 언어 포함
    
    console.log('🔍 단어 데이터 분석 시작:', store.currentWords.length, '개 단어');
    
    // 모든 단어의 다국어 데이터를 확인
    store.currentWords.forEach((word, index) => {
      // 단어 구조 디버깅
      if (index === 0) {
        console.log('📋 첫 번째 단어 구조:', word);
      }
      
      // translations 필드에 JSON으로 저장된 다국어 데이터 확인
      if (word.translations) {
        if (index < 3) { // 처음 3개만 자세히 로그
          console.log(`🌐 단어 "${word.name}" 다국어 데이터 발견:`, typeof word.translations);
        }
        try {
          let translations = word.translations;
          
          // 이중 JSON 인코딩 처리 (string -> string -> object)
          if (typeof translations === 'string') {
            translations = JSON.parse(translations);
            // 여전히 문자열이면 한 번 더 파싱
            if (typeof translations === 'string') {
              translations = JSON.parse(translations);
            }
          }
          
          if (index < 3) { // 처음 3개만 자세히 로그
            console.log(`📖 파싱된 번역 (${typeof translations}):`, Object.keys(translations));
          }
          
          // translations 객체의 키들이 언어 코드인지 확인
          if (translations && typeof translations === 'object') {
            Object.keys(translations).forEach(langCode => {
              if (ALL_LANGUAGE_CODES.includes(langCode as any)) {
                languages.add(langCode as Language);
                if (index < 3) { // 처음 3개만 자세히 로그
                  console.log(`✅ 언어 추가: ${langCode} = "${translations[langCode]?.name || translations[langCode]}"`);
                }
              }
            });
          }
        } catch (error) {
          console.warn(`❌ 단어 "${word.name}" 번역 데이터 파싱 실패:`, error);
        }
      } else {
        if (index < 5) { // 처음 5개만 로그
          console.log(`⚪ 단어 "${word.name}" - 다국어 데이터 없음`);
        }
      }
    });

    const finalLanguages = Array.from(languages).sort((a, b) => {
      // 한국어, 영어를 앞에 배치하고 나머지는 알파벳 순
      if (a === 'ko') return -1;
      if (b === 'ko') return 1;
      if (a === 'en') return -1;
      if (b === 'en') return 1;
      return a.localeCompare(b);
    });
    
    console.log('🎯 최종 사용 가능한 언어들:', finalLanguages);
    return finalLanguages;
  });

  /**
   * 언어의 표시명 가져오기
   */
  const getLanguageDisplayName = (langCode: Language): string => {
    const config = SUPPORTED_LANGUAGES[langCode as any];
    if (config) {
      // 한국어와 영어는 짧은 표시명 사용
      if (langCode === 'ko') return '한글';
      if (langCode === 'en') return 'ENG';
      return config.nativeName;
    }
    return langCode.toUpperCase();
  };

  /**
   * 언어의 국기 이모지 가져오기
   */
  const getLanguageFlag = (langCode: Language): string => {
    const config = SUPPORTED_LANGUAGES[langCode as any];
    return config?.flag || '🌐';
  };

  /**
   * 특정 언어로 된 단어들의 개수
   */
  const getLanguageWordCount = (langCode: Language): number => {
    if (langCode === 'ko' || langCode === 'en') {
      // 기본 언어는 모든 단어가 있음
      return store.currentWords.length;
    }

    let count = 0;
    store.currentWords.forEach(word => {
      if (word.translations) {
        try {
          let translations = word.translations;
          
          // 이중 JSON 인코딩 처리
          if (typeof translations === 'string') {
            translations = JSON.parse(translations);
            if (typeof translations === 'string') {
              translations = JSON.parse(translations);
            }
          }
          
          if (translations[langCode]) {
            count++;
          }
        } catch (error) {
          // 파싱 실패 시 무시
        }
      }
    });

    return count;
  };

  /**
   * 언어별 단어 완성도 (%)
   */
  const getLanguageCompleteness = (langCode: Language): number => {
    const totalWords = store.currentWords.length;
    if (totalWords === 0) return 0;
    
    const availableWords = getLanguageWordCount(langCode);
    return Math.round((availableWords / totalWords) * 100);
  };

  /**
   * 언어가 충분히 완성되었는지 확인 (UI 전환에 적합한지)
   */
  const isLanguageReady = (langCode: Language): boolean => {
    if (langCode === 'ko' || langCode === 'en') {
      return true; // 기본 언어는 항상 준비됨
    }
    
    const completeness = getLanguageCompleteness(langCode);
    const wordCount = getLanguageWordCount(langCode);
    console.log(`🎯 언어 준비 상태 체크 - ${langCode}: ${completeness}%, ${wordCount}개 단어`);
    
    return true; // 모든 언어를 항상 준비된 상태로 설정
  };

  /**
   * UI 전환에 사용할 수 있는 언어들만 필터링
   */
  const readyLanguages = computed(() => {
    console.log('🔄 readyLanguages 계산 중...');
    console.log('사용 가능한 언어들:', availableLanguages.value);
    
    const ready = availableLanguages.value.filter(lang => {
      const isReady = isLanguageReady(lang);
      console.log(`${lang}: ${isReady ? '✅ 준비됨' : '❌ 준비 안됨'}`);
      return isReady;
    });
    
    console.log('🎯 최종 준비된 언어들:', ready);
    return ready;
  });

  /**
   * 다음 언어 가져오기 (확장된 버전)
   */
  const getNextLanguage = (currentLang: Language): Language => {
    const ready = readyLanguages.value;
    const currentIndex = ready.indexOf(currentLang);
    const nextIndex = (currentIndex + 1) % ready.length;
    return ready[nextIndex];
  };

  return {
    availableLanguages,
    readyLanguages,
    getLanguageDisplayName,
    getLanguageFlag,
    getLanguageWordCount,
    getLanguageCompleteness,
    isLanguageReady,
    getNextLanguage
  };
}