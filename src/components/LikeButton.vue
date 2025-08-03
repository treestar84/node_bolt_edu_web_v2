<template>
  <button 
    @click.stop="handleToggle"
    :class="['like-btn', { active: isLiked, loading: isLoading }]"
    :disabled="isLoading"
    :aria-label="getAriaLabel()"
    :aria-pressed="isLiked"
    :aria-describedby="showCount ? `like-count-${contentId}` : undefined"
    type="button"
  >
    <span v-if="isLoading" class="loading-spinner" aria-hidden="true">⏳</span>
    <span v-else class="heart-icon" aria-hidden="true">{{ isLiked ? '❤️' : '🤍' }}</span>
    <span v-if="showText" class="like-text">
      {{ isLiked ? '좋아요됨' : '좋아요' }}
    </span>
    <span 
      v-if="showCount && likeCount > 0" 
      class="like-count"
      :id="`like-count-${contentId}`"
      :aria-label="`좋아요 ${likeCount}개`"
    >
      {{ likeCount }}
    </span>
    <!-- Screen reader feedback for state changes -->
    <span class="sr-only" aria-live="polite" :id="`like-feedback-${contentId}`">
      {{ feedbackMessage }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useLikes } from '@/composables/useLikes';
import type { ContentType } from '@/types';

interface Props {
  contentType: ContentType;
  contentId: string;
  showText?: boolean;
  showCount?: boolean;
}

interface Emits {
  (e: 'liked', value: boolean): void;
  (e: 'likeCountChanged', count: number): void;
}

const props = withDefaults(defineProps<Props>(), {
  showText: false,
  showCount: false
});

const emit = defineEmits<Emits>();

const { likes, isLikedByUser, toggleLike, getContentLikeCount, loadLikes } = useLikes();
const isLoading = ref(false);
const likeCount = ref(0);
const feedbackMessage = ref('');

const isLiked = computed(() => {
  // likes 변화를 명시적으로 감지하도록 함
  const userLikes = likes.value;
  const result = isLikedByUser(props.contentType, props.contentId);
  console.log('🔄 LikeButton computed isLiked:', result, 'likes count:', userLikes.length);
  return result;
});

const getAriaLabel = () => {
  const contentTypeText = getContentTypeName(props.contentType);
  const baseText = `${contentTypeText} 좋아요`;
  const statusText = isLiked.value ? '취소' : '추가';
  const countText = showCount.value && likeCount.value > 0 ? `, 현재 ${likeCount.value}개` : '';
  
  if (isLoading.value) {
    return `${baseText} 처리 중`;
  }
  
  return `${baseText} ${statusText}${countText}`;
};

const getContentTypeName = (type: ContentType): string => {
  const typeNames: Record<ContentType, string> = {
    word: '단어',
    book: '그림책',
    quiz: '퀴즈',
    puzzle: '퍼즐',
    coloring: '컬러링'
  };
  return typeNames[type] || type;
};

const showCount = computed(() => props.showCount);

const handleToggle = async () => {
  if (isLoading.value) return;

  try {
    isLoading.value = true;
    const result = await toggleLike(props.contentType, props.contentId);
    
    if (result.success) {
      emit('liked', result.isLiked);
      
      // 좋아요 수 업데이트
      if (props.showCount) {
        await updateLikeCount();
      }
      
      // 사용자에게 피드백 제공 (스크린 리더 포함)
      const contentTypeName = getContentTypeName(props.contentType);
      if (result.isLiked) {
        console.log('✅ 좋아요를 눌렀습니다!');
        feedbackMessage.value = `${contentTypeName}에 좋아요를 추가했습니다`;
      } else {
        console.log('ℹ️ 좋아요를 취소했습니다.');
        feedbackMessage.value = `${contentTypeName} 좋아요를 취소했습니다`;
      }
      
      // Clear feedback message after a delay
      setTimeout(() => {
        feedbackMessage.value = '';
      }, 2000);
    }
  } catch (error) {
    console.error('❌ 좋아요 처리 중 오류:', error);
  } finally {
    isLoading.value = false;
  }
};

const updateLikeCount = async () => {
  if (!props.showCount) return;
  
  const count = await getContentLikeCount(props.contentType, props.contentId);
  likeCount.value = count;
  emit('likeCountChanged', count);
};

onMounted(async () => {
  // 좋아요 데이터 로드
  try {
    await loadLikes();
  } catch (error) {
    console.error('Failed to load likes:', error);
  }
  
  if (props.showCount) {
    await updateLikeCount();
  }
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

.like-btn {
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
  position: relative;
}

.like-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.like-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-color: var(--color-primary);
}

.like-btn.active {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.like-btn.active:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
}

.like-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.like-btn.loading {
  pointer-events: none;
}

.heart-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.like-btn:hover .heart-icon {
  transform: scale(1.1);
}

.like-btn.active .heart-icon {
  animation: heartbeat 0.6s ease-in-out;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

.like-text {
  font-size: 0.9rem;
  white-space: nowrap;
}

.like-count {
  font-size: 0.8rem;
  background: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  min-width: 20px;
  text-align: center;
}

.like-btn.active .like-count {
  background: var(--color-danger);
  color: var(--color-text-white);
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
  .like-btn {
    min-height: 48px;
    padding: var(--spacing-sm);
  }
  
  .heart-icon {
    font-size: 1.4rem;
  }
  
  .like-text {
    font-size: 0.8rem;
  }
  
  .like-count {
    font-size: 0.7rem;
  }
}

/* 터치 디바이스 최적화 */
@media (hover: none) and (pointer: coarse) {
  .like-btn:hover {
    transform: none;
  }
  
  .like-btn:active {
    transform: scale(0.95);
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .like-btn:focus {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
  
  .like-btn.active {
    border-width: 3px;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .like-btn,
  .heart-icon,
  .loading-spinner {
    transition: none;
    animation: none;
  }
  
  .like-btn:hover {
    transform: none;
  }
  
  .like-btn:hover .heart-icon {
    transform: none;
  }
  
  .like-btn.active .heart-icon {
    animation: none;
  }
}
</style>