<template>
  <div class="quiz-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="quiz-header">
          <h1 class="page-title">퀴즈 게임</h1>
          <div class="quiz-stats">
            <div class="stat">
              <span class="stat-label">점수</span>
              <span class="stat-value">{{ authStore.userProgress?.quiz_score || 0 }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">연속 정답</span>
              <span class="stat-value">{{ authStore.userProgress?.quiz_streak || 0 }}</span>
            </div>
          </div>
        </div>

        <!-- Badge Display -->
        <BadgeDisplay />

        <div v-if="!gameStarted" class="game-start">
          <div class="start-card">
            <h2>퀴즈 게임을 시작해볼까요?</h2>
            <p>음성을 듣고 정답 이미지를 찾아보세요!</p>
            <button @click="startGame" class="btn btn-primary btn-lg">
              게임 시작하기
            </button>
          </div>
        </div>

        <div v-else-if="currentQuiz" class="quiz-game">
          <!-- 퀴즈 질문 패널을 최상단으로 이동 -->
          <div class="quiz-question">
            <h2>음성을 듣고 정답을 찾아보세요</h2>
            <button @click="playQuizAudio" class="audio-button" :class="{ playing: isPlaying }">
              <span class="audio-text">다시 듣기</span>
            </button>
          </div>

          <!-- 퀴즈 옵션들 -->
          <div class="quiz-options">
            <div 
              v-for="option in currentQuiz.options" 
              :key="option.id"
              @click="selectAnswer(option.id)"
              class="quiz-option"
              :class="{ 
                selected: selectedAnswer === option.id,
                correct: showResult && option.id === currentQuiz.correctAnswerId,
                incorrect: showResult && selectedAnswer === option.id && option.id !== currentQuiz.correctAnswerId
              }"
            >
              <img :src="getImageUrl(option.imageUrl)" :alt="option.name" />
              <div class="option-name">
                {{ store.currentLanguage === 'ko' ? option.name : option.nameEn }}
              </div>
            </div>
          </div>

          <div v-if="showResult" class="quiz-result">
            <div v-if="isCorrect" class="result-correct">
              <div class="celebration-container">
                <div class="celebration-text">정답입니다!</div>
                <div class="confetti" v-for="i in 20" :key="i" :style="getConfettiStyle(i)"></div>
              </div>
              <h3>잘했어요!</h3>
              <div v-if="newBadgeUnlocked" class="new-badge-notification">
                <div class="badge-unlock-text">새로운 뱃지 획득!</div>
                <div class="unlocked-badge">
                  <span class="unlocked-badge-icon">{{ newBadgeUnlocked.icon }}</span>
                  <span class="unlocked-badge-name">{{ newBadgeUnlocked.name }}</span>
                </div>
              </div>
            </div>
            <div v-else class="result-incorrect">
              <h3>다시 한번 도전해보세요!</h3>
            </div>
          </div>
        </div>

        <div v-else class="no-words">
          <h3>퀴즈할 단어가 부족합니다</h3>
          <p>최소 3개 이상의 단어가 필요합니다</p>
          <router-link to="/words" class="btn btn-primary">
            단어 학습하러 가기
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Navigation from '@/components/Navigation.vue';
import BadgeDisplay from '@/components/BadgeDisplay.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useAudio } from '@/composables/useAudio';
import { useFileUpload } from '@/composables/useFileUpload';
import type { Quiz, Badge } from '@/types';

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const { isPlaying, playAudio } = useAudio();
const { getUploadedFileUrl } = useFileUpload();

const gameStarted = ref(false);
const currentQuiz = ref<Quiz | null>(null);
const selectedAnswer = ref<string>('');
const showResult = ref(false);
const isCorrect = ref(false);
const newBadgeUnlocked = ref<Badge | null>(null);

const canStartGame = computed(() => store.currentWords.length >= 3);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const getAudioUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const startGame = () => {
  if (!canStartGame.value) return;
  gameStarted.value = true;
  generateNewQuiz();
};

