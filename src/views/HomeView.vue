<template>
  <div class="home-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <section class="hero-section">
          <!-- 배경 이미지 레이어 -->
          <div class="hero-background">
            <div 
              v-for="(image, index) in backgroundImages" 
              :key="index"
              class="bg-image"
              :style="{ 
                backgroundImage: `url(${image})`,
                animationDelay: `${index * 2}s`
              }"
            ></div>
          </div>
          
          
          <!-- 콘텐츠 레이어 -->
          <div class="hero-content">
            <div class="hero-badge">
              {{ $t('home.ageCustomized', { age: authStore.childAge }) }}
            </div>
            <h1 class="hero-title fade-in">
              {{ $t('home.title') }}
            </h1>
            <p class="hero-description fade-in">
              {{ $t('home.description') }}
            </p>

            <div class="hero-actions fade-in">
              <router-link to="/words" class="btn btn-primary btn-lg">
                {{ $t('home.startWords') }}
              </router-link>
              <router-link to="/quiz" class="btn btn-secondary btn-lg">
                {{ $t('home.startQuiz') }}
              </router-link>
            </div>
          </div>

          <!-- 플로팅 카드들 -->
          <div class="floating-cards">
            <div 
              v-for="(card, index) in floatingCards" 
              :key="index"
              class="floating-card"
              :class="`delay-${index + 1}`"
              :style="{ 
                animationDelay: `${index * 0.5}s`
              }"
            >
              <img :src="card.image" :alt="card.alt" />
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
              <div class="stat-value">{{ contentStore.words.length }}</div>
              <div class="stat-label">학습 단어</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ contentStore.books.length }}</div>
              <div class="stat-label">그림책</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">{{ authStore.userProgress.quizScore }}</div>
              <div class="stat-label">퀴즈 점수</div>
            </div>
            <div class="stat-card">
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
import { computed, onMounted, ref } from 'vue';
import Navigation from '@/components/Navigation.vue';
import BadgeDisplay from '@/components/BadgeDisplay.vue';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';

const authStore = useAuthStore();
const contentStore = useContentStore();


// 플로팅 카드들 (사용자 저장 이미지)
const floatingCards = ref<Array<{
  image: string;
  alt: string;
}>>([]);

// 배경 이미지들
const backgroundImages = ref<string[]>([]);


// 플로팅 카드 생성 (사용자 저장 이미지 기반)
const generateFloatingCards = () => {
  const availableImages = contentStore.words
    .filter(word => word.imageUrl)
    .slice(0, 6)
    .map(word => ({
      image: getImageUrl(word.imageUrl),
      alt: word.name
    }));
  
  // 기본 이미지들과 함께
  const defaultCards = [
    {
      image: "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300",
      alt: "Learning"
    },
    {
      image: "https://images.pexels.com/photos/104827/cat-pet-animal-domestic-104827.jpeg?auto=compress&cs=tinysrgb&w=300", 
      alt: "Cat"
    }
  ];
  
  floatingCards.value = [...availableImages.slice(0, 3), ...defaultCards].slice(0, 4);
};

// 배경 이미지 생성
const generateBackgroundImages = () => {
  const userImages = contentStore.words
    .filter(word => word.imageUrl)
    .slice(0, 3)
    .map(word => getImageUrl(word.imageUrl));
  
  if (userImages.length > 0) {
    // 사용자가 등록한 이미지가 있으면 그것을 사용
    backgroundImages.value = userImages;
  } else {
    // 없으면 고정된 교육용 이미지 사용
    backgroundImages.value = [
      "https://images.pexels.com/photos/1092730/pexels-photo-1092730.jpeg?auto=compress&cs=tinysrgb&w=1200" // 아이들이 공부하는 모습
    ];
  }
};

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

onMounted(() => {
  generateFloatingCards();
  generateBackgroundImages();
});

