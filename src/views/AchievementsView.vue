<template>
  <div class="achievements-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">{{$t('achievements.title')}}</h1>
          <p class="page-description">
            {{$t('achievements.description')}}
          </p>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="contentStore.isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>{{$t('achievements.loading')}}</p>
        </div>

        <!-- 에러 상태 -->
        <div v-else-if="contentStore.error" class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>{{$t('achievements.errorTitle')}}</h3>
          <p>{{ contentStore.error }}</p>
          <button @click="reloadContent" class="btn btn-primary">{{$t('achievements.retry')}}</button>
        </div>

        <!-- 정상 상태 -->
        <div v-else>
          <!-- 획득한 뱃지 섹션 - 최상단에 모든 뱃지 표시 -->
          <section class="earned-badges-section">
            <div class="section-header">
              <h2 class="section-title">{{$t('achievements.earnedBadges')}}</h2>
              <div class="badge-count">
                <span class="count">{{ displayedBadges.length }}</span>
                <span class="total">/ {{ contentStore.badges.length }}</span>
              </div>
            </div>

            <!-- 획득한 뱃지들 - 모든 뱃지 표시 -->
            <div v-if="displayedBadges.length > 0" class="earned-badges-grid">
              <div 
                v-for="badge in displayedBadges" 
                :key="badge.id"
                class="badge-card earned"
              >
                <div class="badge-icon">{{ badge.icon }}</div>
                <div class="badge-info">
                  <h3 class="badge-name">{{ badge.name }}</h3>
                  <p class="badge-description">{{ badge.description }}</p>
                  <div class="badge-category">{{ getCategoryName(badge.category) }}</div>
                </div>
                <div class="earned-indicator">
                  <span class="earned-text">{{$t('achievements.earned')}}</span>
                </div>
              </div>
            </div>

            <!-- 뱃지가 없는 경우 -->
            <div v-if="displayedBadges.length === 0" class="no-badges">
              <div class="no-badges-icon">🎯</div>
              <h3>{{$t('achievements.noBadges')}}</h3>
              <p>{{$t('achievements.startLearning')}}</p>
              <div class="quick-actions">
                <router-link to="/quiz" class="btn btn-primary">
                  {{$t('achievements.startQuiz')}}
                </router-link>
                <router-link to="/words" class="btn btn-secondary">
                  {{$t('achievements.startWords')}}
                </router-link>
              </div>
            </div>
          </section>

          <!-- 다음 목표 섹션 -->
          <section v-if="nextBadges.length > 0" class="next-goals-section">
            <h2 class="section-title">{{$t('achievements.nextGoals')}}</h2>
            <div class="next-badges-grid">
              <div 
                v-for="badge in nextBadges" 
                :key="badge.id"
                class="badge-card locked"
              >
                <div class="badge-icon locked">{{ badge.icon }}</div>
                <div class="badge-info">
                  <h3 class="badge-name">{{ badge.name }}</h3>
                  <p class="badge-description">{{ badge.description }}</p>
                  <div class="progress-info">
                    <div class="progress-text">
                      {{ getProgressText(badge) }}
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        :style="{ width: `${getProgressPercentage(badge)}%` }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 학습 통계 섹션 - 컴팩트하게 -->
          <section class="stats-section">
            <h2 class="section-title">{{$t('achievements.learningStats')}}</h2>
            
            <div class="stats-grid" v-if="authStore.userProgress">
              <div class="stat-card quiz">
                <div class="stat-icon">🧩</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.quiz_score }}</div>
                  <div class="stat-label">퀴즈 점수</div>
                  <div class="stat-sub">연속 {{ authStore.userProgress.quiz_streak }}회</div>
                </div>
              </div>

              <div class="stat-card puzzle">
                <div class="stat-icon">🧩</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.puzzle_completions }}</div>
                  <div class="stat-label">퍼즐 완성</div>
                </div>
              </div>

              <div class="stat-card words">
                <div class="stat-icon">📚</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.words_learned }}</div>
                  <div class="stat-label">학습한 단어</div>
                  <div class="stat-sub">총 {{ contentStore.words.length }}개 중</div>
                </div>
              </div>

              <div class="stat-card books">
                <div class="stat-icon">📖</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.books_read }}</div>
                  <div class="stat-label">읽은 책</div>
                  <div class="stat-sub">총 {{ contentStore.books.length }}권 중</div>
                </div>
              </div>
            </div>
          </section>

          <!-- 전체 진행률 섹션 - 컴팩트하게 -->
          <section class="progress-section">
            <h2 class="section-title">📈 전체 진행률</h2>
            
            <div class="progress-cards">
              <div class="progress-card">
                <h3 class="progress-title">뱃지 수집률</h3>
                <div class="circular-progress">
                  <div class="progress-circle" :style="{ '--progress': badgeProgress }">
                    <span class="progress-percentage">{{ Math.round(badgeProgress) }}%</span>
                  </div>
                </div>
                <p class="progress-description">
                  {{ displayedBadges.length }}개 / {{ contentStore.badges.length }}개 뱃지 획득
                </p>
              </div>

              <div class="progress-card">
                <h3 class="progress-title">카테고리별 달성도</h3>
                <div class="category-progress">
                  <div class="category-item">
                    <span class="category-label">퀴즈</span>
                    <div class="category-bar">
                      <div 
                        class="category-fill quiz" 
                        :style="{ width: `${getCategoryProgress('quiz')}%` }"
                      ></div>
                    </div>
                    <span class="category-value">{{ getCategoryBadgeCount('quiz') }}/5</span>
                  </div>
                  <div class="category-item">
                    <span class="category-label">퍼즐</span>
                    <div class="category-bar">
                      <div 
                        class="category-fill puzzle" 
                        :style="{ width: `${getCategoryProgress('puzzle')}%` }"
                      ></div>
                    </div>
                    <span class="category-value">{{ getCategoryBadgeCount('puzzle') }}/5</span>
                  </div>
                  <div class="category-item">
                    <span class="category-label">단어</span>
                    <div class="category-bar">
                      <div 
                        class="category-fill words" 
                        :style="{ width: `${getCategoryProgress('words')}%` }"
                      ></div>
                    </div>
                    <span class="category-value">{{ getCategoryBadgeCount('words') }}/5</span>
                  </div>
                  <div class="category-item">
                    <span class="category-label">책</span>
                    <div class="category-bar">
                      <div 
                        class="category-fill books" 
                        :style="{ width: `${getCategoryProgress('books')}%` }"
                      ></div>
                    </div>
                    <span class="category-value">{{ getCategoryBadgeCount('books') }}/5</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 디버그 정보 (개발용) -->
          <section v-if="showDebugInfo" class="debug-section">
            <h2 class="section-title">🔧 디버그 정보</h2>
            <div class="debug-content">
              <p><strong>사용자 진행도:</strong></p>
              <pre>{{ JSON.stringify(authStore.userProgress, null, 2) }}</pre>
              <p><strong>전체 뱃지:</strong> {{ contentStore.badges.length }}개</p>
              <p><strong>획득한 뱃지:</strong> {{ displayedBadges.length }}개</p>
              <p><strong>사용자 뱃지 데이터:</strong></p>
              <pre>{{ JSON.stringify(contentStore.userBadges, null, 2) }}</pre>
              <p><strong>Available Badges Computed:</strong></p>
              <pre>{{ JSON.stringify(contentStore.availableBadges, null, 2) }}</pre>
            </div>
            <div class="debug-actions">
              <button @click="forceReloadBadges" class="btn btn-secondary">뱃지 강제 새로고침</button>
              <button @click="checkBadges" class="btn btn-primary">뱃지 확인 실행</button>
            </div>
          </section>
        </div>

        <!-- 디버그 토글 버튼 -->
        <button 
          @click="showDebugInfo = !showDebugInfo" 
          class="debug-toggle"
          style="position: fixed; bottom: 20px; right: 20px; z-index: 1000;"
        >
          {{ showDebugInfo ? '디버그 숨기기' : '🔧' }}
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import Navigation from '@/components/Navigation.vue';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import type { Badge } from '@/types';

