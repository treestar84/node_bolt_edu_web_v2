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

        <div v-if="store.currentBooks.length > 0" class="books-grid">
          <div 
            v-for="book in store.currentBooks" 
            :key="book.id"
            class="book-card fade-in"
          >
            <div class="book-cover" @click="openBook(book.id)">
              <img :src="getImageUrl(book.coverImage)" :alt="book.title" />
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

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const router = useRouter();

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

onMounted(async () => {
  // 로그인 상태와 관계없이 모든 책을 로드
  console.log('📖 BooksView: Loading all books...');
  await store.loadBooks();
  console.log('✅ BooksView: Books loaded:', store.currentBooks.length);
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

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.book-card:hover .book-cover img {
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

.play-icon {
  font-size: 2rem;
}

.play-text {
  color: var(--color-text-white);
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
  
  .book-card:hover .book-cover img {
    transform: none;
  }
  
  .play-overlay {
    opacity: 1;
  }
  
  .book-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .book-card,
  .book-cover img,
  .play-overlay {
    transition: none;
  }
  
  .book-card:hover {
    transform: none;
  }
  
  .book-card:hover .book-cover img {
    transform: none;
  }
}
</style>