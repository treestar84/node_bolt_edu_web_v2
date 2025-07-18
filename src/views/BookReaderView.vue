<template>
  <div class="book-reader">
    <!-- Mobile optimized header -->
    <div class="reader-header">
      <div class="header-content">
        <button @click="goBack" class="btn btn-secondary back-btn">
          ← 뒤로가기
        </button>
        <div class="title-section">
          <h1 class="book-title">{{ book?.title }}</h1>
          <div class="page-indicator">
            {{ currentPageIndex + 1 }} / {{ book?.pages?.length }}
          </div>
        </div>
      </div>
      
      <!-- Navigation buttons (hidden on mobile, shown on desktop) -->
      <div class="desktop-nav">
        <button
          @click="previousPage"
          :disabled="currentPageIndex === 0"
          class="btn btn-lg btn-secondary navigation-btn"
        >
          ← 이전
        </button>
        <button
          @click="nextPage"
          :disabled="currentPageIndex === (book?.pages?.length ?? 0) - 1"
          class="btn btn-lg btn-secondary navigation-btn"
        >
          다음 →
        </button>
      </div>
    </div>

    <div v-if="!book">
      <div class="book-not-found">
        <div class="error-icon">📖</div>
        <h2>책을 찾을 수 없습니다</h2>
        <p>요청하신 그림책이 존재하지 않거나, 데이터가 로드되지 않았습니다.</p>
        <router-link to="/books" class="btn btn-primary">
          그림책 목록으로 돌아가기
        </router-link>
      </div>
    </div>
    <div v-else-if="!book.pages || book.pages.length === 0">
      <div class="book-not-found">
        <div class="error-icon">📖</div>
        <h2>책 페이지가 없습니다</h2>
        <p>이 책에 등록된 페이지가 없습니다. 관리자에게 문의하세요.</p>
        <router-link to="/books" class="btn btn-primary">
          그림책 목록으로 돌아가기
        </router-link>
      </div>
    </div>
    <div v-else class="reader-content">
      <!-- Swipeable book container -->
      <div 
        class="book-container"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <div class="book-page" :class="{ 'page-transitioning': pageTransitioning }">
          <div class="page-image">
            <template v-if="currentPage && currentPage.imageUrl">
              <img 
                :src="store.getImageUrl(currentPage.imageUrl)" 
                :alt="`페이지 ${currentPageIndex + 1}`"
                @load="handleImageLoad"
                @error="handleImageError"
              />
            </template>
            <template v-else>
              <div class="missing-media">이미지가 없습니다</div>
            </template>
            
            <!-- Page text overlay -->
            <div class="page-text" v-if="currentPage?.textContent">
              {{ currentPage.textContent }}
            </div>
            
            <!-- Touch indicators -->
            <div class="touch-indicators">
              <div 
                class="touch-zone touch-zone-left"
                @click="previousPage"
                v-if="currentPageIndex > 0"
              >
                <span class="touch-hint">←</span>
              </div>
              <div 
                class="touch-zone touch-zone-right"
                @click="nextPage"
                v-if="currentPageIndex < book.pages.length - 1"
              >
                <span class="touch-hint">→</span>
              </div>
            </div>
          </div>
          
          <div class="page-controls">
            <button 
              @click="playPageAudio" 
              class="audio-button"
              :class="{ playing: isPlaying }"
              :disabled="!currentPage || !currentPage.audioUrl"
            >
              <span class="audio-icon">{{ isPlaying ? '🔊' : '🔈' }}</span>
              <span>음성 듣기</span>
            </button>
            <template v-if="!currentPage || !currentPage.audioUrl">
              <div class="missing-media">오디오가 없습니다</div>
            </template>
            
            <div class="auto-play-controls">
              <label class="auto-play-toggle">
                <input 
                  type="checkbox" 
                  v-model="autoPlayEnabled"
                  @change="toggleAutoPlay"
                />
                <span class="toggle-text">자동 넘김</span>
              </label>
              
              <div v-if="autoPlayEnabled" class="delay-settings">
                <label class="delay-label">넘김 딜레이:</label>
                <select v-model="autoAdvanceDelay" class="delay-select">
                  <option :value="500">0.5초</option>
                  <option :value="1000">1초</option>
                  <option :value="1500">1.5초</option>
                  <option :value="2000">2초</option>
                  <option :value="3000">3초</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Mobile navigation buttons -->
      <div class="mobile-nav">
        <button
          @click="previousPage"
          :disabled="currentPageIndex === 0"
          class="btn btn-lg btn-secondary nav-btn"
        >
          ← 이전
        </button>
        <button
          @click="nextPage"
          :disabled="currentPageIndex === book.pages.length - 1"
          class="btn btn-lg btn-secondary nav-btn"
        >
          다음 →
        </button>
      </div>
      
      <!-- Progress bar -->
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill"
            :style="{ width: `${((currentPageIndex + 1) / book.pages.length) * 100}%` }"
          ></div>
        </div>
        <div class="progress-text">
          {{ currentPageIndex + 1 }} / {{ book.pages.length }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';
import { useAudio } from '@/composables/useAudio';

const route = useRoute();
const router = useRouter();
const store = useAppStore();
const { isPlaying, playAudio, stopAudio } = useAudio();

const currentPageIndex = ref(0);
const autoPlayEnabled = ref(true);
const pageTransitioning = ref(false);
const autoAdvanceDelay = ref(1500); // 기본 1.5초 딜레이

// Touch handling
const touchStart = ref({ x: 0, y: 0 });
const touchEnd = ref({ x: 0, y: 0 });
const swipeThreshold = 50;

const book = computed(() => {
  const bookId = route.params.id as string;
  return store.currentBooks.find(b => b.id === bookId);
});

const currentPage = computed(() => {
  if (!book.value) return null;
  return book.value.pages[currentPageIndex.value];
});

const goBack = () => {
  router.push('/books');
};

const previousPage = () => {
  if (currentPageIndex.value > 0) {
    pageTransitioning.value = true;
    stopAudio();
    currentPageIndex.value--;
    setTimeout(() => {
      pageTransitioning.value = false;
    }, 300);
  }
};

const nextPage = () => {
  if (book.value && currentPageIndex.value < book.value.pages.length - 1) {
    pageTransitioning.value = true;
    stopAudio();
    currentPageIndex.value++;
    setTimeout(() => {
      pageTransitioning.value = false;
    }, 300);
  }
};

// Touch event handlers
const handleTouchStart = (event: TouchEvent) => {
  touchStart.value = {
    x: event.touches[0].clientX,
    y: event.touches[0].clientY
  };
};

const handleTouchMove = (event: TouchEvent) => {
  // Prevent default scrolling during horizontal swipes
  const deltaX = Math.abs(event.touches[0].clientX - touchStart.value.x);
  const deltaY = Math.abs(event.touches[0].clientY - touchStart.value.y);
  
  if (deltaX > deltaY) {
    event.preventDefault();
  }
};

const handleTouchEnd = (event: TouchEvent) => {
  touchEnd.value = {
    x: event.changedTouches[0].clientX,
    y: event.changedTouches[0].clientY
  };
  
  const deltaX = touchEnd.value.x - touchStart.value.x;
  const deltaY = touchEnd.value.y - touchStart.value.y;
  
  // Only handle horizontal swipes
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold) {
    if (deltaX > 0) {
      // Swipe right - previous page
      previousPage();
    } else {
      // Swipe left - next page
      nextPage();
    }
  }
};

