<template>
  <div class="likes-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">{{ $t('likes.title') }}</h1>
          <p class="page-description">
            {{ $t('likes.description') }}
          </p>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>{{ $t('likes.loading') }}</p>
        </div>

        <div v-else-if="error" class="error-state">
          <div class="error-icon">❌</div>
          <h3>{{ $t('likes.error') }}</h3>
          <p>{{ error }}</p>
          <button @click="loadData" class="btn btn-primary">{{ $t('likes.retry') }}</button>
        </div>

        <div v-else class="likes-content">
          <!-- 탭 네비게이션 -->
          <div class="tab-navigation">
            <button 
              @click="activeTab = 'my-likes'"
              :class="['tab-btn', { active: activeTab === 'my-likes' }]"
            >
              {{ $t('likes.myLikes') }}
            </button>
            <button 
              @click="activeTab = 'ranking'"
              :class="['tab-btn', { active: activeTab === 'ranking' }]"
            >
              {{ $t('likes.ranking') }}
            </button>
          </div>

          <!-- 내 좋아요 탭 -->
          <div v-if="activeTab === 'my-likes'" class="my-likes-tab">
            <!-- 즐겨찾기 단어 섹션 -->
            <section class="likes-section">
              <h2 class="section-title">
                <span class="section-icon">📚</span>
                {{ $t('likes.contentType.words') }}
                <span class="section-count">({{ likedWordItems.length }}개)</span>
              </h2>

              <div v-if="likedWordPairs.length > 0" class="words-grid">
                <template v-for="pair in likedWordPairs" :key="pair.like.contentId">
                  <WordCard
                    v-if="pair.word"
                    :word="pair.word"
                    @audio-played="onAudioPlayed"
                  />
                  <div v-else class="word-card deleted-word">
                    <div class="card-content">
                      <h3 class="word-name">삭제된 단어입니다</h3>
                      <div class="word-id">ID: {{ pair.like.contentId }}</div>
                      <div class="word-date">{{ new Date(pair.like.createdAt).toLocaleDateString() }}</div>
                      <div class="card-actions">
                        <LikeButton 
                          content-type="word" 
                          :content-id="pair.like.contentId"
                          :show-count="true"
                          @liked="onLiked"
                        />
                      </div>
                    </div>
                  </div>
                </template>
              </div>

              <div v-else class="empty-section">
                <div class="empty-icon">📖</div>
                <h3>{{ $t('likes.noLikes') }}</h3>
                <p>단어 학습 페이지에서 좋아하는 단어에 좋아요를 눌러보세요.</p>
                <router-link to="/words" class="btn btn-primary">단어 학습하러 가기</router-link>
              </div>
            </section>

            <!-- 좋아요한 책 섹션 -->
            <section class="likes-section">
              <h2 class="section-title">
                <span class="section-icon">📚</span>
                {{ $t('likes.contentType.books') }}
                <span class="section-count">({{ likedBookItems.length }}개)</span>
              </h2>

              <div v-if="likedBookItems.length > 0" class="books-grid">
                <div
                  v-for="book in likedBookItems"
                  :key="book?.id"
                  class="book-card"
                  @click="book?.id && openBook(book.id)"
                >
                  <div class="book-cover">
                    <img :src="getImageUrl(book?.coverImage || '')" :alt="book?.title || ''" />
                    <div class="play-overlay">
                      <span class="play-icon">📖</span>
                      <span class="play-text">읽기</span>
                    </div>
                  </div>
                  <div class="book-info">
                    <div class="book-details">
                      <h3 class="book-title">{{ book?.title || '' }}</h3>
                      <div class="book-meta">
                        <span class="page-count">{{ book?.pages?.length || 0 }}장</span>
                      </div>
                    </div>
                    <div class="book-actions">
                      <LikeButton 
                        content-type="book" 
                        :content-id="book?.id || ''"
                        :show-count="true"
                        @liked="onBookLiked"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="empty-section">
                <div class="empty-icon">📚</div>
                <h3>{{ $t('likes.noLikes') }}</h3>
                <p>그림책 페이지에서 좋아하는 책에 좋아요를 눌러보세요.</p>
                <router-link to="/books" class="btn btn-primary">그림책 보러 가기</router-link>
              </div>
            </section>
          </div>

          <!-- 랭킹 탭 -->
          <div v-if="activeTab === 'ranking'" class="ranking-tab">
            <!-- 기간 선택 -->
            <div class="period-selector">
              <button
                v-for="period in periods"
                :key="period.value"
                @click="selectedPeriod = period.value"
                :class="['period-btn', { active: selectedPeriod === period.value }]"
              >
                {{ period.label }}
              </button>
            </div>

            <!-- 콘텐츠 타입 선택 -->
            <div class="content-type-selector">
              <button
                v-for="type in contentTypes"
                :key="type.value"
                @click="selectedContentType = type.value"
                :class="['type-btn', { active: selectedContentType === type.value }]"
              >
                {{ type.label }}
              </button>
            </div>

            <!-- 랭킹 목록 -->
            <div class="ranking-list">
              <h3 class="ranking-title">
                {{ getRankingTitle() }}
              </h3>

              <div v-if="rankingWordPairs.length > 0" class="ranking-items">
                <div
                  v-for="(pair, index) in rankingWordPairs"
                  :key="'rank-' + pair.item.contentId"
                  class="ranking-item"
                >
                  <div class="rank-number">
                    <span class="rank">{{ index + 1 }}{{ $t('likes.rank').replace('{rank}', '') }}</span>
                  </div>
                  <div class="content-info">
                    <template v-if="selectedContentType === 'word' && !pair.word">
                      <div class="content-fallback deleted-word">삭제된 단어입니다<br/>ID: {{ pair.item.contentId }}</div>
                    </template>
                    <template v-else>
                      <div class="content-preview">
                        <img 
                          v-if="pair.word && (pair.word as any).imageUrl"
                          :src="getImageUrl((pair.word as any).imageUrl)"
                          :alt="(pair.word as any).name"
                          class="content-image"
                        />
                        <img
                          v-else-if="pair.book && (pair.book as any).coverImage"
                          :src="getImageUrl((pair.book as any).coverImage)"
                          :alt="(pair.book as any).title"
                          class="content-image"
                        />
                        <div class="content-fallback" v-else>
                          {{ getContentTypeIcon(selectedContentType) }}
                        </div>
                      </div>
                      <div class="content-details">
                        <h4 class="content-title">
                          {{ pair.word ? pair.word.name : (pair.book ? pair.book.title : '알 수 없음') }}
                        </h4>
                        <p class="content-meta">
                          {{ $t('likes.contentType.' + selectedContentType) }}
                        </p>
                      </div>
                    </template>
                  </div>
                  <div class="like-stats">
                    <span class="like-count">
                      ❤️ {{ $t('likes.likeCount').replace('{count}', pair.item.likeCount.toString()) }}
                    </span>
                  </div>
                </div>
              </div>

              <div v-else class="empty-ranking">
                <div class="empty-icon">📊</div>
                <h3>{{ $t('likes.emptyRanking') }}</h3>
                <p>아직 {{ selectedPeriod === 'all' ? '전체' : selectedPeriod === 'monthly' ? '이번 달' : '이번 주' }} 랭킹 데이터가 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import Navigation from '@/components/Navigation.vue';
