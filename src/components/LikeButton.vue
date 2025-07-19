<template>
  <button 
    @click.stop="handleToggle"
    :class="['like-btn', { active: isLiked, loading: isLoading }]"
    :disabled="isLoading"
    :title="isLiked ? '좋아요 취소' : '좋아요'"
  >
    <span v-if="isLoading" class="loading-spinner">⏳</span>
    <span v-else class="heart-icon">{{ isLiked ? '❤️' : '🤍' }}</span>
    <span v-if="showText" class="like-text">
      {{ isLiked ? '좋아요됨' : '좋아요' }}
    </span>
    <span v-if="showCount && likeCount > 0" class="like-count">
      {{ likeCount }}
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

const isLiked = computed(() => {
  // likes 변화를 명시적으로 감지하도록 함
  const userLikes = likes.value;
  const result = isLikedByUser(props.contentType, props.contentId);
  console.log('🔄 LikeButton computed isLiked:', result, 'likes count:', userLikes.length);
  return result;
});

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
      
      // 사용자에게 피드백 제공
      if (result.isLiked) {
        console.log('✅ 좋아요를 눌렀습니다!');
      } else {
        console.log('ℹ️ 좋아요를 취소했습니다.');
      }
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
}

.like-btn:hover:not(:disabled) {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
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
  color: white;
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
</style>