const handleImageLoad = () => {
  // Image loaded successfully
};

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement;
  target.style.display = 'none';
  // You can also replace it with a placeholder image
  // target.src = '/path/to/placeholder.png';
};

const playPageAudio = async () => {
  stopAudio(); // Stop any currently playing audio first
  if (currentPage.value && currentPage.value.audioUrl) {
    try {
      const audioUrl = store.getImageUrl(currentPage.value.audioUrl);
      if (!audioUrl) return;

      const onEnded = () => {
        if (autoPlayEnabled.value) {
          // 오디오 재생 완료 후 설정된 딜레이 적용
          setTimeout(() => {
            nextPage();
          }, autoAdvanceDelay.value);
        }
      };

      await playAudio(audioUrl, { onEnded });

    } catch (error) {
      console.warn('Audio playback failed:', error);
      // If audio fails, and auto-play is on, still try to advance after a short delay
      if (autoPlayEnabled.value) {
        setTimeout(() => {
          nextPage();
        }, 2000); // Fallback delay
      }
    }
  } else {
    // 오디오가 없는 경우에도 자동 넘김이 활성화되어 있으면 적절한 시간 후 넘김
    if (autoPlayEnabled.value) {
      setTimeout(() => {
        nextPage();
      }, 3000); // 3초 딜레이 (텍스트 읽기 시간 고려)
    }
  }
};

const toggleAutoPlay = () => {
  // Now this function does nothing, but we keep it if you want to add logic later.
  // For example, you might want to save the user's preference.
};

// Watch for page changes to play audio automatically
watch(currentPageIndex, (newIndex, oldIndex) => {
  if (newIndex !== oldIndex) {
    // A small delay can help ensure a smoother transition and that the new page is rendered.
    setTimeout(() => {
      playPageAudio();
    }, 100);
  }
});

onMounted(async () => {
  // Load books if they aren't already in the store
  if (store.currentBooks.length === 0) {
    await store.loadBooks();
  }
  // Play audio for the initial page
  setTimeout(() => {
    playPageAudio();
  }, 500); // A slightly longer delay on initial load might be needed
});

onUnmounted(() => {
  stopAudio(); // Ensure audio stops when the component is left
});
</script>

<style scoped>
.book-reader {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  display: flex;
  flex-direction: column;
}

/* Mobile-first header design */
.reader-header {
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
  padding: var(--spacing-md);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.back-btn {
  flex-shrink: 0;
}

.title-section {
  flex: 1;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.book-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
  word-break: break-word;
}

.page-indicator {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  background: var(--color-bg-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  display: inline-block;
}

/* Desktop navigation (hidden on mobile) */
.desktop-nav {
  display: none;
  justify-content: center;
  gap: var(--spacing-md);
}

.reader-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  gap: var(--spacing-lg);
}

.book-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  position: relative;
  touch-action: pan-y;
}