import WordCard from '@/components/WordCard.vue';
import LikeButton from '@/components/LikeButton.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useLikes } from '@/composables/useLikes';
import type { ContentType, LikePeriod } from '@/types';
import type { WordItem, Book } from '@/types';

const router = useRouter();
const { t } = useI18n();
const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();

const {
  ranking,
  isLoading,
  error,
  loadLikes,
  loadRanking,
  likedWords,
  likedBooks
} = useLikes();

const activeTab = ref<'my-likes' | 'ranking'>('my-likes');
const selectedPeriod = ref<LikePeriod>('all');
const selectedContentType = ref<ContentType>('word');

const periods = [
  { value: 'all' as LikePeriod, label: t('likes.period.all') },
  { value: 'monthly' as LikePeriod, label: t('likes.period.monthly') },
  { value: 'weekly' as LikePeriod, label: t('likes.period.weekly') }
];

const contentTypes = [
  { value: 'word' as ContentType, label: t('likes.contentType.words') },
  { value: 'book' as ContentType, label: t('likes.contentType.books') },
  { value: 'quiz' as ContentType, label: t('likes.contentType.quiz') },
  { value: 'puzzle' as ContentType, label: t('likes.contentType.puzzle') }
];

// 좋아요 ID에 해당하는 실제 데이터 가져오기
const likedWordItems = computed(() => {
  return likedWords.value
    .map(like => store.currentWords.find(word => word.id === like.contentId))
    .filter(Boolean);
});

const likedBookItems = computed(() => {
  return likedBooks.value
    .map(like => store.currentBooks.find(book => book.id === like.contentId))
    .filter(Boolean);
});

const likedWordPairs = computed(() =>
  likedWords.value.map(like => ({
    like,
    word: store.currentWords.find(word => word.id === like.contentId)
  }))
);

const rankingWordPairs = computed(() =>
  ranking.value.map(item => {
    const word = store.currentWords.find(word => word.id === item.contentId);
    const book = store.currentBooks.find(book => book.id === item.contentId);
    return {
      item,
      word: word ? (word as WordItem) : null,
      book: book ? (book as Book) : null
    };
  })
);

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const getContentTypeIcon = (type: ContentType): string => {
  const icons = {
    word: '📖',
    book: '📚',
    quiz: '🧩',
    puzzle: '🧩'
  };
  return icons[type] || '📄';
};

