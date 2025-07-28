<template>
  <div class="quiz-stats-content">
    <div v-if="isLoading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>통계를 불러오는 중...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p class="error-message">{{ error }}</p>
      <button @click="loadStats" class="btn btn-primary">다시 시도</button>
    </div>

    <div v-else class="stats-content">
      <!-- 새로고침 버튼 -->
      <div class="refresh-section">
        <button @click="loadStats" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? '로딩 중...' : '새로고침' }}
        </button>
        <p class="last-updated">마지막 업데이트: {{ lastUpdated }}</p>
      </div>

      <!-- 기본 통계 -->
      <section class="basic-stats">
        <h2>기본 통계</h2>
        <div class="debug-info">
          <p>데이터 길이: {{ recentQuizResults.length }}</p>
          <p>로딩 상태: {{ isLoading }}</p>
          <p>에러: {{ error }}</p>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-content">
              <h3>총 문제 수</h3>
              <p class="stat-value">{{ totalQuestions }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
              <h3>정답 수</h3>
              <p class="stat-value">{{ correctAnswers }}</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <h3>정답률</h3>
              <p class="stat-value">{{ overallAccuracy }}%</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <div class="stat-content">
              <h3>연속 정답</h3>
              <p class="stat-value">{{ currentStreak }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 최근 500문제 통계 -->
      <section v-if="recentQuizResults.length > 0" class="recent-stats">
        <h2>최근 {{ Math.min(recentQuizResults.length, 500) }}문제 통계</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <h3>최근 정답률</h3>
              <p class="stat-value">{{ recentAccuracy }}%</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⏱️</div>
            <div class="stat-content">
              <h3>평균 응답 시간</h3>
              <p class="stat-value">{{ averageResponseTime }}초</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 최근 활동 -->
      <section v-if="recentQuizResults.length > 0" class="recent-activity">
        <h2>최근 활동</h2>
        <div class="activity-list">
          <div 
            v-for="result in recentQuizResults.slice(0, 10)" 
            :key="result.id"
            class="activity-item"
          >
            <div class="activity-icon" :class="{ correct: result.isCorrect }">
              {{ result.isCorrect ? '✓' : '✗' }}
            </div>
            <div class="activity-content">
              <p class="activity-question">{{ result.questionText }}</p>
              <p class="activity-answer">정답: {{ result.correctAnswer }} / 선택: {{ result.userAnswer }}</p>
              <p class="activity-time">{{ formatDateTime(result.createdAt) }}</p>
            </div>
            <div class="activity-result" :class="{ correct: result.isCorrect }">
              {{ result.isCorrect ? '정답' : '오답' }}
            </div>
          </div>
        </div>
      </section>

      <!-- 데이터가 없는 경우 -->
      <section v-if="recentQuizResults.length === 0" class="no-data">
        <h2>아직 퀴즈 데이터가 없습니다</h2>
        <p>퀴즈를 풀어보세요!</p>
        <router-link to="/quiz" class="btn btn-primary">퀴즈 풀기</router-link>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useQuizTracking } from '@/composables/useQuizTracking';
import type { QuizResult } from '@/types';

const authStore = useAuthStore();
const { 
  getRecentQuizResults, 
  calculateRecentAccuracy,
  isLoading,
  error
} = useQuizTracking();

// 상태 관리
const recentQuizResults = ref<QuizResult[]>([]);
const lastUpdated = ref<string>('');

// 계산된 통계
const totalQuestions = computed(() => {
  const total = recentQuizResults.value.length;
  console.log('📊 Total questions:', total);
  return total;
});

const correctAnswers = computed(() => {
  const results = recentQuizResults.value;
  console.log('🔍 Analyzing results for correct answers:', results.length, 'total results');
  
  // 각 결과를 개별적으로 확인
  results.forEach((result, index) => {
    console.log(`Result ${index + 1}:`, {
      isCorrect: result.isCorrect,
      correctAnswer: result.correctAnswer,
      userAnswer: result.userAnswer,
      typeof_isCorrect: typeof result.isCorrect,
      value_isCorrect: result.isCorrect
    });
  });
  
  const correct = results.filter(r => r.isCorrect === true).length;
  console.log('✅ Correct answers count:', correct);
  
  return correct;
});

const overallAccuracy = computed(() => {
  const total = totalQuestions.value;
  const correct = correctAnswers.value;
  
  console.log('📈 Calculating accuracy:', { total, correct });
  
  if (total === 0) return 0;
  const accuracy = Math.round((correct / total) * 100);
  
  console.log('🎯 Final accuracy:', accuracy, '%');
  return accuracy;
});

const recentAccuracy = computed(() => 
  calculateRecentAccuracy(recentQuizResults.value, 500)
);

const averageResponseTime = computed(() => {
  if (recentQuizResults.value.length === 0) return 0;
  const totalTime = recentQuizResults.value.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0);
  return Math.round(totalTime / recentQuizResults.value.length / 1000 * 10) / 10;
});

const currentStreak = computed(() => {
  const results = recentQuizResults.value;
  console.log('🔥 Calculating current streak from', results.length, 'results');
  
  let streak = 0;
  for (const result of results) {
    console.log('🔍 Checking streak result:', { isCorrect: result.isCorrect, typeof: typeof result.isCorrect });
    if (result.isCorrect === true) {
      streak++;
    } else {
      break;
    }
  }
  
  console.log('🔥 Current streak:', streak);
  return streak;
});

// 날짜 포맷팅
const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// 통계 로드
const loadStats = async () => {
  if (!authStore.user) {
    console.error('❌ No authenticated user');
    return;
  }
  
  try {
    console.log('📊 Loading quiz statistics for user:', authStore.user.id);
    const results = await getRecentQuizResults(authStore.user.id, 1000);
    
    // 이미 useQuizTracking에서 변환된 데이터를 사용
    recentQuizResults.value = results;
    lastUpdated.value = new Date().toLocaleString('ko-KR');
    
    console.log('✅ Quiz statistics loaded:', {
      totalResults: results.length,
      correctAnswers: results.filter(r => r.isCorrect === true).length,
      sampleResults: results.slice(0, 3)
    });
    
    // 강제로 reactive 업데이트 트리거
    console.log('🔄 Forcing reactive update...');
    
    // 다음 틱에서 computed가 다시 계산되도록 강제
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (err) {
    console.error('❌ Failed to load quiz statistics:', err);
  }
};

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.quiz-stats-content {
  padding: 0;
}

.loading-state, .error-state, .no-data {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.loading-spinner {
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

.error-message {
  color: var(--color-danger);
  margin-bottom: var(--spacing-md);
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.refresh-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.last-updated {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  margin: 0;
}

.basic-stats h2, .recent-stats h2, .recent-activity h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-md);
}

.stat-content h3 {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-primary);
  margin: 0;
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
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
}

.activity-item:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  background: var(--color-danger);
  flex-shrink: 0;
}

.activity-icon.correct {
  background: var(--color-success);
}

.activity-content {
  flex: 1;
}

.activity-question {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.activity-answer {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
}

.activity-time {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.activity-result {
  font-weight: 700;
  color: var(--color-danger);
  flex-shrink: 0;
}

.activity-result.correct {
  color: var(--color-success);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .stat-card {
    padding: var(--spacing-md);
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--spacing-sm);
  }
}
</style>