.book-page {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 600px;
  transition: transform 0.3s ease;
}

.book-page.page-transitioning {
  transform: scale(0.95);
}

.page-image {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 75%; /* 4:3 aspect ratio */
  overflow: hidden;
}

.page-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.missing-media {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--color-text-muted);
  font-size: 1rem;
  text-align: center;
}

.page-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: var(--spacing-lg) var(--spacing-md) var(--spacing-md);
  font-size: 1.125rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.4;
}

/* Touch indicators for swipe navigation */
.touch-indicators {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  pointer-events: none;
}

.touch-zone {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
}

.touch-zone-left {
  justify-content: flex-start;
  padding-left: var(--spacing-md);
}

.touch-zone-right {
  justify-content: flex-end;
  padding-right: var(--spacing-md);
}

.touch-hint {
  background: rgba(0, 0, 0, 0.5);
  color: white;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 1.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.touch-zone:hover .touch-hint {
  opacity: 1;
}

.page-controls {
  padding: var(--spacing-lg);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.audio-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  margin: 0 auto;
  min-height: 44px;
}

.audio-button:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.audio-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.audio-button.playing {
  animation: pulse 1s infinite;
}

.audio-icon {
  font-size: 1.25rem;
}

.auto-play-controls {
  display: flex;
  justify-content: center;
}

.auto-play-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.auto-play-toggle input[type="checkbox"] {
  width: 18px;
  height: 18px;
  accent-color: var(--color-primary);
}

.delay-settings {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  font-size: 0.875rem;
}

.delay-label {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.delay-select {
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  min-width: 80px;
}

.delay-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

/* Mobile navigation buttons */
.mobile-nav {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
}

.nav-btn {
  flex: 1;
  max-width: 150px;
  min-height: 44px;
}

/* Progress container */
.progress-container {
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  margin-top: auto;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--color-bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  text-align: center;
  font-weight: 500;
}

/* Error states */
.book-not-found {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--spacing-3xl);
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.book-not-found h2 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.book-not-found p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  font-size: 1.125rem;
}

/* Animations */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Tablet optimizations */
@media (min-width: 768px) and (max-width: 1024px) {
  .book-title {
    font-size: 1.5rem;
  }
  
  .page-image {
    padding-bottom: 60%; /* 5:3 aspect ratio */
  }
  
  .page-text {
    font-size: 1.25rem;
    padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-lg);
  }
  
  .audio-button {
    font-size: 1.125rem;
    padding: var(--spacing-lg) var(--spacing-xl);
  }
  
  .mobile-nav {
    gap: var(--spacing-lg);
  }
  
  .nav-btn {
    max-width: 200px;
  }
  
  .delay-settings {
    flex-direction: row;
    justify-content: center;
  }
}

/* Desktop optimizations */
@media (min-width: 1024px) {
  .reader-header {
    padding: var(--spacing-lg) var(--spacing-xl);
  }
  
  .header-content {
    margin-bottom: var(--spacing-lg);
  }
  
  .desktop-nav {
    display: flex;
  }
  
  .mobile-nav {
    display: none;
  }
  
  .book-title {
    font-size: 1.75rem;
  }
  
  .page-indicator {
    font-size: 1rem;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .reader-content {
    padding: var(--spacing-xl);
    gap: var(--spacing-2xl);
  }
  
  .book-container {
    max-width: 800px;
    margin: 0 auto;
  }
  
  .book-page {
    max-width: 700px;
  }
  
  .page-image {
    padding-bottom: 50%; /* 2:1 aspect ratio */
  }
  
  .page-text {
    font-size: 1.5rem;
    padding: var(--spacing-2xl) var(--spacing-xl) var(--spacing-xl);
  }
  
  .audio-button {
    font-size: 1.25rem;
    padding: var(--spacing-lg) var(--spacing-2xl);
  }
  
  .audio-icon {
    font-size: 1.5rem;
  }
  
  .touch-zone:hover .touch-hint {
    opacity: 0.8;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .audio-button:hover {
    transform: none;
  }
  
  .touch-hint {
    opacity: 0.3;
  }
  
  .touch-zone:active .touch-hint {
    opacity: 0.8;
  }
  
  .book-page:active {
    transform: scale(0.98);
  }
  
  .delay-settings {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-xs);
    margin-top: var(--spacing-md);
  }
  
  .delay-select {
    width: 100%;
    min-width: auto;
    padding: var(--spacing-sm);
    font-size: 1rem;
    min-height: 44px;
  }
}

/* Reduce animations for users who prefer reduced motion */
@media (prefers-reduced-motion: reduce) {
  .book-page,
  .audio-button,
  .progress-fill,
  .touch-hint {
    transition: none;
  }
  
  .audio-button.playing {
    animation: none;
  }
  
  .book-page.page-transitioning {
    transform: none;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .page-text {
    background: rgba(0, 0, 0, 0.9);
  }
  
  .touch-hint {
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid white;
  }
}
</style>