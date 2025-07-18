<template>
  <div class="likes-content">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>좋아요 데이터를 불러오는 중...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <p>오류가 발생했습니다: {{ error }}</p>
      <button @click="loadData" class="btn btn-primary">다시 시도</button>
    </div>

    <div v-else class="likes-container">
      <!-- 기간 및 콘텐츠 타입 필터 -->
      <div class="filters">
        <div class="filter-group">
          <label>기간</label>
          <select v-model="selectedPeriod" class="filter-select">
            <option value="all">전체</option>
            <option value="monthly">이번 달</option>
            <option value="weekly">이번 주</option>
          </select>
        </div>
        
        <div class="filter-group">
          <label>콘텐츠 타입</label>
          <select v-model="selectedContentType" class="filter-select">
            <option value="word">단어</option>
            <option value="quiz">퀴즈</option>
            <option value="puzzle">퍼즐</option>
            <option value="book">책</option>
          </select>
        </div>
      </div>

      <!-- 내 좋아요 섹션 -->
      <section class="my-likes-section">
        <h2>내 좋아요</h2>
        <div v-if="myLikes.length === 0" class="empty-state">
          <div class="empty-icon">💝</div>
          <h3>아직 좋아요한 콘텐츠가 없어요</h3>
          <p>학습하면서 마음에 드는 콘텐츠에 좋아요를 눌러보세요!</p>
          <div class="empty-actions">
            <router-link to="/words" class="btn btn-primary">단어 학습</router-link>
            <router-link to="/books" class="btn btn-secondary">책 읽기</router-link>
          </div>
        </div>
        <div v-else class="likes-grid">
          <div v-for="like in myLikes" :key="like.id" class="like-card">
            <div class="like-icon">❤️</div>
            <div class="like-content">
              <h3>{{ store.currentWords.find(word => word.id === like.contentId)?.name || like.contentId }}</h3>
              <p class="like-type">{{ getContentTypeLabel(like.content_type) }}</p>
              <p class="like-date">{{ formatDate(like.created_at) }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 좋아요 랭킹 섹션 -->
      <section class="ranking-section">
        <h2>좋아요 랭킹</h2>
        <div v-if="ranking.length === 0" class="empty-state">
          <div class="empty-icon">🏆</div>
          <h3>아직 랭킹 데이터가 없어요</h3>
          <p>더 많은 사용자가 좋아요를 누르면 랭킹이 표시됩니다.</p>
        </div>
        <div v-else class="ranking-list">
          <div v-for="(item, index) in ranking" :key="item.contentId" class="ranking-item">
            <div class="ranking-position">
              <span class="rank-number">{{ index + 1 }}</span>
              <span class="rank-text">{{ index + 1 }}위</span>
            </div>
            <div class="ranking-content">
              <h3>{{ store.currentWords.find(word => word.id === item.contentId)?.name || item.contentId }}</h3>
              <p class="ranking-type">{{ getContentTypeLabel(selectedContentType) }}</p>
              <p class="ranking-likes">좋아요 {{ item.likeCount }}개</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useLikes } from '@/composables/useLikes';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';

const authStore = useAuthStore();
const store = useAppStore();
const { 
  myLikes, 
  ranking, 
  isLoading, 
  error, 
  loadLikes, 
  loadRanking 
} = useLikes();

const selectedPeriod = ref('all');
const selectedContentType = ref('word');

// 데이터 로드
const loadData = async () => {
  if (!authStore.user) return;
  try {
    console.log('LikesContentView: Loading data...');
    // 단어/책 먼저 로드
    await store.loadWords();
    await store.loadBooks();
    // 그 다음 좋아요/랭킹 로드
    await loadLikes(authStore.user.id);
    await loadRanking(selectedContentType.value as any, selectedPeriod.value as any, 10);
    console.log('✅ LikesContentView: Data loaded');
  } catch (err) {
    console.error('❌ LikesContentView: Error loading data:', err);
  }
};

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 콘텐츠 타입 라벨 변환
const getContentTypeLabel = (contentType: string) => {
  const labels: Record<string, string> = {
    'word': '단어',
    'quiz': '퀴즈',
    'puzzle': '퍼즐',
    'book': '책'
  };
  return labels[contentType] || contentType;
};

// 필터 변경 시 랭킹 다시 로드
watch([selectedPeriod, selectedContentType], () => {
  loadRanking(selectedContentType.value as any, selectedPeriod.value as any, 10);
});

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.likes-content {
  padding: 0;
}

.loading-state, .error-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-md);
}

.likes-container {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.filters {
  display: flex;
  gap: var(--spacing-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.filter-select {
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.my-likes-section, .ranking-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.my-likes-section h2, .ranking-section h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}

.empty-state h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-lg);
}

.empty-actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  flex-wrap: wrap;
}

.likes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-md);
}

.like-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
}

.like-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.like-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.like-content {
  flex: 1;
}

.like-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.like-type, .like-date {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
}

.ranking-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.ranking-position {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
  text-align: center;
}

.rank-number {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-primary);
}

.rank-text {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
}

.ranking-content {
  flex: 1;
}

.ranking-content h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.ranking-type, .ranking-likes {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .likes-grid {
    grid-template-columns: 1fr;
  }
  
  .like-card, .ranking-item {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }
  
  .ranking-position {
    flex-direction: row;
    gap: var(--spacing-sm);
    min-width: auto;
  }
}
</style>