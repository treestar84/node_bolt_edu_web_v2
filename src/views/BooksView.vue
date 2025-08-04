<template>
  <div class="books-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">그림책 읽기</h1>
          <p class="page-description">
            재미있는 그림책을 읽으며 새로운 이야기를 만나보세요
          </p>
        </div>


        <div v-if="(store.currentBooks?.length || 0) > 0" class="books-grid">
          <div 
            v-for="book in (store.currentBooks || [])" 
            :key="book.id"
            :ref="(el) => setBookRef(el as Element, book.id)"
            class="book-card fade-in"
          >
            <div class="book-cover" @click="openBook(book.id)">
              <!-- 커버 이미지가 있으면 즉시 표시 -->
              <img 
                v-if="book.coverImage" 
                :src="getImageUrl(book.coverImage)"
                :alt="book.title"
                style="width: 100%; height: 100%; object-fit: cover;"
              />
              
              <!-- 커버 이미지가 없지만 비디오가 있는 경우 -->
              <video 
                v-else-if="!book.coverImage && book.videoUrl"
                :src="getImageUrl(book.videoUrl)"
                :alt="book.title"
                style="width: 100%; height: 100%; object-fit: cover;"
                muted
                preload="metadata"
              />
              
              <!-- 커버 이미지도 비디오도 없으면 플레이스홀더 -->
              <div v-else class="no-cover-placeholder" style="background: #f5f5f5; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <span style="font-size: 3rem; margin-bottom: 8px;">📖</span>
                <p style="font-size: 1rem; font-weight: 600; text-align: center; margin: 0 0 4px 0; padding: 0 8px;">{{ book.title }}</p>
                <div style="font-size: 0.75rem; color: #999;">
                  썸네일 없음
                </div>
              </div>
              
              <div class="play-overlay">
                <span class="play-icon">📖</span>
                <span class="play-text">읽기</span>
              </div>
            </div>
            <div class="book-info">
              <div class="book-details" @click="openBook(book.id)">
                <h3 class="book-title">{{ book.title }}</h3>
                <div class="book-meta">
                  <span class="page-count">{{ book.pages.length }}장</span>
                </div>
              </div>
              <div class="book-actions" @click.stop>
                <LikeButton 
                  content-type="book" 
                  :content-id="book.id"
                  :show-count="true"
                  @liked="onBookLiked"
                />
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📖</div>
          <h3>아직 그림책이 없습니다</h3>
          <p>관리자 페이지에서 새로운 그림책을 추가해보세요</p>
          <router-link to="/admin" class="btn btn-primary">
            관리자 페이지로 이동
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Navigation from '@/components/Navigation.vue';
import LikeButton from '@/components/LikeButton.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useLazyLoading, useImageLoading } from '@/composables/useLazyLoading';
import type { Book } from '@/types';

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const router = useRouter();

// Lazy Loading 및 이미지 로딩 상태 관리
const { observeElement, isVisible, preloadVisible } = useLazyLoading();
const { 
  setLoadingState, 
  getLoadingState, 
  setLowQualityLoaded, 
  isLowQualityLoaded, 
  getLowQualityImageUrl,
  getThumbnailUrl 
} = useImageLoading();

// 책 요소 ref 설정 및 Intersection Observer 등록 (비디오만 해당)
const setBookRef = (element: Element | null, bookId: string) => {
  if (element) {
    const bookIndex = store.currentBooks.findIndex(book => book.id === bookId);
    const book = store.currentBooks[bookIndex];
    
    // 비디오 모드인 경우에만 Lazy Loading 적용
    if (book?.isVideoMode) {
      if (bookIndex < 2) {
        // 처음 2개 비디오는 즉시 표시
        preloadVisible(bookId);
      } else {
        // 나머지 비디오는 Intersection Observer로 관찰
        observeElement(element, bookId);
      }
    } else {
      // 이미지 모드는 항상 즉시 표시
      preloadVisible(bookId);
    }
  }
};

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};


