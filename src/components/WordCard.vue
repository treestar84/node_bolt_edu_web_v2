<template>
  <article 
    class="word-card"
    :aria-label="`${t('words.wordCard')}: ${currentName}`"
    role="button"
    tabindex="0"
    @click="playWordAudio"
    @keydown.enter="playWordAudio"
    @keydown.space.prevent="playWordAudio"
  >
    <div class="card-image">
      <img 
        :src="getImageUrl(word.imageUrl || '')" 
        :alt="`${currentName} ${t('words.image')}`"
        loading="lazy"
      />
      <div class="play-overlay" :class="{ playing: isPlaying }" aria-hidden="true">
        <span class="play-icon">{{ isPlaying ? '🔊' : '🔈' }}</span>
      </div>
    </div>
    <div class="card-content">
      <div class="word-info">
        <h3 class="word-name" :id="`word-name-${word.id}`">{{ currentName }}</h3>
        <span 
          class="word-category"
          :aria-label="`${t('words.category')}: ${t('categories.'+word.category)}`"
        >
          {{t('categories.'+word.category)}}
        </span>
      </div>
      <div class="card-actions" @click.stop>
        <LikeButton 
          content-type="word" 
          :content-id="word.id"
          :show-count="true"
          @liked="onLiked"
        />
      </div>
    </div>
    <!-- Screen reader feedback for audio playback -->
    <div class="sr-only" aria-live="polite" :id="`word-feedback-${word.id}`">
      {{ audioFeedback }}
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WordItem } from '@/types';
import { useAppStore } from '@/stores/app';
import { useAudio } from '@/composables/useAudio';
import LikeButton from './LikeButton.vue';

interface Props {
  word: WordItem;
}

interface Emits {
  (e: 'audio-played'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const store = useAppStore();
const { isPlaying, playAudio } = useAudio();
const { t } = useI18n();
const audioFeedback = ref('');

const currentName = computed(() => {
  // 현재 언어에 맞는 단어명 반환
  if (store.currentLanguage === 'ko') {
    return props.word.name;
  }
  if (store.currentLanguage === 'en') {
    return props.word.nameEn;
  }
  
  // 다른 언어인 경우 translations에서 찾기
  if (props.word.translations) {
    try {
      let translations = props.word.translations;
      
      // JSON 파싱 (이중 인코딩 처리)
      if (typeof translations === 'string') {
        translations = JSON.parse(translations);
        if (typeof translations === 'string') {
          translations = JSON.parse(translations);
        }
      }
      
      if (translations[store.currentLanguage]) {
        const translation = translations[store.currentLanguage];
        return typeof translation === "object" ? (translation as any)?.name || translation : translation;
      }
    } catch (error) {
      console.warn(t('words.translationParseFailed') + ':', error);
    }
  }
  
  // 폴백: 영어 -> 한국어
  return props.word.nameEn || props.word.name;
});

const currentAudioUrl = computed(() => {
  // 한국어/영어인 경우 기존 오디오 파일 사용
  if (store.currentLanguage === 'ko' && props.word.audioKo) {
    return getAudioUrl(props.word.audioKo);
  }
  if (store.currentLanguage === 'en' && props.word.audioEn) {
    return getAudioUrl(props.word.audioEn);
  }
  
  // 다른 언어이거나 오디오 파일이 없는 경우 null 반환 (브라우저 TTS 사용)
  return null;
});

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const getAudioUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const playWordAudio = async () => {
  try {
    // Provide screen reader feedback
    audioFeedback.value = `${currentName.value} ${t('words.audioPlaying')}`;
    
    // 오디오 파일이 있는 경우 파일 재생, 없는 경우 TTS 사용
    if (currentAudioUrl.value) {
      await playAudio(currentAudioUrl.value, currentName.value);
    } else {
      // 브라우저 TTS 사용
      await playTTS(currentName.value, store.currentLanguage);
    }
    
    emit('audio-played');
    
    // Clear feedback after a delay
    setTimeout(() => {
      audioFeedback.value = '';
    }, 2000);
  } catch (error) {
    console.warn('Audio playback failed:', error);
    audioFeedback.value = `${currentName.value} ${t('words.audioPlayFailed')}`;
    
    setTimeout(() => {
      audioFeedback.value = '';
    }, 3000);
    
    emit('audio-played'); // Still emit for auto-advance
  }
};

// 브라우저 TTS 함수
const playTTS = async (text: string, language: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('TTS not supported'));
      return;
    }
    
