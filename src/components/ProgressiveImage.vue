<template>
  <div class="progressive-image" :class="{ loaded: isLoaded, error: hasError }">
    <!-- 썸네일 이미지 (즉시 로드) -->
    <img 
      v-if="thumbnailUrl && !isLoaded"
      :src="getImageUrl(thumbnailUrl)"
      :alt="alt"
      class="thumbnail"
      loading="eager"
      @load="onThumbnailLoad"
      @error="onError"
    />
    
    <!-- 메인 이미지 (지연 로드) -->
    <img
      v-show="isLoaded"
      :src="getImageUrl(src)"
      :alt="alt"
      class="main-image"
      :loading="eager ? 'eager' : 'lazy'"
      @load="onMainLoad"
      @error="onError"
      ref="mainImage"
    />
    
    <!-- 로딩 상태 -->
    <div v-if="showLoading && !isLoaded && !hasError" class="loading-overlay">
      <div class="loading-spinner"></div>
    </div>
    
    <!-- 에러 상태 -->
    <div v-if="hasError" class="error-overlay">
      <span class="error-icon">⚠️</span>
      <span class="error-text">이미지를 불러올 수 없습니다</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';

interface Props {
  src: string;
  thumbnailUrl?: string;
  alt: string;
  eager?: boolean; // 즉시 로딩 여부
  showLoading?: boolean; // 로딩 스피너 표시 여부
}

const props = withDefaults(defineProps<Props>(), {
  eager: false,
  showLoading: true
});

const isLoaded = ref(false);
const hasError = ref(false);
const thumbnailLoaded = ref(false);
const mainImage = ref<HTMLImageElement>();

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const onThumbnailLoad = () => {
  thumbnailLoaded.value = true;
  // 썸네일 로드 후 메인 이미지 로드 시작
  if (mainImage.value && !props.eager) {
    // Intersection Observer로 뷰포트에 들어왔을 때만 로드
    startMainImageLoad();
  }
};

const onMainLoad = () => {
  isLoaded.value = true;
  hasError.value = false;
};

const onError = () => {
  hasError.value = true;
};

const startMainImageLoad = () => {
  if (!mainImage.value) return;
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // 뷰포트에 들어왔을 때 메인 이미지 로드
        const img = entry.target as HTMLImageElement;
        img.src = getImageUrl(props.src);
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px' // 50px 전에 미리 로드
  });
  
  observer.observe(mainImage.value);
};

onMounted(() => {
  if (props.eager) {
    // 즉시 로딩이 필요한 경우 (첫 화면 등)
    isLoaded.value = false;
  } else if (!props.thumbnailUrl) {
    // 썸네일이 없는 경우 바로 메인 이미지 로드
    startMainImageLoad();
  }
});

// src 변경 시 상태 리셋
watch(() => props.src, () => {
  isLoaded.value = false;
  hasError.value = false;
  thumbnailLoaded.value = false;
});
</script>

<style scoped>
.progressive-image {
  position: relative;
  display: inline-block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--color-bg-secondary);
  border-radius: 8px;
}

.thumbnail,
.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
}

.thumbnail {
  position: absolute;
  top: 0;
  left: 0;
  filter: blur(2px);
  opacity: 0.8;
  transform: scale(1.05); /* 블러로 인한 가장자리 처리 */
}

.main-image {
  position: relative;
  z-index: 1;
}

.progressive-image.loaded .thumbnail {
  opacity: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  z-index: 2;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.error-text {
  font-size: 0.875rem;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .loading-spinner {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
  
  .error-icon {
    font-size: 1.5rem;
  }
  
  .error-text {
    font-size: 0.75rem;
  }
}

/* 다크 모드 지원 */
@media (prefers-color-scheme: dark) {
  .progressive-image {
    background: var(--color-bg-tertiary);
  }
}

/* 애니메이션 감소 설정 */
@media (prefers-reduced-motion: reduce) {
  .thumbnail,
  .main-image,
  .loading-spinner {
    transition: none;
    animation: none;
  }
}
</style>