<template>
  <div class="favorites-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">즐겨찾기</h1>
          <p class="page-description">
            좋아하는 단어와 그림책을 모아보세요
          </p>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>즐겨찾기를 불러오는 중...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h3>오류가 발생했습니다</h3>
          <p>{{ error }}</p>
          <button @click="loadFavorites" class="btn btn-primary">다시 시도</button>
        </div>

        <div v-else class="favorites-content">
          <!-- 즐겨찾기 단어 섹션 -->
          <section class="favorites-section">
            <h2 class="section-title">
              <span class="section-icon">📚</span>
              즐겨찾기 단어
              <span class="section-count">({{ favoriteWordItems.length }}개)</span>
            </h2>

            <div v-if="favoriteWordItems.length > 0" class="words-grid">
              <WordCard
                v-for="word in favoriteWordItems"
                :key="word.id"
                :word="word"
                @audio-played="onAudioPlayed"
              />
            </div>

            <div v-else class="empty-section">
              <div class="empty-icon">📖</div>
              <h3>즐겨찾기한 단어가 없습니다</h3>
              <p>단어 학습 페이지에서 좋아하는 단어를 즐겨찾기에 추가해보세요.</p>
              <router-link to="/words" class="btn btn-primary">단어 학습하러 가기</router-link>
            </div>
          </section>

          <!-- 즐겨찾기 책 섹션 -->
          <section class="favorites-section">
            <h2 class="section-title">
              <span class="section-icon">📚</span>
              즐겨찾기 책
              <span class="section-count">({{ favoriteBookItems.length }}개)</span>
            </h2>

            <div v-if="favoriteBookItems.length > 0" class="books-grid">
              <div
                v-for="book in favoriteBookItems"
                :key="book.id"
                class="book-card"
                @click="openBook(book.id)"
              >
                <div class="book-cover">
                  <img :src="getImageUrl(book.coverImage)" :alt="book.title" />
                  <div class="play-overlay">
                    <span class="play-icon">📖</span>
                    <span class="play-text">읽기</span>
                  </div>
                </div>
                <div class="book-info">
                  <div class="book-details">
                    <h3 class="book-title">{{ book.title }}</h3>
                    <div class="book-meta">
                      <span class="page-count">{{ book.pages.length }}장</span>
                    </div>
                  </div>
                  <div class="book-actions">
                    <FavoriteButton 
                      content-type="book" 
                      :content-id="book.id"
                      @favorited="onBookFavorited"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="empty-section">
              <div class="empty-icon">📚</div>
              <h3>즐겨찾기한 책이 없습니다</h3>
              <p>그림책 페이지에서 좋아하는 책을 즐겨찾기에 추가해보세요.</p>
              <router-link to="/books" class="btn btn-primary">그림책 보러 가기</router-link>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import Navigation from '@/components/Navigation.vue';
import WordCard from '@/components/WordCard.vue';
import FavoriteButton from '@/components/FavoriteButton.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useFavorites } from '@/composables/useFavorites';
import { useFileUpload } from '@/composables/useFileUpload';

const router = useRouter();
const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const { getUploadedFileUrl } = useFileUpload();

const {
  favorites,
  favoriteWords,
  favoriteBooks,
  isLoading,
  error,
  loadFavorites
} = useFavorites();

// 즐겨찾기 ID에 해당하는 실제 데이터 가져오기
const favoriteWordItems = computed(() => {
  return favoriteWords.value
    .map(fav => store.currentWords.find(word => word.id === fav.contentId))
    .filter(Boolean);
});

const favoriteBookItems = computed(() => {
  return favoriteBooks.value
    .map(fav => store.currentBooks.find(book => book.id === fav.contentId))
    .filter(Boolean);
});

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const onAudioPlayed = () => {
  console.log('Audio played in favorites');
};

const onBookFavorited = (isFavorited: boolean) => {
  console.log(`Book ${isFavorited ? 'added to' : 'removed from'} favorites`);
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

onMounted(async () => {
  console.log('🔄 FavoritesView: Loading data...');
  
  // 먼저 콘텐츠 데이터 로드
  await Promise.all([
    store.loadWords(),
    store.loadBooks()
  ]);
  
  // 그 다음 즐겨찾기 데이터 로드
  await loadFavorites();
  
  console.log('✅ FavoritesView: Data loaded');
});
</script>

<style scoped>
.favorites-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.main-content {
  padding: var(--spacing-xl) 0;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-3xl);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--spacing-3xl);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-lg);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.favorites-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3xl);
}

.favorites-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xl);
}

.section-icon {
  font-size: 2rem;
}

.section-count {
  font-size: 1rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.book-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--color-border-light);
}

.book-cover {
  position: relative;
  width: 100%;
  height: 300px;
  overflow: hidden;
}

.book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.book-card:hover .book-cover img {
  transform: scale(1.05);
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg) var(--spacing-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.book-card:hover .play-overlay {
  opacity: 1;
}

.play-icon {
  font-size: 2rem;
}

.play-text {
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
}

.book-info {
  padding: var(--spacing-xl);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.book-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.book-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: var(--spacing-md);
}

.book-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  line-height: 1.3;
}

.book-meta {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.page-count {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
}

.empty-section {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-section h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.empty-section p {
  margin-bottom: var(--spacing-xl);
  font-size: 1.125rem;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .words-grid,
  .books-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .favorites-section {
    padding: var(--spacing-lg);
  }
  
  .section-title {
    font-size: 1.5rem;
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }
  
  .page-title {
    font-size: 2rem;
  }
}
</style>