<template>
  <div class="word-card" @click="playWordAudio">
    <div class="card-image">
      <img :src="getImageUrl(word.imageUrl)" :alt="currentName" />
      <div class="play-overlay" :class="{ playing: isPlaying }">
        <span class="play-icon">{{ isPlaying ? '🔊' : '🔈' }}</span>
      </div>
    </div>
    <div class="card-content">
      <h3 class="word-name">{{ currentName }}</h3>
      <span class="word-category">{{$t('categories.'+word.category)}}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { WordItem } from '@/types';
import { useAppStore } from '@/stores/app';
import { useAudio } from '@/composables/useAudio';
import { useFileUpload } from '@/composables/useFileUpload';

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
const { getUploadedFileUrl } = useFileUpload();

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const currentName = computed(() => {
  return store.currentLanguage === 'ko' ? props.word.name : props.word.nameEn;
});

const currentAudioUrl = computed(() => {
  const audioUrl = store.currentLanguage === 'ko' ? props.word.audioKo : props.word.audioEn;
  return getAudioUrl(audioUrl);
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
    await playAudio(currentAudioUrl.value, currentName.value);
    emit('audio-played');
  } catch (error) {
    console.warn('Audio playback failed:', error);
    emit('audio-played'); // Still emit for auto-advance
  }
};

defineExpose({
  playWordAudio
});
</script>

<style scoped>
.word-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.word-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-primary);
}

.word-card:active {
  transform: translateY(-4px) scale(0.98);
}

.card-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  flex-shrink: 0;
}

.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.word-card:hover .card-image img {
  transform: scale(1.1);
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  opacity: 0;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.word-card:hover .play-overlay {
  opacity: 1;
}

.play-overlay.playing {
  opacity: 1;
  background: rgba(59, 130, 246, 0.8);
  animation: pulse 1s infinite;
}

.card-content {
  padding: var(--spacing-lg);
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: var(--spacing-sm);
}

.word-name {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  word-break: break-word;
  hyphens: auto;
}

.word-category {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-transform: capitalize;
  background: var(--color-bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  display: inline-block;
}

@keyframes pulse {
  0% { transform: translate(-50%, -50%) scale(1); }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); }
}

/* Tablet optimizations */
@media (max-width: 1024px) {
  .card-image {
    height: 180px;
  }
  
  .word-name {
    font-size: 1.375rem;
  }
  
  .card-content {
    padding: var(--spacing-md);
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .word-card {
    border-radius: var(--radius-md);
  }
  
  .card-image {
    height: 160px;
  }
  
  .word-name {
    font-size: 1.25rem;
    margin-bottom: var(--spacing-xs);
  }
  
  .card-content {
    padding: var(--spacing-md);
  }
  
  .play-overlay {
    width: 50px;
    height: 50px;
    font-size: 1.25rem;
    opacity: 1;
  }
  
  .word-category {
    font-size: 0.8rem;
    padding: var(--spacing-xs);
  }
}

/* Small mobile optimizations */
@media (max-width: 480px) {
  .card-image {
    height: 140px;
  }
  
  .word-name {
    font-size: 1.125rem;
  }
  
  .card-content {
    padding: var(--spacing-sm);
  }
  
  .play-overlay {
    width: 45px;
    height: 45px;
    font-size: 1.125rem;
  }
  
  .word-category {
    font-size: 0.75rem;
  }
}

/* Very small screens */
@media (max-width: 360px) {
  .card-image {
    height: 120px;
  }
  
  .word-name {
    font-size: 1rem;
  }
  
  .card-content {
    padding: var(--spacing-xs);
  }
  
  .play-overlay {
    width: 40px;
    height: 40px;
    font-size: 1rem;
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
    background: rgba(0, 0, 0, 0.5);
  }
  
  .word-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
  
  .card-content {
    padding: var(--spacing-lg);
  }
  
  .word-name {
    font-size: 1.375rem;
  }
  
  .play-overlay {
    width: 55px;
    height: 55px;
    font-size: 1.375rem;
  }
}

/* High DPI screens */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .card-image img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
}

/* Reduce animations for users who prefer reduced motion */
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
  
  .play-overlay.playing {
    animation: none;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .play-overlay {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .word-card {
    border-color: var(--color-border);
  }
  
  .word-card:hover {
    border-color: var(--color-primary);
  }
}
</style>