const generateNewQuiz = () => {
  const words = store.currentWords;
  if (words.length < 3) return;

  // Select random correct answer
  const correctAnswer = words[Math.floor(Math.random() * words.length)];
  
  // Select 2 random wrong answers
  const wrongAnswers = words
    .filter(w => w.id !== correctAnswer.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);
  
  // Shuffle all options
  const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  
  const audioUrl = store.currentLanguage === 'ko' ? correctAnswer.audioKo : correctAnswer.audioEn;
  
  currentQuiz.value = {
    id: Date.now().toString(),
    audioUrl,
    correctAnswerId: correctAnswer.id,
    options,
    language: store.currentLanguage
  };
  
  selectedAnswer.value = '';
  showResult.value = false;
  isCorrect.value = false;
  newBadgeUnlocked.value = null;
  
  // Auto play audio
  setTimeout(() => {
    playQuizAudio();
  }, 500);
};

const playQuizAudio = () => {
  if (currentQuiz.value) {
    playAudio(currentQuiz.value.audioUrl);
  }
};

const selectAnswer = async (answerId: string) => {
  if (showResult.value) return;
  
  selectedAnswer.value = answerId;
  isCorrect.value = answerId === currentQuiz.value?.correctAnswerId;
  showResult.value = true;
  
  if (isCorrect.value) {
    console.log('🎯 Correct answer! Updating quiz score...');
    
    // Supabase에 진행도 업데이트
    if (authStore.userProgress) {
      const newScore = authStore.userProgress.quiz_score + 1;
      const newStreak = authStore.userProgress.quiz_streak + 1;
      
      await authStore.updateProgress({
        quiz_score: newScore,
        quiz_streak: newStreak
      });
      
      console.log('✅ Quiz progress updated in Supabase:', { score: newScore, streak: newStreak });
      
      // 뱃지 확인
      const unlockedBadges = await contentStore.checkBadgeUnlocks();
      if (unlockedBadges.length > 0) {
        newBadgeUnlocked.value = unlockedBadges[0];
        console.log('🏆 New badge unlocked:', newBadgeUnlocked.value.name);
      }
    }
    
    // Play success sound effect
    playSuccessSound();
    
    // Auto advance after celebration
    setTimeout(() => {
      generateNewQuiz();
    }, 3000);
    
  } else {
    console.log('❌ Wrong answer! Resetting quiz streak...');
    
    // Supabase에 연속 정답 리셋
    if (authStore.userProgress) {
      await authStore.updateProgress({
        quiz_streak: 0
      });
      console.log('✅ Quiz streak reset in Supabase');
    }
    
    // Play failure sound effect
    playFailureSound();
    
    // Auto advance after showing result
    setTimeout(() => {
      generateNewQuiz();
    }, 2000);
  }
};

const playSuccessSound = () => {
  // Create success sound using Web Audio API
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // Create a celebratory sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }
};

const playFailureSound = () => {
  // Create failure sound using Web Audio API
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    const sounds = [
      // Sound 1: Descending notes
      () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      },
      // Sound 2: Wobble effect
      () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      },
      // Sound 3: Cartoon-like boing
      () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2);
      }
    ];
    
    // Play random failure sound
    const randomSound = sounds[Math.floor(Math.random() * sounds.length)];
    randomSound();
  }
};

const getConfettiStyle = (index: number) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
  const randomColor = colors[index % colors.length];
  const randomDelay = Math.random() * 2;
  const randomDuration = 2 + Math.random() * 2;
  const randomX = Math.random() * 100;
  
  return {
    backgroundColor: randomColor,
    animationDelay: `${randomDelay}s`,
    animationDuration: `${randomDuration}s`,
    left: `${randomX}%`
  };
};

onMounted(() => {
  if (!canStartGame.value) {
    gameStarted.value = false;
  }
});
</script>

<style scoped>
.quiz-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.main-content {
  padding: var(--spacing-lg) 0; /* 상단 패딩을 줄여서 네비게이션과 더 가깝게 */
}

.quiz-header {
  text-align: center;
  margin-bottom: var(--spacing-lg); /* 헤더 하단 마진 줄임 */
}

.page-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: var(--spacing-lg);
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.quiz-stats {
  display: flex;
  justify-content: center;
  gap: var(--spacing-xl);
}

.stat {
  text-align: center;
  background: var(--color-bg-card);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  font-weight: 600;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--color-text-primary);
}

