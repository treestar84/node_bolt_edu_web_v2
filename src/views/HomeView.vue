<template>
  <div class="home-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <section class="hero-section">
          <div class="hero-content">
            <div class="hero-badge">
              {{ authStore.childAge }}세 맞춤 학습
            </div>
            <h1 class="hero-title">
              즐겁게 배우는<br />
              우리 아이 첫 학습
            </h1>
            <p class="hero-description">
              이미지와 소리로 배우는 재미있는 한글 학습.<br />
              아이들의 호기심을 자극하는 인터랙티브 학습 경험을 제공합니다.
            </p>
            
            <div class="hero-actions">
              <router-link to="/words" class="btn btn-primary">
                학습 시작하기
              </router-link>
              <router-link to="/quiz" class="btn btn-secondary">
                퀴즈 놀이
              </router-link>
            </div>
          </div>
        </section>

        <section class="features-section">
          <div class="section-header">
            <h2 class="section-title">학습 프로그램</h2>
            <p class="section-subtitle">아이의 성장에 맞춘 단계별 학습 콘텐츠</p>
          </div>
          
          <div class="features-grid">
            <div class="feature-card" v-for="feature in features" :key="feature.path">
              <router-link :to="feature.path" class="feature-link">
                <div class="feature-icon">{{ feature.icon }}</div>
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
                <div class="feature-count">{{ feature.count }}개</div>
              </router-link>
            </div>
          </div>
        </section>

        <section class="stats-section" v-if="authStore.userProgress">
          <div class="section-header">
            <h2 class="section-title">학습 현황</h2>
            <p class="section-subtitle">지금까지의 학습 성과를 확인해보세요</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">📖</div>
              <div class="stat-value">{{ contentStore.words.length }}</div>
              <div class="stat-label">학습 단어</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📚</div>
              <div class="stat-value">{{ contentStore.books.length }}</div>
              <div class="stat-label">그림책</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎯</div>
              <div class="stat-value">{{ authStore.userProgress.quizScore }}</div>
              <div class="stat-label">퀴즈 점수</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🧩</div>
              <div class="stat-value">{{ authStore.userProgress.puzzleCompletions }}</div>
              <div class="stat-label">퍼즐 완성</div>
            </div>
          </div>
        </section>

        <!-- Badge Display -->
        <BadgeDisplay />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Navigation from '@/components/Navigation.vue';
import BadgeDisplay from '@/components/BadgeDisplay.vue';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';

const authStore = useAuthStore();
const contentStore = useContentStore();


const features = computed(() => [
  {
    title: '단어 학습',
    description: '이미지를 누르면 음성과 함께 단어를 배워요',
    path: '/words',
    count: contentStore.words.length,
    icon: '📖'
  },
  {
    title: '퀴즈 게임',
    description: '음성을 듣고 정답을 찾는 재미있는 퀴즈',
    path: '/quiz',
    count: Math.floor(contentStore.words.length / 3),
    icon: '🎯'
  },
  {
    title: '퍼즐 맞추기',
    description: '이미지 조각을 맞춰서 완성하는 퍼즐 게임',
    path: '/puzzle',
    count: contentStore.words.length,
    icon: '🧩'
  },
  {
    title: '그림책',
    description: '재미있는 그림책 읽기',
    path: '/books',
    count: contentStore.books.length,
    icon: '📚'
  }
]);
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  flex: 1;
}

.hero-section {
  padding: 120px 0 80px;
  text-align: center;
}

.hero-content {
  max-width: 640px;
  margin: 0 auto;
}

.hero-badge {
  display: inline-block;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  padding: 8px 16px;
  border-radius: 24px;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1.1;
  margin-bottom: 24px;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.hero-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin-bottom: 40px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.features-section {
  padding: 80px 0;
}

.section-header {
  text-align: center;
  margin-bottom: 64px;
}

.section-title {
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.section-subtitle {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 32px;
}

.feature-card {
  transition: transform 0.2s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
}

.feature-link {
  display: block;
  text-decoration: none;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  transition: all 0.2s ease;
  height: 100%;
}

.feature-link:hover {
  border-color: var(--color-border-dark);
  box-shadow: var(--shadow-lg);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 20px;
  display: block;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.feature-description {
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 20px;
  font-size: 0.875rem;
}

.feature-count {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
  display: inline-block;
}

.stats-section {
  padding: 80px 0;
  background: var(--color-bg-secondary);
  border-radius: 24px;
  margin: 80px 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 32px;
}

.stat-card {
  text-align: center;
  padding: 32px 24px;
  background: var(--color-bg-primary);
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

.stat-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
  display: block;
}

.stat-value {
  font-size: 2.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.stat-label {
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .hero-section {
    padding: 80px 0 60px;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-description {
    font-size: 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }

  .hero-actions .btn {
    width: 100%;
    max-width: 280px;
  }
  
  .features-section {
    padding: 60px 0;
  }
  
  .section-header {
    margin-bottom: 48px;
  }
  
  .section-title {
    font-size: 1.875rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .feature-link {
    padding: 24px 20px;
  }
  
  .stats-section {
    padding: 60px 0;
    margin: 60px 0;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .stat-card {
    padding: 24px 16px;
  }
  
  .stat-value {
    font-size: 1.875rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    padding: 60px 0 40px;
  }
  
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-badge {
    padding: 6px 12px;
    font-size: 0.75rem;
  }
  
  .features-section {
    padding: 40px 0;
  }
  
  .section-title {
    font-size: 1.5rem;
  }
  
  .section-subtitle {
    font-size: 1rem;
  }
  
  .stats-section {
    padding: 40px 0;
    margin: 40px 0;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}
</style>