<template>
  <div class="learning-stats-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="stats-header">
          <h1>학습 통계</h1>
          <p>{{ childName }}님의 학습 현황을 확인해보세요</p>
        </div>

        <div v-if="isLoading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>학습 통계를 불러오는 중...</p>
        </div>

        <div v-else-if="error" class="error-state">
          <p class="error-message">{{ error }}</p>
          <button @click="refreshStats" class="btn btn-primary">다시 시도</button>
        </div>

        <div v-else class="stats-content">
          <!-- 개인 학습 현황 -->
          <section class="personal-stats">
            <h2>개인 학습 현황</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                  <h3>최근 정답률</h3>
                  <p class="stat-value">{{ userStats?.currentAccuracyRate || 0 }}%</p>
                  <p class="stat-subtitle">최근 {{ recentQuizLimit }}문제 기준</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📚</div>
                <div class="stat-content">
                  <h3>학습한 단어</h3>
                  <p class="stat-value">{{ userStats?.totalWordsLearned || 0 }}개</p>
                  <p class="stat-subtitle">전체 누적</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">📖</div>
                <div class="stat-content">
                  <h3>읽은 책</h3>
                  <p class="stat-value">{{ userStats?.totalBooksRead || 0 }}권</p>
                  <p class="stat-subtitle">전체 누적</p>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">🧩</div>
                <div class="stat-content">
                  <h3>완성한 퍼즐</h3>
                  <p class="stat-value">{{ userStats?.totalPuzzlesCompleted || 0 }}개</p>
                  <p class="stat-subtitle">전체 누적</p>
                </div>
              </div>
            </div>
          </section>

          <!-- 연령대 비교 -->
          <section v-if="ageGroupComparison" class="age-comparison">
            <h2>같은 연령대 친구들과 비교</h2>
            <div class="comparison-card">
              <div class="child-info">
                <h3>{{ childName }}님 ({{ childAgeMonths }}개월)</h3>
                <p>{{ ageGroupComparison.ageGroup.name }}</p>
              </div>
              
              <div class="percentile-display">
                <div class="percentile-circle">
                  <div class="percentile-value">{{ ageGroupComparison.percentile }}%</div>
                  <div class="percentile-label">상위</div>
                </div>
                <p class="percentile-description">
                  같은 연령대 {{ ageGroupComparison.ageGroup.userCount }}명 중 
                  상위 {{ ageGroupComparison.percentile }}%에 해당합니다
                </p>
              </div>
              
              <div class="comparison-details">
                <div class="comparison-item">
                  <span class="label">내 정답률</span>
                  <span class="value my-value">{{ ageGroupComparison.userInfo.accuracyRate }}%</span>
                </div>
                <div class="comparison-item">
                  <span class="label">평균 정답률</span>
                  <span class="value avg-value">{{ Math.round(ageGroupComparison.ageGroup.avgAccuracyRate) }}%</span>
                </div>
                <div class="comparison-item">
                  <span class="label">상위 25%</span>
                  <span class="value">{{ Math.round(ageGroupComparison.ageGroup.accuracy75th) }}%</span>
                </div>
                <div class="comparison-item">
                  <span class="label">하위 25%</span>
                  <span class="value">{{ Math.round(ageGroupComparison.ageGroup.accuracy25th) }}%</span>
                </div>
              </div>
            </div>
          </section>

          <!-- 학습 수준 분석 -->
          <section v-if="learningAnalysis" class="learning-analysis">
            <h2>학습 수준 분석</h2>
            <div class="analysis-card">
              <div class="level-badge" :class="learningAnalysis.level">
                {{ levelDisplayName[learningAnalysis.level] }}
              </div>
              <p class="analysis-text">{{ learningAnalysis.recommendation }}</p>
              <p class="comparison-text">{{ learningAnalysis.comparisonText }}</p>
            </div>
          </section>

          <!-- 주간 학습 진도 -->
          <section v-if="weeklyProgress.length > 0" class="weekly-progress">
            <h2>주간 학습 진도</h2>
            <div class="progress-chart">
              <div class="chart-container">
                <div v-for="day in weeklyProgress" :key="day.date" class="progress-day">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ height: `${Math.max(day.accuracy, 5)}%` }"
                    ></div>
                  </div>
                  <div class="day-info">
                    <span class="day-date">{{ formatDate(day.date) }}</span>
                    <span class="day-stats">{{ day.questions }}문제</span>
                    <span class="day-accuracy">{{ day.accuracy }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 난이도별 정답률 -->
          <section v-if="difficultyStats && Object.keys(difficultyStats).length > 0" class="difficulty-stats">
            <h2>난이도별 정답률</h2>
            <div class="difficulty-grid">
              <div 
                v-for="(stats, difficulty) in difficultyStats" 
                :key="difficulty"
                class="difficulty-card"
              >
                <div class="difficulty-level">레벨 {{ difficulty }}</div>
                <div class="difficulty-accuracy">{{ stats.accuracy }}%</div>
                <div class="difficulty-count">{{ stats.total }}문제</div>
              </div>
            </div>
          </section>

          <!-- 최근 활동 -->
          <section v-if="recentActivity.length > 0" class="recent-activity">
            <h2>최근 활동</h2>
            <div class="activity-list">
              <div 
                v-for="activity in recentActivity.slice(0, 5)" 
                :key="activity.id"
                class="activity-item"
              >
                <div class="activity-icon" :class="{ correct: activity.isCorrect }">
                  {{ activity.isCorrect ? '✓' : '✗' }}
                </div>
                <div class="activity-content">
                  <p class="activity-question">{{ activity.questionText }}</p>
                  <p class="activity-time">{{ formatDateTime(activity.createdAt) }}</p>
                </div>
                <div class="activity-result" :class="{ correct: activity.isCorrect }">
                  {{ activity.isCorrect ? '정답' : '오답' }}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useQuizTracking } from '@/composables/useQuizTracking';