const openBook = async (bookId: string) => {
  // 책 읽기 진행도 업데이트
  if (authStore.userProgress) {
    const newBooksRead = authStore.userProgress.booksRead + 1;
    
    await authStore.updateProgress({
      booksRead: newBooksRead
    });
    
    console.log('✅ Books read progress updated in Supabase:', { booksRead: newBooksRead });
    
    // 뱃지 확인
    const unlockedBadges = await contentStore.checkBadgeUnlocks();
    if (unlockedBadges.length > 0) {
      console.log('🏆 New book reading badge unlocked:', unlockedBadges[0].name);
    }
  }
  
  router.push(`/book/${bookId}`);
};

const onBookLiked = (isLiked: boolean) => {
  console.log(`Book ${isLiked ? 'liked' : 'unliked'}`);
};

// 비디오 제어 관련 함수들
const handleMouseEnter = async (book: Book) => {
  if (book.isVideoMode && book.videoUrl && isVisible(book.id) && getLoadingState(book.id) !== 'error') {
    const videoElement = document.querySelector(`[data-video-id="${book.id}"]`) as HTMLVideoElement;
    if (videoElement) {
      // 비디오가 아직 로드되지 않았다면 src 설정
      if (!videoElement.src || videoElement.src === '') {
        setLoadingState(book.id, 'loading');
        videoElement.src = getImageUrl(book.videoUrl || '');
        videoElement.load();
      }
      
      try {
        await videoElement.play();
        console.log(`✅ Video preview started for book: ${book.title}`);
      } catch (error) {
        console.log(`ℹ️ Video autoplay blocked for book: ${book.title}`, error);
      }
    }
  }
};

const handleMouseLeave = (book: Book) => {
  if (book.isVideoMode && book.videoUrl) {
    const videoElement = document.querySelector(`[data-video-id="${book.id}"]`) as HTMLVideoElement;
    if (videoElement) {
      videoElement.pause();
      videoElement.currentTime = 0; // 처음으로 되돌리기
      console.log(`⏸️ Video preview stopped for book: ${book.title}`);
    }
  }
};

const onVideoCanPlay = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  const bookId = video.getAttribute('data-video-id');
  if (bookId) {
    setLoadingState(bookId, 'loaded');
    console.log('📹 Video is ready to play:', video.src);
  }
};

const onVideoError = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  const bookId = video.getAttribute('data-video-id');
  if (bookId) {
    setLoadingState(bookId, 'error');
    console.error('❌ Video loading error for book:', bookId, video.src, event);
  }
};

// 터치 이벤트 처리 (모바일)
let touchTimer: NodeJS.Timeout | null = null;

const handleTouchStart = async (book: Book) => {
  // 터치 시작시 비디오 재생
  if (book.isVideoMode && book.videoUrl && isVisible(book.id) && getLoadingState(book.id) !== 'error') {
    touchTimer = setTimeout(async () => {
      const videoElement = document.querySelector(`[data-video-id="${book.id}"]`) as HTMLVideoElement;
      if (videoElement) {
        // 비디오가 아직 로드되지 않았다면 src 설정
        if (!videoElement.src || videoElement.src === '') {
          setLoadingState(book.id, 'loading');
          videoElement.src = getImageUrl(book.videoUrl || '');
          videoElement.load();
        }
        
        try {
          await videoElement.play();
          console.log(`✅ Video preview started (touch) for book: ${book.title}`);
        } catch (error) {
          console.log(`ℹ️ Video autoplay blocked (touch) for book: ${book.title}`, error);
        }
      }
    }, 300); // 300ms 후 재생 시작
  }
};

const handleTouchEnd = (book: Book) => {
  // 터치 종료시 타이머 클리어 및 비디오 정지
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }
  
  if (book.isVideoMode && book.videoUrl) {
    setTimeout(() => {
      const videoElement = document.querySelector(`[data-video-id="${book.id}"]`) as HTMLVideoElement;
      if (videoElement) {
        videoElement.pause();
        videoElement.currentTime = 0;
        console.log(`⏸️ Video preview stopped (touch) for book: ${book.title}`);
      }
    }, 1000); // 1초 후 정지
  }
};

onMounted(async () => {
  // 로그인 상태와 관계없이 모든 책을 로드
  await store.loadBooks();
});
</script>

<style scoped>
.books-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  padding: 40px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.page-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.book-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-shadow: var(--shadow-card);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.book-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  flex-shrink: 0;
}

.book-cover img,
.book-video,
.book-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
  background: var(--color-bg-secondary); /* 이미지 로딩 중 배경색 */
}

