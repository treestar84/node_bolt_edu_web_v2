<template>
  <div class="user-dashboard">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="dashboard-header">
          <h1 class="dashboard-title">관리 대시보드</h1>
          <p class="dashboard-subtitle">
            {{ authStore.userProfile?.childName || '아이' }}의 학습 현황을 확인하고 관리해보세요
          </p>
        </div>

        <div class="dashboard-grid">
          <!-- 학습 통계 카드 -->
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title">📊 학습 통계</h3>
            </div>
            <div class="card-content">
              <div class="stat-item">
                <span class="stat-label">학습한 단어</span>
                <span class="stat-value">{{ userProgress?.wordsLearned || 0 }}개</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">읽은 책</span>
                <span class="stat-value">{{ userProgress?.booksRead || 0 }}권</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">퀴즈 점수</span>
                <span class="stat-value">{{ userProgress?.quizScore || 0 }}점</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">퍼즐 완료</span>
                <span class="stat-value">{{ userProgress?.puzzleCompletions || 0 }}개</span>
              </div>
            </div>
          </div>

          <!-- 좋아요한 콘텐츠 -->
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title">❤️ 좋아요한 콘텐츠</h3>
              <router-link to="/likes" class="view-all-link">전체보기</router-link>
            </div>
            <div class="card-content">
              <div v-if="myLikes.length === 0" class="empty-state">
                <p>아직 좋아요한 콘텐츠가 없어요</p>
              </div>
              <div v-else class="likes-preview">
                <div v-for="like in myLikes.slice(0, 3)" :key="like.id" class="like-item">
                  <span class="like-type">{{ getContentTypeName(like.contentType) }}</span>
                  <span class="like-title">{{ like.content_title || like.contentId }}</span>
                </div>
                <div v-if="myLikes.length > 3" class="more-likes">
                  +{{ myLikes.length - 3 }}개 더
                </div>
              </div>
            </div>
          </div>

          <!-- 학습 진도 -->
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title">📈 학습 진도</h3>
              <router-link to="/learning-stats" class="view-all-link">상세보기</router-link>
            </div>
            <div class="card-content">
              <div class="progress-item">
                <span class="progress-label">연속 학습</span>
                <span class="progress-value">{{ userProgress?.quizStreak || 0 }}일</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: `${Math.min(((userProgress?.quizStreak || 0) / 30) * 100, 100)}%` }"></div>
              </div>
              <p class="progress-text">30일 연속 학습 목표</p>
            </div>
          </div>

          <!-- 배지 현황 -->
          <div class="dashboard-card">
            <div class="card-header">
              <h3 class="card-title">🏆 배지 현황</h3>
              <router-link to="/achievements" class="view-all-link">전체보기</router-link>
            </div>
            <div class="card-content">
              <div class="badges-preview">
                <div class="badge-summary">
                  <span class="badge-count">{{ unlockedBadges.length }}</span>
                  <span class="badge-total">/ {{ totalBadges }}</span>
                  <span class="badge-label">배지 획득</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 빠른 액션 -->
          <div class="dashboard-card full-width">
            <div class="card-header">
              <h3 class="card-title">🚀 빠른 학습</h3>
            </div>
            <div class="card-content">
              <div class="quick-actions">
                <router-link to="/words" class="action-btn">
                  <span class="action-icon">📝</span>
                  <span class="action-text">단어 학습</span>
                </router-link>
                <router-link to="/quiz" class="action-btn">
                  <span class="action-icon">🧩</span>
                  <span class="action-text">퀴즈 풀기</span>
                </router-link>
                <router-link to="/books" class="action-btn">
                  <span class="action-icon">📚</span>
                  <span class="action-text">그림책 읽기</span>
                </router-link>
                <router-link to="/puzzle" class="action-btn">
                  <span class="action-icon">🧩</span>
                  <span class="action-text">퍼즐 게임</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import Navigation from '@/components/Navigation.vue';
import { useAuthStore } from '@/stores/auth';
import { useAppStore } from '@/stores/app';
import { useLikes } from '@/composables/useLikes';

const authStore = useAuthStore();
const store = useAppStore();
const { myLikes, loadLikes } = useLikes(); // Use myLikes instead of likes

const userProgress = computed(() => authStore.userProgress);
const unlockedBadges = computed(() => store.currentBadges.filter(b => b.unlocked)); // Corrected
const totalBadges = computed(() => store.currentBadges.length); // Corrected

const getContentTypeName = (type: string) => {
  const typeNames = {
    word: '단어',
    book: '그림책',
    quiz: '퀴즈',
    puzzle: '퍼즐'
  };
  return typeNames[type as keyof typeof typeNames] || type;
};

onMounted(async () => {
  try {
    // 사용자 진행도 로드
    if (authStore.isAuthenticated) {
      await authStore.loadUserProfile();
      await loadLikes();
      await store.loadBadges(); // Corrected
    }
  } catch (error) {
    console.error('사용자 대시보드 데이터 로드 실패:', error);
  }
});
</script>

<style scoped>
.user-dashboard {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.dashboard-header {
  text-align: center;
  margin-bottom: 40px;
}

.dashboard-title {
  font-size: 2.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  letter-spacing: -0.025em;
}

.dashboard-subtitle {
  color: var(--color-text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.dashboard-card {
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.dashboard-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.dashboard-card.full-width {
  grid-column: 1 / -1;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.card-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.view-all-link {
  color: var(--color-primary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.view-all-link:hover {
  text-decoration: underline;
}

.card-content {
  color: var(--color-text-secondary);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.stat-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.stat-label {
  font-weight: 500;
}

.stat-value {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--spacing-lg) 0;
}

.likes-preview {
  space-y: var(--spacing-sm);
}

.like-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.like-item:last-child {
  border-bottom: none;
}

.like-type {
  font-size: 0.8rem;
  background: var(--color-primary);
  color: white;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.like-title {
  flex: 1;
  margin-left: var(--spacing-sm);
  font-weight: 500;
}

.more-likes {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin-top: var(--spacing-sm);
}

.progress-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.progress-label {
  font-weight: 500;
}

.progress-value {
  font-weight: 600;
  color: var(--color-primary);
  font-size: 1.2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0;
}

.badges-preview {
  text-align: center;
}

.badge-summary {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--spacing-xs);
}

.badge-count {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
}

.badge-total {
  font-size: 1.2rem;
  color: var(--color-text-secondary);
}

.badge-label {
  font-weight: 500;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-lg);
  background: var(--color-bg);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
  transition: all 0.3s ease;
}

.action-btn:hover {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
  transform: translateY(-2px);
}

.action-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
}

.action-text {
  font-weight: 500;
  font-size: 0.9rem;
}

/* 모바일 최적화 */
@media (max-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .quick-actions {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-btn {
    padding: var(--spacing-md);
  }
  
  .action-icon {
    font-size: 1.5rem;
  }
}
</style>