import Navigation from '@/components/Navigation.vue';
import type { QuizResult, UserLearningStats, AgeGroupComparison } from '@/types';

const authStore = useAuthStore();
const quizTracking = useQuizTracking();

// 상태 관리
const userStats = ref<UserLearningStats | null>(null);
const ageGroupComparison = ref<AgeGroupComparison | null>(null);
const recentQuizResults = ref<QuizResult[]>([]);
const isLoading = ref(true);
const error = ref('');

// 설정
const recentQuizLimit = 500;

// 계산된 값들
const childName = computed(() => authStore.userProfile?.childName || '내 아이');
const childAgeMonths = computed(() => authStore.userProfile?.childAgeMonths || 0);

const learningAnalysis = computed(() => {
  if (!userStats.value || !ageGroupComparison.value) return null;
  return quizTracking.analyzeLearningLevel(userStats.value, ageGroupComparison.value);
});

const weeklyProgress = computed(() => {
  if (!recentQuizResults.value.length) return [];
  return quizTracking.calculateLearningProgress(recentQuizResults.value).weeklyProgress;
});

const difficultyStats = computed(() => {
  if (!recentQuizResults.value.length) return {};
  return quizTracking.calculateAccuracyByDifficulty(recentQuizResults.value);
});

const recentActivity = computed(() => {
  return recentQuizResults.value.slice(0, 10);
});

// 레벨 표시 이름
const levelDisplayName: { [key: string]: string } = {
  beginner: '초보자',
  developing: '발전중',
  intermediate: '중급자',
  advanced: '고급자'
};