.book-video {
  background: var(--color-bg-secondary);
}

.no-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  text-align: center;
  padding: 20px;
}

.placeholder-icon {
  font-size: 3rem;
  margin-bottom: 10px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
}

.book-card:hover .book-cover img,
.book-card:hover .book-video,
.book-card:hover .book-thumbnail {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-primary);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-md);
}

.book-card:hover .play-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.05);
}

.video-overlay {
  background: rgba(0, 0, 0, 0.8);
}

.video-overlay .play-icon {
  font-size: 2.5rem;
}

.video-overlay .play-text {
  font-size: 1rem;
}

.play-icon {
  font-size: 2rem;
}

.play-text {
  color: var(--color-bg-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.book-info {
  padding: 20px 16px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  gap: 12px;
}

.book-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.book-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

.book-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  line-height: 1.3;
  word-break: break-word;
}

.book-meta {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.page-count {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

/* Responsive grid adjustments */
@media (max-width: 1200px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
}

/* Tablet styles */
@media (max-width: 1024px) {
  .main-content {
    padding: 20px 0 60px;
    min-height: calc(100vh - 80px);
  }
  
  .page-title {
    font-size: 2rem;
    margin-bottom: 12px;
  }
  
  .books-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
    max-width: 900px;
    margin: 0 auto;
    padding: 0 20px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .main-content {
    padding: 24px 0;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .page-description {
    font-size: 0.875rem;
  }
  
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .book-info {
    padding: 16px 12px 12px;
  }
  
  .book-title {
    font-size: 1.125rem;
  }
  
  .page-count {
    font-size: 0.7rem;
    padding: 3px 6px;
  }
  
  .play-overlay {
    opacity: 1;
    padding: 12px 16px;
  }
  
  .video-overlay {
    opacity: 0.8;
  }
  
  .play-icon {
    font-size: 1.5rem;
  }
  
  .play-text {
    font-size: 0.75rem;
  }
}

@media (max-width: 640px) {
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 20px 0;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .books-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .book-title {
    font-size: 1rem;
  }
  
  .book-info {
    padding: 12px 8px 8px;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .book-card:hover {
    transform: none;
  }
  
  .book-card:hover .book-cover img,
  .book-card:hover .book-video {
    transform: none;
  }
  
  .play-overlay {
    opacity: 1;
  }
  
  .video-overlay {
    opacity: 0.9;
  }
  
  .book-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}

/* Lazy Loading 및 Progressive Image Loading 스타일 */

/* 스켈레톤 로딩 */
.book-skeleton {
  width: 100%;
  height: 100%;
  position: relative;
  background: var(--color-bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.skeleton-cover {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.skeleton-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--color-text-muted);
}

.skeleton-icon {
  font-size: 2rem;
  opacity: 0.6;
}

.skeleton-text {
  font-size: 0.875rem;
  font-weight: 500;
  opacity: 0.8;
}

@keyframes skeleton-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Progressive Image Loading */
.progressive-image-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.blur-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(5px);
  transform: scale(1.1);
  transition: opacity 0.3s ease;
  z-index: 1;
}

.high-quality-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 2;
}

.high-quality-image.loaded {
  opacity: 1;
}

/* 로딩 인디케이터 */
.loading-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  padding: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid transparent;
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 비디오 스켈레톤 및 로딩 상태 */
.book-video {
  background: var(--color-bg-secondary);
  position: relative;
}

.book-video:not([src]) {
  background: linear-gradient(
    90deg,
    var(--color-bg-secondary) 0%,
    var(--color-bg-tertiary) 50%,
    var(--color-bg-secondary) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

/* 페이드인 애니메이션 (성능 최적화) */
.fade-in {
  opacity: 0;
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .skeleton-icon {
    font-size: 1.5rem;
  }
  
  .skeleton-text {
    font-size: 0.75rem;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
  }
  
  .loading-indicator {
    padding: 10px;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .book-card,
  .book-cover img,
  .play-overlay,
  .blur-placeholder,
  .high-quality-image,
  .fade-in {
    animation: none;
    transition: none;
  }
  
  .book-card:hover {
    transform: none;
  }
  
  .book-card:hover .book-cover img {
    transform: none;
  }
  
  .skeleton-cover {
    animation: none;
    background: var(--color-bg-tertiary);
  }
}
</style>