const authStore = useAuthStore();
const contentStore = useContentStore();
const showDebugInfo = ref(false);

// FIXED: 실제 표시될 뱃지 계산 (여러 방법으로 시도)
const displayedBadges = computed(() => {
  console.log('🎯 Computing displayed badges...');
  
  // 방법 1: contentStore.availableBadges 사용
  let badges = contentStore.availableBadges;
  console.log('📊 Method 1 - availableBadges:', badges.length);
  
  // 방법 2: userBadges에서 직접 추출
  if (badges.length === 0 && contentStore.userBadges.length > 0) {
    console.log('📊 Method 2 - extracting from userBadges...');
    badges = contentStore.userBadges
      .map(ub => ub.badges || ub.badge)
      .filter((badge): badge is Badge => badge !== null && badge !== undefined);
    console.log('📊 Method 2 result:', badges.length);
  }
  
  console.log('✅ Final displayed badges:', badges.length, badges.map(b => b?.name));
  return badges;
});

// 아직 획득하지 못한 뱃지들 중 다음 목표 3개
const nextBadges = computed(() => {
  const unlockedBadgeIds = displayedBadges.value.map(b => b.id);
  return contentStore.badges
    .filter(badge => !unlockedBadgeIds.includes(badge.id))
    .sort((a, b) => a.required_score - b.required_score)
    .slice(0, 3);
});