// 데이터 로드
const loadStats = async () => {
  try {
    isLoading.value = true;
    error.value = '';

    const userId = authStore.user?.id;
    if (!userId) {
      error.value = '로그인이 필요합니다.';
      return;
    }

    // 병렬로 데이터 로드
    const [statsData, comparisonData, recentResults] = await Promise.all([
      quizTracking.getUserLearningStats(userId),
      quizTracking.getUserPercentileStats(userId),
      quizTracking.getRecentQuizResults(userId, recentQuizLimit)
    ]);

    userStats.value = statsData;
    ageGroupComparison.value = comparisonData;
    recentQuizResults.value = recentResults;

  } catch (err: any) {
    console.error('학습 통계 로드 실패:', err);
    error.value = err.message || '학습 통계를 불러오는 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const refreshStats = () => {
  loadStats();
};

// 날짜 포맷팅
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}시간 전`;
  } else if (minutes > 0) {
    return `${minutes}분 전`;
  } else {
    return '방금 전';
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.learning-stats-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  padding: 40px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.stats-header {
  text-align: center;
  margin-bottom: 40px;
}

.stats-header h1 {
  font-size: 2.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
  letter-spacing: -0.025em;
}

.stats-header p {
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.loading-state {
  text-align: center;
  padding: 64px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--spacing-lg);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 64px;
}

.error-message {
  color: var(--color-danger);
  margin-bottom: var(--spacing-lg);
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.stats-content section {
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 32px;
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-card);
}

.stats-content section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 24px;
  letter-spacing: -0.025em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: var(--color-bg-primary);
  border-radius: 12px;
  border: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.stat-icon {
  font-size: 2rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(59, 130, 246, 0.1);
  border-radius: var(--radius-lg);
}

.stat-content h3 {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-subtitle {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.comparison-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
  padding: var(--spacing-xl);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.child-info h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.percentile-display {
  display: flex;
  align-items: center;
  gap: var(--spacing-xl);
}

.percentile-circle {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(var(--color-primary) 0deg, var(--color-primary) calc(var(--percentile, 0) * 3.6deg), var(--color-border) calc(var(--percentile, 0) * 3.6deg));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.percentile-circle::before {
  content: '';
  position: absolute;
  width: 80px;
  height: 80px;
  background: var(--color-bg-primary);
  border-radius: 50%;
  z-index: 1;
}

.percentile-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  z-index: 2;
}

.percentile-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  z-index: 2;
}

.percentile-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  flex: 1;
}

.comparison-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.comparison-item .label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.comparison-item .value {
  font-weight: 600;
  color: var(--color-text-primary);
}

.comparison-item .my-value {
  color: var(--color-primary);
  font-weight: 700;
}

.comparison-item .avg-value {
  color: var(--color-warning);
}

.analysis-card {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.level-badge {
  display: inline-block;
  padding: var(--spacing-sm) var(--spacing-lg);
  border-radius: var(--radius-full);
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--spacing-lg);
}

.level-badge.beginner {
  background: rgba(239, 68, 68, 0.1);
  color: var(--color-danger);
}

.level-badge.developing {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.level-badge.intermediate {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.level-badge.advanced {
  background: rgba(16, 185, 129, 0.1);
  color: var(--color-success);
}

.analysis-text {
  font-size: 1.1rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.comparison-text {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.progress-chart {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.chart-container {
  display: flex;
  align-items: end;
  gap: var(--spacing-md);
  height: 200px;
  margin-bottom: var(--spacing-md);
}

.progress-day {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
}

.progress-bar {
  width: 100%;
  height: 150px;
  background: var(--color-border);
  border-radius: var(--radius-md);
  position: relative;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, var(--color-primary), rgba(59, 130, 246, 0.7));
  border-radius: var(--radius-md);
  transition: height 0.3s ease;
}

.day-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.day-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.day-stats {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.day-accuracy {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-primary);
}

.difficulty-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
}

.difficulty-card {
  padding: var(--spacing-lg);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  text-align: center;
}

.difficulty-level {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm);
}

.difficulty-accuracy {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.difficulty-count {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.activity-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: white;
  background: var(--color-danger);
}

.activity-icon.correct {
  background: var(--color-success);
}

.activity-content {
  flex: 1;
}

.activity-question {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.activity-time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.activity-result {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-danger);
}

.activity-result.correct {
  color: var(--color-success);
}

/* Responsive grid adjustments */
@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    padding: 32px 0;
  }
  
  .stats-header h1 {
    font-size: 2rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 24px 0;
  }
  
  .stats-header h1 {
    font-size: 1.75rem;
  }
  
  .stats-header p {
    font-size: 0.875rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .stat-card {
    padding: 16px;
    gap: 12px;
  }
  
  .percentile-display {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .comparison-details {
    grid-template-columns: 1fr;
  }
  
  .difficulty-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .chart-container {
    height: 150px;
  }
  
  .progress-bar {
    height: 100px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 20px 0;
  }
  
  .stats-header h1 {
    font-size: 1.5rem;
  }
  
  .stats-content section {
    padding: 20px;
  }
  
  .stats-content {
    gap: 24px;
  }
  
  .difficulty-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-card {
    padding: 12px;
    gap: 8px;
  }
  
  .percentile-circle {
    width: 80px;
    height: 80px;
  }
  
  .percentile-circle::before {
    width: 60px;
    height: 60px;
  }
  
  .percentile-value {
    font-size: 1.25rem;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .stat-card:hover {
    transform: none;
  }
  
  .stat-card:active {
    transform: scale(0.98);
    transition: transform 0.1s ease;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  
  .progress-fill {
    transition: none;
  }
  
  .stat-card:hover {
    transform: none;
  }
}
</style>