const features = computed(() => [
  {
    title: '단어 학습',
    description: '이미지를 누르면 음성과 함께 단어를 배워요',
    path: '/words',
    count: contentStore.words.length,
    icon: ''
  },
  {
    title: '퀴즈 게임',
    description: '음성을 듣고 정답을 찾는 재미있는 퀴즈',
    path: '/quiz',
    count: Math.floor(contentStore.words.length / 3),
    icon: ''
  },
  {
    title: '퍼즐 맞추기',
    description: '이미지 조각을 맞춰서 완성하는 퍼즐 게임',
    path: '/puzzle',
    count: contentStore.words.length,
    icon: ''
  },
  {
    title: '그림책',
    description: '재미있는 그림책 읽기',
    path: '/books',
    count: contentStore.books.length,
    icon: ''
  }
]);
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
  overflow-x: hidden;
  width: 100%;
}

.main-content {
  flex: 1;
  overflow-x: hidden;
  width: 100%;
}

.hero-section {
  padding: 120px 0 80px;
  text-align: center;
  position: relative;
  overflow: hidden;
  min-height: 80vh;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0;
  animation: fadeInOut 6s ease-in-out infinite;
}


.hero-content {
  position: relative;
  z-index: 3;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
  padding: 0 20px;
}

.floating-cards {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 2;
}

.floating-card {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  animation: floatCard 6s ease-in-out infinite;
  opacity: 0.7;
}

.floating-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-card:nth-child(1) {
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.floating-card:nth-child(2) {
  top: 60%;
  right: 15%;
  animation-delay: 1s;
}

.floating-card:nth-child(3) {
  top: 30%;
  right: 5%;
  animation-delay: 2s;
}

.floating-card:nth-child(4) {
  bottom: 25%;
  left: 5%;
  animation-delay: 1.5s;
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
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  margin-bottom: 40px;
  line-height: 1.6;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.hero-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
  width: 100%;
  max-width: 100%;
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
  width: 100%;
  overflow-x: hidden;
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

@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 80px 0 60px;
    overflow-x: hidden;
  }
  
  .hero-title {
    font-size: 2.5rem;
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  
  .hero-description {
    font-size: 1rem;
  }
  
  .hero-actions {
    flex-direction: column;
    align-items: center;
    width: 100%;
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

/* 애니메이션 키프레임 */
@keyframes fadeInOut {
  0%, 100% { opacity: 0; }
  16.66%, 83.33% { opacity: 0.15; }
  50% { opacity: 0.25; }
}


@keyframes floatCard {
  0%, 100% { 
    transform: translateY(0px) rotate(0deg); 
    opacity: 0.5; 
  }
  50% { 
    transform: translateY(-15px) rotate(2deg); 
    opacity: 0.8; 
  }
}

.fade-in {
  opacity: 0;
  animation: fadeInUp 0.8s ease forwards;
}

.fade-in:nth-child(1) { animation-delay: 0.2s; }
.fade-in:nth-child(2) { animation-delay: 0.4s; }
.fade-in:nth-child(3) { animation-delay: 0.6s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 모바일에서 애니메이션 단순화 */
@media (max-width: 768px) {
  .hero-content {
    padding: 40px 20px;
  }
  
  .floating-card {
    width: 80px;
    height: 80px;
  }
  
  
  .hero-section {
    min-height: 70vh;
  }
}

@media (max-width: 480px) {
  .hero-content {
    padding: 30px 16px;
  }
  
  .floating-cards {
    display: none; /* 작은 화면에서는 플로팅 카드 숨김 */
  }
  
  .hero-section {
    min-height: 60vh;
  }
}

/* 애니메이션 감소 설정을 선호하는 사용자를 위한 처리 */
@media (prefers-reduced-motion: reduce) {
  .bg-image,
  .floating-card,
  .fade-in {
    animation: none;
  }
  
  .floating-card {
    opacity: 0.7;
  }
  
  .fade-in {
    opacity: 1;
  }
}
</style>