// 뱃지 진행률 계산
const badgeProgress = computed(() => {
  if (contentStore.badges.length === 0) return 0;
  return (displayedBadges.value.length / contentStore.badges.length) * 100;
});

// 카테고리 이름 변환
const getCategoryName = (category: string) => {
  const categoryNames: Record<string, string> = {
    'quiz': '퀴즈',
    'puzzle': '퍼즐',
    'words': '단어',
    'books': '책'
  };
  return categoryNames[category] || category;
};

// 뱃지 진행률 텍스트
const getProgressText = (badge: Badge) => {
  if (!authStore.userProgress) return `0 / ${badge.required_score}`;
  
  let current = 0;
  switch (badge.category) {
    case 'quiz':
      current = authStore.userProgress.quiz_score;
      break;
    case 'puzzle':
      current = authStore.userProgress.puzzle_completions;
      break;
    case 'words':
      current = authStore.userProgress.words_learned;
      break;
    case 'books':
      current = authStore.userProgress.books_read;
      break;
  }
  
  return `${current} / ${badge.required_score}`;
};

// 뱃지 진행률 퍼센트
const getProgressPercentage = (badge: Badge) => {
  if (!authStore.userProgress) return 0;
  
  let current = 0;
  switch (badge.category) {
    case 'quiz':
      current = authStore.userProgress.quiz_score;
      break;
    case 'puzzle':
      current = authStore.userProgress.puzzle_completions;
      break;
    case 'words':
      current = authStore.userProgress.words_learned;
      break;
    case 'books':
      current = authStore.userProgress.books_read;
      break;
  }
  
  return Math.min((current / badge.required_score) * 100, 100);
};

// 카테고리별 뱃지 개수
const getCategoryBadgeCount = (category: string) => {
  return displayedBadges.value.filter(b => b.category === category).length;
};

// 카테고리별 진행률
const getCategoryProgress = (category: string) => {
  const totalBadges = contentStore.badges.filter(b => b.category === category).length;
  const earnedBadges = getCategoryBadgeCount(category);
  return totalBadges > 0 ? (earnedBadges / totalBadges) * 100 : 0;
};

