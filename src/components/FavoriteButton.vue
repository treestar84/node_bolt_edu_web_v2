<template>
  <button 
    @click="handleToggle"
    :class="['favorite-btn', { active: isFavorited, loading: isLoading }]"
    :disabled="isLoading"
    :title="isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'"
  >
    <span v-if="isLoading" class="loading-spinner">⏳</span>
    <span v-else class="heart-icon">{{ isFavorited ? '❤️' : '🤍' }}</span>
    <span v-if="showText" class="favorite-text">
      {{ isFavorited ? '즐겨찾기됨' : '즐겨찾기' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useFavorites } from '@/composables/useFavorites';
import type { ContentType } from '@/types';

interface Props {
  contentType: ContentType;
  contentId: string;
  showText?: boolean;
}

interface Emits {
  (e: 'favorited', value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  showText: false
});

const emit = defineEmits<Emits>();

const { isFavorite, toggleFavorite } = useFavorites();
const isLoading = ref(false);

const isFavorited = computed(() => 
  isFavorite(props.contentType, props.contentId)
);

const handleToggle = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    const success = await toggleFavorite(props.contentType, props.contentId);
    
    if (success) {
      const newStatus = isFavorite(props.contentType, props.contentId);
      emit('favorited', newStatus);
      
      // 사용자에게 피드백 제공
      if (newStatus) {
        console.log('✅ 즐겨찾기에 추가되었습니다!');
      } else {
        console.log('ℹ️ 즐겨찾기에서 제거되었습니다.');
      }
    }
  } catch (error) {
    console.error('❌ 즐겨찾기 처리 중 오류:', error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.favorite-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  min-height: 44px;
}

.favorite-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.favorite-btn.active {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.favorite-btn.active:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.favorite-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.favorite-btn.loading {
  pointer-events: none;
}

.heart-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.favorite-btn:hover .heart-icon {
  transform: scale(1.1);
}

.favorite-btn.active .heart-icon {
  animation: heartbeat 0.6s ease-in-out;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.favorite-text {
  font-size: 0.9rem;
  white-space: nowrap;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .favorite-btn {
    min-height: 48px;
    padding: var(--spacing-sm);
  }
  
  .heart-icon {
    font-size: 1.4rem;
  }
  
  .favorite-text {
    font-size: 0.8rem;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .favorite-btn:hover {
    transform: none;
  }
  
  .favorite-btn:active {
    transform: scale(0.95);
  }
}
</style>