    // 기존 음성 정지
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // 언어별 TTS 설정
    const languageMap: Record<string, string> = {
      ko: 'ko-KR',
      en: 'en-US', 
      zh: 'zh-CN',
      ja: 'ja-JP',
      es: 'es-ES',
      fr: 'fr-FR',
      de: 'de-DE',
      ar: 'ar-SA',
      hi: 'hi-IN',
      pt: 'pt-BR'
    };
    
    utterance.lang = languageMap[language] || 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;
    
    // 사용 가능한 음성 중에서 해당 언어에 맞는 음성 선택
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(language) || 
      voice.lang.startsWith(utterance.lang)
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(`TTS error: ${event.error}`));
    
    speechSynthesis.speak(utterance);
  });
};

const onLiked = (isLiked: boolean) => {
  console.log(`Word "${currentName.value}" ${isLiked ? 'liked' : 'unliked'}`);
};

defineExpose({
  playWordAudio
});
</script>

<style scoped>
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.word-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-card);
}

.word-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.word-card:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-color: var(--color-primary);
}

.word-card:active {
  transform: translateY(-2px) scale(0.98);
}

.card-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  flex-shrink: 0;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.word-card:hover .card-image img {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 48px;
  height: 48px;
  background: var(--color-primary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  opacity: 0;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-md);
}

.play-overlay .play-icon {
  color: var(--color-text-white);
}

.word-card:hover .play-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.1);
}

.play-overlay.playing {
  opacity: 1;
  background: var(--color-secondary);
  transform: translate(-50%, -50%) scale(1.2);
  animation: pulse 1s infinite;
}

.card-content {
  padding: 20px 16px 16px;
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

.word-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.card-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.word-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  word-break: break-word;
  line-height: 1.3;
}

.word-category {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  text-transform: capitalize;
  background: var(--color-bg-tertiary);
  padding: 4px 8px;
  border-radius: 12px;
  display: inline-block;
  font-weight: 500;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1.2); }
  50% { transform: translate(-50%, -50%) scale(1.4); }
  100% { transform: translate(-50%, -50%) scale(1.2); }
}

/* Large card variant for single view */
.word-card.large-card {
  max-width: 400px;
  margin: 0 auto;
}

.word-card.large-card .word-name {
  font-size: 1.5rem;
}

.word-card.large-card .play-overlay {
  width: 64px;
  height: 64px;
  font-size: 1.5rem;
}

/* Tablet optimizations */
@media (max-width: 1024px) {
  .word-name {
    font-size: 1.125rem;
  }
  
  .card-content {
    padding: 16px 12px 12px;
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .card-content {
    padding: 12px 8px 8px;
    gap: 8px;
  }
  
  .word-name {
    font-size: 1rem;
    margin-bottom: 6px;
  }
  
  .word-category {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .play-overlay {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
}

/* Small mobile optimizations */
@media (max-width: 480px) {
  .word-name {
    font-size: 0.9rem;
  }
  
  .word-category {
    font-size: 0.65rem;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .word-card:hover {
    transform: none;
  }
  
  .word-card:hover .card-image img {
    transform: none;
  }
  
  .play-overlay {
    opacity: 1;
  }
  
  .word-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .word-card:focus {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
  
  .word-card {
    border-width: 2px;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .word-card,
  .card-image img,
  .play-overlay {
    transition: none;
  }
  
  .word-card:hover {
    transform: none;
  }
  
  .word-card:hover .card-image img {
    transform: none;
  }
  
  .word-card:focus {
    transform: none;
  }
  
  .play-overlay.playing {
    animation: none;
  }
}
</style>