// 콘텐츠 다시 로드
const reloadContent = async () => {
  console.log('🔄 Reloading achievements content...');
  await contentStore.loadContent();
};

// 뱃지 강제 새로고침
const forceReloadBadges = async () => {
  console.log('🔄 Force reloading badges...');
  await contentStore.forceRefreshBadges();
};

// 뱃지 확인 실행
const checkBadges = async () => {
  console.log('🔍 Manual badge check...');
  if (authStore.user && authStore.userProgress) {
    await contentStore.checkBadgeUnlocks();
  }
};

// userBadges 변경 감지
watch(() => contentStore.userBadges, (newBadges) => {
  console.log('👀 UserBadges changed:', newBadges.length);
}, { deep: true });

// 컴포넌트 마운트 시 콘텐츠 로드
onMounted(async () => {
  console.log('🎯 Achievements view mounted, loading content...');
  
  // 콘텐츠가 없으면 로드
  if (contentStore.badges.length === 0 || contentStore.userBadges.length === 0) {
    await contentStore.loadContent();
  }
  
  // 뱃지 확인 실행
  if (authStore.user && authStore.userProgress) {
    console.log('🔍 Checking for badge unlocks on achievements page load...');
    await contentStore.checkBadgeUnlocks();
  }
  
  // 초기 상태 로그
  console.log('📊 Initial state:', {
    badges: contentStore.badges.length,
    userBadges: contentStore.userBadges.length,
    availableBadges: contentStore.availableBadges.length,
    displayedBadges: displayedBadges.value.length
  });
});
</script>

<style scoped>
.achievements-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.main-content {
  padding: var(--spacing-lg) 0;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-lg);
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: var(--spacing-sm);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-description {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  max-width: 400px;
  margin: 0 auto;
  font-weight: 500;
}

/* 로딩 및 에러 상태 */
.loading-state,
.error-state {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-sm);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-sm);
}

.error-state h3 {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: 1.1rem;
}

.error-state p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  font-size: 0.9rem;
}

/* 획득한 뱃지 섹션 */
.earned-badges-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.badge-count {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-xs);
  font-size: 0.9rem;
  font-weight: 700;
}

.count {
  color: var(--color-primary);
  font-size: 1.1rem;
}

.total {
  color: var(--color-text-secondary);
}

.earned-badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

/* 다음 목표 섹션 */
.next-goals-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.next-badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--spacing-sm);
}

.badge-card {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  position: relative;
  transition: all 0.3s ease;
  min-height: 120px;
}

.badge-card.earned {
  border-color: var(--color-success);
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.badge-card.locked {
  opacity: 0.7;
  border-color: var(--color-border);
}

.badge-card.locked:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.badge-icon {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-xs);
  text-align: center;
}

.badge-icon.locked {
  filter: grayscale(100%);
  opacity: 0.5;
}

.badge-info {
  text-align: center;
}

.badge-name {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  line-height: 1.2;
}

.badge-description {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  margin-bottom: var(--spacing-xs);
  line-height: 1.2;
}

.badge-category {
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-sm);
  font-size: 0.6rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.earned-indicator {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  background: var(--color-success);
  color: white;
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-sm);
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.progress-info {
  margin-top: var(--spacing-xs);
}

.progress-text {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
}

.progress-bar {
  width: 100%;
  height: 3px;
  background: var(--color-bg-primary);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.3s ease;
}

.no-badges {
  text-align: center;
  padding: var(--spacing-lg);
}

.no-badges-icon {
  font-size: 2.5rem;
  margin-bottom: var(--spacing-sm);
}

.no-badges h3 {
  font-size: 1.1rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
  font-weight: 700;
}

.no-badges p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  font-weight: 500;
  font-size: 0.9rem;
}

.quick-actions {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

/* 통계 섹션 */
.stats-section {
  margin-bottom: var(--spacing-lg);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-sm);
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-sm);
}

.stat-icon {
  font-size: 1.2rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 800;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  margin-top: 2px;
  font-weight: 600;
}

