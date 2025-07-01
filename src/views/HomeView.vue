<template>
  <div class="home-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <section class="hero-section">
          <!-- 배경 이미지 레이어 -->
          <div class="hero-background">
            <img 
              :src="heroImageUrl" 
              :alt="authStore.siteName"
              class="background-image"
              @error="handleImageError"
              @load="handleImageLoad"
            />
            <div class="background-overlay"></div>
          </div>
          
          <!-- 콘텐츠 레이어 -->
          <div class="hero-content-wrapper">
            <div class="hero-content">
              <h1 class="hero-title fade-in">
                You are my heart outside my body.
              </h1>
              <p class="hero-description fade-in">
                {{ authStore.childAge }}세 {{ authStore.userProfile?.username }}님을 위한 맞춤형 학습 콘텐츠
              </p>
              
              <div class="hero-actions fade-in">
                <router-link to="/words" class="btn btn-primary btn-lg">
                  단어 학습하기
                </router-link>
                <router-link to="/quiz" class="btn btn-secondary btn-lg">
                  퀴즈 놀이
                </router-link>
              </div>
            </div>
            
            <!-- 플로팅 카드들 -->
            <div class="floating-cards">
              <div class="floating-card">
                <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Learning" />
              </div>
              <div class="floating-card delay-1">
                <img src="https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=300" alt="Cat" />
              </div>
            </div>
          </div>
        </section>

        <section class="features-section">
          <h2 class="section-title">{{ authStore.childAge }}세 맞춤 학습 모드</h2>
          
          <div class="features-grid">
            <div class="feature-card" v-for="feature in features" :key="feature.path">
              <router-link :to="feature.path" class="feature-link">
                <h3 class="feature-title">{{ feature.title }}</h3>
                <p class="feature-description">{{ feature.description }}</p>
                <div class="feature-stats">
                  <span class="stat">{{ feature.count }}개 콘텐츠</span>
                </div>
              </router-link>
            </div>
          </div>
        </section>

        <section class="stats-section">
          <div class="stats-grid" v-if="authStore.userProgress">
            <div class="stat-card">
              <div class="stat-value">{{ contentStore.words.length }}</div>
              <div class="stat-label">학습 단어</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ contentStore.books.length }}</div>
              <div class="stat-label">그림책</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ authStore.userProgress.quiz_score }}</div>
              <div class="stat-label">퀴즈 점수</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ authStore.userProgress.puzzle_completions }}</div>
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
import { computed, ref, watch } from 'vue';
import Navigation from '@/components/Navigation.vue';
import BadgeDisplay from '@/components/BadgeDisplay.vue';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useFileUpload } from '@/composables/useFileUpload';
import { useAppStore } from '@/stores/app';

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const { getUploadedFileUrl } = useFileUpload();

const imageLoadError = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const getImageUrl = (imageUrl: string) => {
  if (imageUrl.startsWith('/uploads/')) {
    return '/server' + imageUrl;
  }
  return imageUrl;
};

// FIXED: 강화된 메인 이미지 URL 계산 (새로고침 후에도 유지)
const heroImageUrl = computed(() => {
  // 이미지 로드 에러가 발생했으면 기본 이미지만 반환 (절대 다시 원래 값으로 돌아가지 않음)
  if (imageLoadError.value) {
    return getDefaultImage();
  }
  // 우선순위: userProfile.mainImageUrl > authStore.mainImageUrl > 기본 이미지
  const imageUrl = authStore.userProfile?.mainImageUrl || authStore.mainImageUrl;
  if (imageUrl) {
    return getImageUrl(imageUrl);
  }
  return getDefaultImage();
});

const getDefaultImage = () => {
  const defaultImage = 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=600';
  console.log('🔄 Using default image:', defaultImage);
  return defaultImage;
};

const handleImageError = (e?: Event) => {
  // 무한 루프 방지: 이미 에러 상태면 아무것도 하지 않음
  if (imageLoadError.value) return;
  imageLoadError.value = true;
};

const handleImageLoad = () => {
  // 에러 상태가 아니면만 loaded로 표시 (에러 상태면 무시)
  if (!imageLoadError.value) {
    console.log('✅ Hero image loaded successfully');
  }
};