.game-start {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}

.start-card {
  text-align: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3xl);
  max-width: 500px;
}

.start-card h2 {
  font-size: 1.75rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  font-weight: 700;
}

.start-card p {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xl);
  font-size: 1.125rem;
  font-weight: 500;
}

.quiz-game {
  max-width: 800px;
  margin: 0 auto;
  /* 네비게이션 바로 아래 배치를 위한 상단 마진 제거 */
  margin-top: 0;
}

.quiz-question {
  text-align: center;
  margin-bottom: var(--spacing-xl); /* 하단 마진 줄임 */
  background: var(--color-bg-card);
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  /* 최상단 배치를 위한 order 설정 */
  order: -1;
  /* 네비게이션과 더 가깝게 배치 */
  margin-top: var(--spacing-md);
}

.quiz-question h2 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
  font-weight: 700;
}

.audio-button {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1.125rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
}

.audio-button:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
}

.audio-button.playing {
  animation: pulse 1s infinite;
}

.audio-text {
  color: white;
  font-weight: 700;
}

.quiz-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl); /* 하단 마진 줄임 */
}

.quiz-option {
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.quiz-option:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
}

.quiz-option.selected {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
}

.quiz-option.correct {
  border-color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
  animation: correctAnswer 0.6s ease;
}

.quiz-option.incorrect {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1);
  animation: incorrectAnswer 0.6s ease;
}

.quiz-option img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}

.option-name {
  padding: var(--spacing-md);
  font-weight: 700;
  color: var(--color-text-primary);
  font-size: 1.125rem;
}

.quiz-result {
  text-align: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl); /* 패딩 줄임 */
}

.celebration-container {
  position: relative;
  margin-bottom: var(--spacing-lg);
}

.celebration-text {
  font-size: 4rem;
  animation: celebration 1s ease;
  color: var(--color-text-primary);
  font-weight: 800;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confettiFall 3s linear infinite;
}

.result-correct h3 {
  color: var(--color-success);
  font-size: 1.75rem;
  margin-bottom: var(--spacing-lg);
  font-weight: 800;
}

.result-incorrect h3 {
  color: var(--color-text-primary);
  font-size: 1.75rem;
  margin-bottom: var(--spacing-lg);
  font-weight: 800;
}

.new-badge-notification {
  background: linear-gradient(135deg, var(--color-success), var(--color-secondary));
  color: white;
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin: var(--spacing-lg) 0;
  animation: badgeNotification 2s ease;
}

.badge-unlock-text {
  font-weight: 700;
  margin-bottom: var(--spacing-sm);
}

.unlocked-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.2);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}

.unlocked-badge-icon {
  font-size: 1.5rem;
}

.unlocked-badge-name {
  font-weight: 700;
  color: white;
}

.no-words {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.no-words h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
  font-weight: 700;
}

.no-words p {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xl);
  font-weight: 500;
}

@keyframes correctAnswer {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes incorrectAnswer {
  0% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
  100% { transform: translateX(0); }
}

@keyframes celebration {
  0% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-5deg); }
  50% { transform: scale(1.3) rotate(5deg); }
  75% { transform: scale(1.1) rotate(-2deg); }
  100% { transform: scale(1) rotate(0deg); }
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes badgeNotification {
  0% { 
    transform: scale(0.8) translateY(20px); 
    opacity: 0;
  }
  50% { 
    transform: scale(1.05) translateY(-5px); 
    opacity: 1;
  }
  100% { 
    transform: scale(1) translateY(0); 
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: var(--spacing-md) 0; /* 모바일에서도 상단 패딩 줄임 */
  }
  
  .quiz-stats {
    gap: var(--spacing-md);
  }
  
  .stat {
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .quiz-options {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .quiz-option img {
    height: 120px;
  }
  
  .start-card {
    padding: var(--spacing-xl);
    margin: 0 var(--spacing-md);
  }
  
  .quiz-question {
    padding: var(--spacing-md);
    margin-top: var(--spacing-sm); /* 모바일에서 더 가깝게 */
  }
  
  .quiz-question h2 {
    font-size: 1.25rem;
  }
  
  .audio-button {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 1rem;
  }
}
</style>