.stat-sub {
  font-size: 0.6rem;
  color: var(--color-text-muted);
  margin-top: 1px;
}

/* 진행률 섹션 */
.progress-section {
  margin-bottom: var(--spacing-lg);
}

.progress-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.progress-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: center;
}

.progress-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.circular-progress {
  margin-bottom: var(--spacing-sm);
}

.progress-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(
    var(--color-primary) calc(var(--progress) * 1%),
    var(--color-bg-secondary) 0
  );
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  position: relative;
}

.progress-circle::before {
  content: '';
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: var(--color-bg-card);
  position: absolute;
}

.progress-percentage {
  font-size: 0.8rem;
  font-weight: 800;
  color: var(--color-text-primary);
  z-index: 1;
}

.progress-description {
  color: var(--color-text-secondary);
  font-size: 0.7rem;
  font-weight: 500;
}

.category-progress {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.category-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.category-label {
  font-size: 0.7rem;
  color: var(--color-text-secondary);
  font-weight: 600;
  min-width: 30px;
}

.category-bar {
  flex: 1;
  height: 4px;
  background: var(--color-bg-secondary);
  border-radius: 2px;
  overflow: hidden;
}

.category-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.category-fill.quiz {
  background: linear-gradient(90deg, #3b82f6, #1d4ed8);
}

.category-fill.puzzle {
  background: linear-gradient(90deg, #10b981, #059669);
}

.category-fill.words {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.category-fill.books {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.category-value {
  font-size: 0.7rem;
  color: var(--color-text-primary);
  font-weight: 700;
  min-width: 25px;
  text-align: right;
}

/* 디버그 섹션 */
.debug-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.debug-content {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-md);
}

.debug-content pre {
  background: var(--color-bg-primary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  overflow-x: auto;
  color: var(--color-text-primary);
}

.debug-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.debug-toggle {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 0.8rem;
}

.main-content {
  padding: var(--spacing-md) 0;
}

.page-title {
  font-size: 1.5rem;
}

.page-description {
  font-size: 0.8rem;
}

.earned-badges-section,
.next-goals-section,
.stats-section,
.progress-section {
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.section-title {
  font-size: 1rem;
}

.badge-count {
  font-size: 0.8rem;
}

.count {
  font-size: 1rem;
}

.earned-badges-grid,
.next-badges-grid {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: var(--spacing-xs);
}

.badge-card {
  min-height: 100px;
  padding: var(--spacing-xs);
}

.badge-icon {
  font-size: 1.2rem;
}

.badge-name {
  font-size: 0.7rem;
}

.badge-description {
  font-size: 0.6rem;
}

.badge-category {
  font-size: 0.5rem;
}

.earned-indicator {
  font-size: 0.5rem;
}

.progress-text {
  font-size: 0.6rem;
}

.stats-grid {
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-xs);
}

.stat-card {
  padding: var(--spacing-xs);
  gap: var(--spacing-xs);
}

.stat-icon {
  font-size: 1rem;
}

.stat-value {
  font-size: 1rem;
}

.stat-label {
  font-size: 0.6rem;
}

.stat-sub {
  font-size: 0.5rem;
}

.progress-cards {
  grid-template-columns: 1fr;
  gap: var(--spacing-md);
}

.progress-card {
  padding: var(--spacing-md);
}

.progress-title {
  font-size: 0.8rem;
}

.circular-progress {
  margin-bottom: var(--spacing-sm);
}

.progress-circle {
  width: 50px;
  height: 50px;
}

.progress-circle::before {
  width: 35px;
  height: 35px;
}

.progress-percentage {
  font-size: 0.7rem;
}

.progress-description {
  font-size: 0.6rem;
}

.category-label {
  font-size: 0.6rem;
}

.category-value {
  font-size: 0.6rem;
}

.debug-toggle {
  font-size: 0.7rem;
  padding: var(--spacing-xs);
}
</style>