<template>
  <div class="book-reader">
    <div class="reader-header">
      <div class="header-top-row">
        <button @click="goBack" class="btn btn-secondary">
          ← 뒤로가기
        </button>
        <div class="title-and-page-indicator">
          <h1 class="book-title">{{ book?.title }}</h1>
          <div class="page-indicator">
            {{ currentPageIndex + 1 }} / {{ book?.pages.length }}
          </div>
        </div>
      </div>
      <div class="header-bottom-row">
        <button
          @click="previousPage"
          :disabled="currentPageIndex === 0"
          class="btn btn-lg btn-secondary navigation-btn"
        >
          ← 이전
        </button>
        <button
          @click="nextPage"
          :disabled="currentPageIndex === book.pages.length - 1"
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
      <div class="book-container">
        <div class="book-page">
          <div class="page-image">
            <template v-if="currentPage && currentPage.imageUrl">
              <img :src="store.getImageUrl(currentPage.imageUrl)" :alt="`페이지 ${currentPageIndex + 1}`" />
            </template>
            <template v-else>
              <div class="missing-media">이미지가 없습니다</div>
            </template>
            <div class="page-text" v-if="currentPage?.textContent">
              {{ currentPage.textContent }}
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
            </div>
          </div>
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
import { useFileUpload } from '@/composables/useFileUpload';

const route = useRoute();
const router = useRouter();
const store = useAppStore();
const { isPlaying, playAudio, stopAudio } = useAudio();
const { getUploadedFileUrl } = useFileUpload();

const currentPageIndex = ref(0);
const autoPlayEnabled = ref(true);


const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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
    stopAudio();
    currentPageIndex.value--;
  }
};

const nextPage = () => {
  if (book.value && currentPageIndex.value < book.value.pages.length - 1) {
    stopAudio();
    currentPageIndex.value++;
  }
};

const goToPage = (index: number) => {
  stopAudio();
  currentPageIndex.value = index;
};

const onImageError = (event: Event) => {
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
          nextPage();
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
.autoplay-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay-content {
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  text-align: center;
}

.overlay-content h2 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
}

.overlay-content p {
  margin-bottom: var(--spacing-lg);
}

.book-reader {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  display: flex;
  flex-direction: column;
}

.reader-header {
  display: flex;
  flex-direction: column; /* Stack rows vertically */
  align-items: center; /* Center content horizontally */
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
  gap: var(--spacing-md); /* Gap between rows */
}

.header-top-row,
.header-bottom-row {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between; /* Distribute items */
  gap: var(--spacing-md);
}

.header-top-row {
  margin-bottom: var(--spacing-sm); /* Space between top and bottom row */
}

.reader-header .btn {
  flex-shrink: 0; /* Prevent buttons from shrinking */
}

.title-and-page-indicator {
  flex: 1; /* Allow this section to take available space */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  margin: 0 var(--spacing-lg); /* Add horizontal margin */
}

.book-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  /* text-align: center; */
  /* flex: 1; */
  margin: 0; /* Remove margin as it's handled by parent */
}

.page-indicator {
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  background: var(--color-bg-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  margin-top: var(--spacing-xs); /* Space between title and page indicator */
}

.reader-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-xl);
  gap: var(--spacing-2xl);
}

.book-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 800px;
  width: 100%;
}

.book-page {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  width: 100%;
  max-width: 600px;
}

.page-image {
  position: relative;
  width: 100%;
  height: 500px;
}

@media (max-width: 768px) {
  .page-image {
    height: 350px;
  }
}

@media (max-width: 480px) {
  .page-image {
    height: 250px;
  }
}

.page-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.page-text {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: var(--spacing-xl) var(--spacing-lg) var(--spacing-lg);
  font-size: 1.25rem;
  font-weight: 500;
  text-align: center;
  line-height: 1.4;
}

.page-controls {
  padding: var(--spacing-xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.audio-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  margin: 0 auto;
}

.audio-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.audio-button.playing {
  animation: pulse 1s infinite;
}

.audio-icon {
  font-size: 1.5rem;
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
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}



.auto-play-progress {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  min-width: 250px;
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.05s linear;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

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

@media (max-width: 768px) {
  .reader-header {
    padding: var(--spacing-md);
    gap: var(--spacing-sm); /* Adjust gap between rows */
  }

  .header-top-row {
    flex-wrap: wrap; /* Allow items to wrap */
    justify-content: center; /* Center items when wrapped */
    gap: var(--spacing-sm);
  }

  .header-top-row .btn {
    flex-grow: 1; /* Allow back button to grow */
  }

  .title-and-page-indicator {
    order: -1; /* Move title and page indicator to the top */
    width: 100%; /* Take full width */
    margin: 0; /* Remove horizontal margin */
  }

  .header-bottom-row {
    flex-wrap: wrap; /* Allow buttons to wrap */
    justify-content: center; /* Center buttons */
    gap: var(--spacing-sm);
  }

  .header-bottom-row .navigation-btn {
    flex-grow: 1; /* Allow navigation buttons to grow */
  }
  
  .book-title {
    font-size: 1.25rem;
  }
  
  .reader-content {
    padding: var(--spacing-md);
    gap: var(--spacing-lg);
  }
  
  .page-image {
    height: auto;
    aspect-ratio: 4 / 3;
  }
  
  .page-text {
    font-size: 1.125rem;
    padding: var(--spacing-lg) var(--spacing-md) var(--spacing-md);
  }
  
  .audio-button {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 1rem;
  }
  
  .auto-play-progress {
    bottom: var(--spacing-md);
    left: var(--spacing-md);
    right: var(--spacing-md);
    transform: none;
    min-width: auto;
  }
}
</style>