// Watch for profile changes to reset image error state
watch(() => authStore.userProfile?.mainImageUrl, () => {
  imageLoadError.value = false;
});

const features = computed(() => [
  {
    title: '단어 학습',
    description: '이미지를 누르면 음성과 함께 단어를 배워요',
    path: '/words',
    count: contentStore.words.length
  },
  {
    title: '퀴즈 게임',
    description: '음성을 듣고 정답을 찾는 재미있는 퀴즈',
    path: '/quiz',
    count: Math.floor(contentStore.words.length / 3)
  },
  {
    title: '퍼즐 맞추기',
    description: '이미지 조각을 맞춰서 완성하는 퍼즐 게임',
    path: '/puzzle',
    count: contentStore.words.length
  },
  {
    title: '그림책',
    description: '재미있는 그림책 읽기',
    path: '/books',
    count: contentStore.books.length
  }
]);
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.main-content {
  flex: 1;
}

.hero-section {
  position: relative;
  min-height: 80vh;
  display: flex;
  align-items: center;
  overflow: hidden;
}

/* 배경 이미지 레이어 */
.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.background-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0.35; /* 투명도를 0.15에서 0.35로 증가 - 더 잘 보이도록 */
  filter: blur(0.5px); /* 블러 효과도 약간 줄임 */
  transition: opacity 0.3s ease; /* 이미지 로드 시 부드러운 전환 */
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    135deg, 
    rgba(15, 23, 42, 0.6) 0%, /* 오버레이 투명도도 약간 줄임 */
    rgba(30, 41, 59, 0.4) 50%,
    rgba(51, 65, 85, 0.2) 100%
  );
}

/* 콘텐츠 레이어 */
.hero-content-wrapper {
  position: relative;
  z-index: 2;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-3xl);
  align-items: center;
  padding: var(--spacing-3xl) 0;
}

.hero-content {
  z-index: 3;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.2;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5); /* 텍스트 그림자 강화 */
  animation-delay: 0.2s;
}

.hero-description {
  font-size: 1.4rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-2xl);
  line-height: 1.6;
  animation-delay: 0.4s;
  font-weight: 500;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5); /* 텍스트 그림자 강화 */
}

.hero-actions {
  display: flex;
  gap: var(--spacing-lg);
  animation-delay: 0.6s;
}

/* 플로팅 카드들 */
.floating-cards {
  position: relative;
  height: 400px;
  z-index: 3;
}

.floating-card {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  animation: float 3s ease-in-out infinite;
  border: 3px solid rgba(255, 255, 255, 0.3); /* 테두리도 약간 더 진하게 */
  backdrop-filter: blur(10px);
}

.floating-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-card:nth-child(1) {
  top: 20%;
  right: 20%;
  animation-delay: 0s;
}

.floating-card:nth-child(2) {
  top: 60%;
  right: 60%;
  animation-delay: 1s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
}

.features-section {
  padding: var(--spacing-3xl) 0;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: var(--spacing-2xl);
  color: var(--color-text-primary);
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-2xl);
}

.feature-card {
  transition: transform 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
}

.feature-link {
  display: block;
  text-decoration: none;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  text-align: center;
  transition: all 0.3s ease;
  height: 100%;
}

.feature-link:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-xl);
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.feature-description {
  color: var(--color-text-primary);
  line-height: 1.6;
  margin-bottom: var(--spacing-lg);
  font-weight: 500;
}

.feature-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
}

.stat {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
}

.stats-section {
  padding: var(--spacing-2xl) 0;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  margin: var(--spacing-2xl) 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-xl);
}

.stat-card {
  text-align: center;
  padding: var(--spacing-xl);
}

.stat-value {
  font-size: 2rem;
  font-weight: 800;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.stat-label {
  color: var(--color-text-primary);
  font-weight: 600;
}

@media (max-width: 768px) {
  .hero-content-wrapper {
    grid-template-columns: 1fr;
    gap: var(--spacing-xl);
    text-align: center;
    padding: var(--spacing-2xl) 0;
  }
  
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-description {
    font-size: 1.125rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
  }
  
  .floating-cards {
    height: 200px;
    order: -1;
  }
  
  .floating-card {
    width: 80px;
    height: 80px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .feature-link {
    padding: var(--spacing-xl);
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .stat-card {
    padding: var(--spacing-md);
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}
</style>