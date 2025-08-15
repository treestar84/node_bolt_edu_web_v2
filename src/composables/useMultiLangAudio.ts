// 기존 useAudio.ts를 확장한 다국어 TTS 시스템
// 10개 언어별 최적화된 음성 합성 및 재생 기능

import { ref, computed } from 'vue';
import type { MultiLangWordItem, SupportedLanguageCode } from '@/types/multilingual';
import { 
  SUPPORTED_LANGUAGES, 
  getTTSVoiceKeywords, 
  getTTSQualityGrade
} from '@/constants/languages';
import { WordCompatibilityHelper } from '@/utils/wordCompatibility';

// 기존 useAudio의 핵심 기능 유지하면서 다국어로 확장
export function useMultiLangAudio() {
  const isPlaying = ref(false);
  const currentAudio = ref<HTMLAudioElement | null>(null);
  const audioDuration = ref(0);
  const currentLanguage = ref<string>('ko');
  const isAudioUnlocked = ref(false);
  const availableVoices = ref<SpeechSynthesisVoice[]>([]);
  
  let currentTimeoutId: NodeJS.Timeout | null = null;
  let audioContext: AudioContext | null = null;

  // === 기존 시스템 호환 기능들 ===

  // 기존 audio context 초기화 (모바일 대응)
  const initializeAudioContext = async () => {
    if (audioContext) return;
    
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      isAudioUnlocked.value = true;
      console.log('🔊 Audio context initialized:', audioContext.state);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  // 기존 audio unlock 기능
  const unlockAudio = async () => {
    if (isAudioUnlocked.value) return;
    
    try {
      await initializeAudioContext();
      
      const silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNTBFVi1wVcpnq+K0QUKFWKNcQJunYYwJQYHBIZfOPZ5YOF5xfEglQ3qyKY5Dfjxr/YtWTD3fmPnMZNKPRXmFP6BjyTYo');
      silentAudio.volume = 0.01;
      await silentAudio.play();
      
      isAudioUnlocked.value = true;
      console.log('🔓 Audio unlocked successfully');
    } catch (error) {
      console.warn('Audio unlock failed:', error);
    }
  };

  // === 새로운 다국어 TTS 시스템 ===

  // 사용 가능한 음성 목록 업데이트
  const updateAvailableVoices = () => {
    if ('speechSynthesis' in window) {
      availableVoices.value = speechSynthesis.getVoices();
      console.log(`🎤 Found ${availableVoices.value.length} TTS voices`);
    }
  };

  // 언어별 최적 음성 선택
  const getOptimalVoice = (languageCode: string): SpeechSynthesisVoice | null => {
    const languageConfig = SUPPORTED_LANGUAGES[languageCode as SupportedLanguageCode];
    if (!languageConfig) {
      console.warn(`⚠️ Unsupported language: ${languageCode}`);
      return null;
    }

    const voices = availableVoices.value;
    if (voices.length === 0) {
      console.warn('⚠️ No TTS voices available');
      return null;
    }

    // 1단계: 언어 코드로 필터링
    const languageVoices = voices.filter(voice => 
      voice.lang.startsWith(languageConfig.ttsConfig.lang.split('-')[0])
    );

    if (languageVoices.length === 0) {
      console.warn(`⚠️ No voices found for language: ${languageCode}`);
      return null;
    }

    // 2단계: 선호 키워드로 최적 음성 선택
    const keywords = getTTSVoiceKeywords(languageCode);
    
    for (const keyword of keywords) {
      const keywordVoice = languageVoices.find(voice =>
        voice.name.toLowerCase().includes(keyword.toLowerCase())
      );
      if (keywordVoice) {
        console.log(`🎯 Optimal voice selected: ${keywordVoice.name} for ${languageCode}`);
        return keywordVoice;
      }
    }

    // 3단계: 기본값으로 첫 번째 음성 선택
    const defaultVoice = languageVoices[0];
    console.log(`🔄 Default voice selected: ${defaultVoice.name} for ${languageCode}`);
    return defaultVoice;
  };

  // TTS 지원 여부 확인
  const checkTTSSupport = (languageCode: string): boolean => {
    if (!('speechSynthesis' in window)) return false;
    
    const languageConfig = SUPPORTED_LANGUAGES[languageCode as SupportedLanguageCode];
    if (!languageConfig) return false;

    const voices = availableVoices.value;
    return voices.some(voice => 
      voice.lang.startsWith(languageConfig.ttsConfig.lang.split('-')[0])
    );
  };

  // 언어별 TTS 품질 점수 계산
  const getTTSQualityScore = (languageCode: string): number => {
    const grade = getTTSQualityGrade(languageCode);
    const scoreMap = {
      excellent: 0.95,
      good: 0.85,
      fair: 0.70,
      poor: 0.50
    };
    return scoreMap[grade];
  };

  // === 핵심 다국어 TTS 재생 함수 ===

  const speakText = async (
    text: string,
    languageCode: string,
    options: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (error: string) => void;
    } = {}
  ): Promise<number> => {
    return new Promise(async (resolve, reject) => {
      console.log(`🗣️ Speaking text in ${languageCode}: "${text}"`);
      
      // 오디오 unlock 확인
      if (!isAudioUnlocked.value) {
        await unlockAudio();
      }

      // TTS 지원 여부 확인
      if (!checkTTSSupport(languageCode)) {
        const errorMsg = `TTS not supported for language: ${languageCode}`;
        console.error(`❌ ${errorMsg}`);
        options.onError?.(errorMsg);
        reject(new Error(errorMsg));
        return;
      }

      // 기존 재생 중지
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }

      const languageConfig = SUPPORTED_LANGUAGES[languageCode as SupportedLanguageCode];
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 언어별 최적 설정 적용
      utterance.lang = languageConfig.ttsConfig.lang;
      utterance.rate = languageConfig.ttsConfig.rate;
      utterance.pitch = languageConfig.ttsConfig.pitch;
      utterance.volume = 0.8;

      // 최적 음성 선택
      const optimalVoice = getOptimalVoice(languageCode);
      if (optimalVoice) {
        utterance.voice = optimalVoice;
      }

      let hasCompleted = false;
      let startTime = Date.now();

      const handleComplete = (duration: number, success: boolean = true) => {
        if (hasCompleted) return;
        hasCompleted = true;
        
        isPlaying.value = false;
        
        if (success) {
          console.log(`✅ TTS completed for ${languageCode}: "${text}" (${duration}ms)`);
          options.onEnd?.();
          resolve(duration);
        } else {
          options.onError?.('TTS playback failed');
          reject(new Error('TTS playback failed'));
        }
      };

      // 이벤트 리스너 설정
      utterance.onstart = () => {
        console.log(`🎵 TTS started for ${languageCode}`);
        isPlaying.value = true;
        startTime = Date.now();
        options.onStart?.();
      };

      utterance.onend = () => {
        const duration = Date.now() - startTime;
        handleComplete(duration, true);
      };

      utterance.onerror = (event) => {
        console.error(`🚨 TTS error for ${languageCode}:`, event.error);
        const duration = Date.now() - startTime;
        handleComplete(duration, false);
      };

      utterance.onpause = () => {
        console.log(`⏸️ TTS paused for ${languageCode}`);
      };

      utterance.onresume = () => {
        console.log(`▶️ TTS resumed for ${languageCode}`);
      };

      // 안전 타임아웃 설정 (언어별 조정)
      const timeoutDuration = Math.max(text.length * 150, 3000); // 최소 3초
      const timeoutId = setTimeout(() => {
        if (!hasCompleted) {
          console.warn(`⚠️ TTS timeout for ${languageCode} after ${timeoutDuration}ms`);
          speechSynthesis.cancel();
          handleComplete(timeoutDuration, true); // 타임아웃도 성공으로 간주
        }
      }, timeoutDuration);

      try {
        speechSynthesis.speak(utterance);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`❌ Failed to start TTS for ${languageCode}:`, error);
        handleComplete(0, false);
      }
    });
  };

  // === 기존 playAudio 함수 호환성 확장 ===

  const playAudio = (
    audioUrl: string,
    options?: { 
      fallbackText?: string; 
      languageCode?: string;
      onEnded?: () => void 
    } | string
  ): Promise<number> => {
    return new Promise(async (resolve, reject) => {
      // 옵션 파싱 (기존 호환성)
      let fallbackText: string | undefined;
      let languageCode = currentLanguage.value;
      let onEnded: (() => void) | undefined;

      if (typeof options === 'string') {
        fallbackText = options;
      } else if (options) {
        fallbackText = options.fallbackText;
        languageCode = options.languageCode || languageCode;
        onEnded = options.onEnded;
      }

      // 커스텀 음성 파일이 있으면 기존 방식으로 재생
      if (audioUrl && audioUrl.trim()) {
        try {
          console.log(`🎵 Playing custom audio: ${audioUrl}`);
          const duration = await playCustomAudio(audioUrl, onEnded);
          resolve(duration);
          return;
        } catch (error) {
          console.warn(`⚠️ Custom audio failed, falling back to TTS:`, error);
        }
      }

      // TTS 사용
      if (fallbackText) {
        try {
          const duration = await speakText(fallbackText, languageCode, {
            onEnd: onEnded
          });
          resolve(duration);
        } catch (error) {
          console.error(`❌ TTS failed for ${languageCode}:`, error);
          reject(error);
        }
      } else {
        reject(new Error('No audio URL or fallback text provided'));
      }
    });
  };

  // 커스텀 음성 파일 재생 (기존 로직 유지)
  const playCustomAudio = (audioUrl: string, onEnded?: () => void): Promise<number> => {
    return new Promise(async (resolve, reject) => {
      if (!isAudioUnlocked.value) {
        await unlockAudio();
      }

      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId);
        currentTimeoutId = null;
      }

      if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value.currentTime = 0;
        currentAudio.value = null;
      }

      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.src = audioUrl;
      
      (audio as any).playsInline = true;
      if ('webkitPlaysInline' in audio) {
        (audio as any).webkitPlaysInline = true;
      }
      
      currentAudio.value = audio;
      isPlaying.value = true;

      let hasEnded = false;

      const handleSuccess = (duration: number) => {
        if (hasEnded) return;
        hasEnded = true;
        
        console.log(`✅ Custom audio completed: ${audioUrl}`);
        isPlaying.value = false;
        currentAudio.value = null;
        
        onEnded?.();
        resolve(duration);
      };

      const handleError = () => {
        if (hasEnded) return;
        hasEnded = true;
        
        console.error(`❌ Custom audio failed: ${audioUrl}`);
        isPlaying.value = false;
        currentAudio.value = null;
        
        reject(new Error('Custom audio playback failed'));
      };

      audio.addEventListener('loadedmetadata', () => {
        audioDuration.value = audio.duration || 3;
      }, { once: true });

      audio.addEventListener('ended', () => {
        handleSuccess(audioDuration.value * 1000);
      }, { once: true });

      audio.addEventListener('error', handleError, { once: true });

      const setupTimeout = () => {
        const duration = audioDuration.value || 5;
        const timeoutDuration = (duration + 2) * 1000;
        
        currentTimeoutId = setTimeout(() => {
          if (!hasEnded) {
            console.warn(`⚠️ Custom audio timeout: ${audioUrl}`);
            handleSuccess(duration * 1000);
          }
        }, timeoutDuration);
      };

      try {
        await audio.play();
        console.log(`▶️ Custom audio started: ${audioUrl}`);
        
        if (audioDuration.value > 0) {
          setupTimeout();
        } else {
          setTimeout(setupTimeout, 100);
        }
      } catch (error) {
        handleError();
      }
    });
  };

  // === 다국어 단어 재생 함수 (새로운 핵심 기능) ===

  const playWordInLanguage = async (
    word: MultiLangWordItem,
    languageCode: string,
    onEnded?: () => void
  ): Promise<number> => {
    console.log(`🌍 Playing word "${WordCompatibilityHelper.getName(word, languageCode)}" in ${languageCode}`);
    
    try {
      // 커스텀 음성 확인
      const customAudioUrl = WordCompatibilityHelper.getAudioUrl(word, languageCode);
      const wordText = WordCompatibilityHelper.getName(word, languageCode);
      
      if (customAudioUrl) {
        // 커스텀 음성 재생
        return await playCustomAudio(customAudioUrl, onEnded);
      } else {
        // TTS 사용
        return await speakText(wordText, languageCode, { onEnd: onEnded });
      }
    } catch (error) {
      console.error(`❌ Failed to play word in ${languageCode}:`, error);
      throw error;
    }
  };

  // === 일괄 처리 및 테스트 함수들 ===

  // 모든 언어로 TTS 테스트
  const testAllLanguagesTTS = async (): Promise<Record<string, boolean>> => {
    console.log('🧪 Testing TTS support for all languages...');
    
    const results: Record<string, boolean> = {};
    
    for (const [langCode, config] of Object.entries(SUPPORTED_LANGUAGES)) {
      try {
        const isSupported = checkTTSSupport(langCode);
        results[langCode] = isSupported;
        
        console.log(`${config.flag} ${config.name}: ${isSupported ? '✅ Supported' : '❌ Not supported'}`);
      } catch (error) {
        results[langCode] = false;
        console.error(`${config.flag} ${config.name}: ❌ Error testing`);
      }
    }
    
    return results;
  };

  // 언어별 음성 품질 정보 반환
  const getLanguageAudioInfo = (languageCode: string) => {
    const config = SUPPORTED_LANGUAGES[languageCode as SupportedLanguageCode];
    if (!config) return null;

    return {
      language: config.name,
      nativeName: config.nativeName,
      flag: config.flag,
      isSupported: checkTTSSupport(languageCode),
      qualityGrade: getTTSQualityGrade(languageCode),
      qualityScore: getTTSQualityScore(languageCode),
      optimalVoice: getOptimalVoice(languageCode)?.name || 'Default',
      ttsConfig: config.ttsConfig
    };
  };

  // === 정리 및 중지 함수들 ===

  const stopAudio = () => {
    console.log('🛑 Stopping all audio playback');
    
    if (currentTimeoutId) {
      clearTimeout(currentTimeoutId);
      currentTimeoutId = null;
    }
    
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
      currentAudio.value = null;
    }
    
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    isPlaying.value = false;
  };

  // === 초기화 ===

  // TTS 음성 목록 로드
  if ('speechSynthesis' in window) {
    updateAvailableVoices();
    speechSynthesis.onvoiceschanged = updateAvailableVoices;
  }

  // === 반환 객체 ===

  return {
    // 상태
    isPlaying,
    audioDuration,
    currentLanguage,
    isAudioUnlocked,
    availableVoices: computed(() => availableVoices.value),
    
    // 기존 호환성 함수
    playAudio,
    stopAudio,
    unlockAudio,
    
    // 새로운 다국어 함수들
    speakText,
    playWordInLanguage,
    checkTTSSupport,
    getOptimalVoice,
    getTTSQualityScore,
    getLanguageAudioInfo,
    testAllLanguagesTTS,
    
    // 유틸리티
    updateAvailableVoices
  };
}

// === 전역 헬퍼 (기존 useAudio 완전 호환) ===

/**
 * 기존 useAudio와 100% 호환되는 래퍼
 */
export function useAudio() {
  const multiLangAudio = useMultiLangAudio();
  
  return {
    isPlaying: multiLangAudio.isPlaying,
    audioDuration: multiLangAudio.audioDuration,
    playAudio: multiLangAudio.playAudio,
    stopAudio: multiLangAudio.stopAudio,
    unlockAudio: multiLangAudio.unlockAudio,
    isAudioUnlocked: multiLangAudio.isAudioUnlocked
  };
}

/**
 * 단순한 TTS 재생 (기존 코드 호환용)
 */
export function useTTS() {
  const { speakText, checkTTSSupport } = useMultiLangAudio();
  
  return {
    speak: speakText,
    isSupported: checkTTSSupport
  };
}