const getRankingTitle = (): string => {
  const periodLabel = periods.find(p => p.value === selectedPeriod.value)?.label || '';
  const typeLabel = contentTypes.find(t => t.value === selectedContentType.value)?.label || '';
  return `${periodLabel} ${typeLabel} ${t('likes.ranking')}`;
};

const onAudioPlayed = () => {
  console.log('Audio played in likes');
};

const onLiked = (isLiked: boolean) => {
  console.log('Like toggled:', isLiked);
};

const onBookLiked = (isLiked: boolean) => {
  console.log(`Book ${isLiked ? 'liked' : 'unliked'}`);
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

const loadData = async () => {
  console.log('🔄 LikesView: Loading data...');
  
  // 먼저 콘텐츠 데이터 로드
  await Promise.all([
    store.loadWords(),
    store.loadBooks()
  ]);
  
  // 인증된 사용자라면 좋아요 데이터 로드
  if (authStore.isAuthenticated) {
    await loadLikes();
  }
  
  // 랭킹 데이터 로드
  await loadRanking(selectedContentType.value, selectedPeriod.value);
  
  console.log('✅ LikesView: Data loaded');
};

// 선택된 기간이나 콘텐츠 타입이 변경될 때 랭킹 다시 로드
watch([selectedPeriod, selectedContentType], async () => {
  if (activeTab.value === 'ranking') {
    await loadRanking(selectedContentType.value, selectedPeriod.value);
  }
});

// 탭이 랭킹으로 변경될 때 랭킹 데이터 로드
watch(activeTab, async (newTab) => {
  if (newTab === 'ranking') {
    await loadRanking(selectedContentType.value, selectedPeriod.value);
  }
});

onMounted(async () => {
  await loadData();
});
</script>

<style scoped>
.likes-view {
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

.loading-state,
.error-state {
  text-align: center;
  padding: 64px;
  background: var(--color-bg-card);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
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

.likes-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.tab-navigation {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 40px;
}

.tab-btn {
  padding: 12px 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.tab-btn:hover {
  border-color: var(--color-border-dark);
  color: var(--color-text-primary);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.tab-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-bg-primary);
}

.likes-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 40px;
  box-shadow: var(--shadow-card);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 24px;
  letter-spacing: -0.025em;
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
  gap: 24px;
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.book-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: var(--shadow-card);
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
  color: var(--color-bg-primary);
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

.period-selector,
.content-type-selector {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
  flex-wrap: wrap;
}

.period-btn,
.type-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.period-btn:hover,
.type-btn:hover {
  border-color: var(--color-primary);
  color: var(--color-text-primary);
}

.period-btn.active,
.type-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-bg-primary);
}

.ranking-list {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
}

.ranking-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.ranking-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
}

.ranking-item:hover {
  border-color: var(--color-primary);
  transform: translateY(-2px);
}

.rank-number {
  flex-shrink: 0;
  width: 60px;
  text-align: center;
}

.rank {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}

.content-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  flex: 1;
}

.content-preview {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-md);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
}

.content-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.content-fallback {
  font-size: 2rem;
}

.content-details {
  flex: 1;
}

.content-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.content-meta {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.like-stats {
  flex-shrink: 0;
}

.like-count {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-danger);
}

.empty-section,
.empty-ranking {
  text-align: center;
  padding: var(--spacing-3xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-section h3,
.empty-ranking h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.empty-section p,
.empty-ranking p {
  margin-bottom: var(--spacing-xl);
  font-size: 1.125rem;
}

/* Responsive grid adjustments */
@media (max-width: 1200px) {
  .words-grid,
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    padding: 32px 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
}

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
  
  .words-grid,
  .books-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .likes-section,
  .ranking-list {
    padding: 20px;
  }
  
  .section-title {
    font-size: 1.25rem;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  
  .tab-navigation {
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .tab-btn {
    width: 200px;
  }
  
  .period-selector,
  .content-type-selector {
    justify-content: center;
  }
  
  .ranking-item {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .content-info {
    flex-direction: column;
    text-align: center;
  }
}

@media (max-width: 640px) {
  .words-grid,
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
  
  .words-grid,
  .books-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .likes-section,
  .ranking-list {
    padding: 16px;
  }
  
  .tab-btn {
    width: 150px;
    padding: 10px 16px;
    font-size: 0.875rem;
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
  
  .book-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
  
  .tab-btn:hover {
    transform: none;
  }
  
  .tab-btn:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .book-card,
  .book-cover img,
  .tab-btn {
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