<template>
  <div class="quiz-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="quiz-header">
          <h1 class="page-title">{{$t('quiz.title')}}</h1>
        </div>

        <div v-if="!gameStarted" class="game-start">
          <div class="start-card">
            <h2>{{$t('quiz.start')}}</h2>
            <p>{{$t('quiz.findAnswer')}}</p>
            <button @click="startGame" class="btn btn-primary btn-lg">
              {{$t('quiz.startGame')}}
            </button>
          </div>
        </div>

        <div v-else-if="currentQuiz" class="quiz-game">
          <!-- 콤팩트한 퀴즈 질문 패널 -->
          <div class="quiz-question-compact">
            <div class="question-content">
              <h2>{{$t('quiz.findAnswer')}}</h2>
              <button @click="playQuizAudio" class="audio-button-compact" :class="{ playing: isPlaying }">
                <span class="audio-icon">🔊</span>
                <span class="audio-text">{{$t('quiz.listen')}}</span>
              </button>
            </div>
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
                <div class="celebration-text">{{$t('quiz.correct')}}</div>
                <div class="confetti" v-for="i in 20" :key="i" :style="getConfettiStyle(i)"></div>
              </div>
              <h3>{{$t('quiz.correct')}}</h3>
              <div v-if="newBadgeUnlocked" class="new-badge-notification">
                <div class="badge-unlock-text">{{$t('quiz.badge')}}</div>
                <div class="unlocked-badge">
                  <span class="unlocked-badge-icon">{{ newBadgeUnlocked.icon }}</span>
                  <span class="unlocked-badge-name">{{ newBadgeUnlocked.name }}</span>
                </div>
              </div>
            </div>
            <div v-else class="result-incorrect">
              <h3>{{$t('quiz.wrong')}}</h3>
            </div>
          </div>
        </div>

        <div v-else class="no-words">
          <h3>{{$t('quiz.notEnough')}}</h3>
          <p>{{$t('quiz.needThree')}}</p>
          <router-link to="/words" class="btn btn-primary">
            {{$t('quiz.goWords')}}
          </router-link>
        </div>

        <!-- Quiz Stats -->
        <div class="quiz-footer-stats">
          <div class="quiz-stats">
            <div class="stat">
              <span class="stat-label">{{$t('quiz.score')}}</span>
              <span class="stat-value">{{ authStore.userProgress?.quizScore || 0 }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">{{$t('quiz.streak')}}</span>
              <span class="stat-value">{{ authStore.userProgress?.quizStreak || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Navigation from '@/components/Navigation.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useAudio } from '@/composables/useAudio';
import { useQuizTracking } from '@/composables/useQuizTracking';
import { useGameSounds } from '@/composables/useGameSounds';
import type { Quiz, Badge } from '@/types';

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const { isPlaying, playAudio } = useAudio();
const { saveQuizResult } = useQuizTracking();
const { playSuccessSound, playFailureSound } = useGameSounds();

const gameStarted = ref(false);
const currentQuiz = ref<Quiz | null>(null);
const selectedAnswer = ref<string>('');
const showResult = ref(false);
const isCorrect = ref(false);
const newBadgeUnlocked = ref<Badge | null>(null);

const canStartGame = computed(() => store.currentWords.length >= 3);

const getImageUrl = (url: string): string => {
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
    // 정답 단어 객체 찾기
    const correctOption = currentQuiz.value.options.find(opt => opt.id === currentQuiz.value?.correctAnswerId);
    const fallbackText = store.currentLanguage === 'ko' ? correctOption?.name : correctOption?.nameEn;
    playAudio(currentQuiz.value.audioUrl, fallbackText);
  }
};

const selectAnswer = async (answerId: string) => {
  if (showResult.value) return;
  
  const responseStartTime = Date.now();
  selectedAnswer.value = answerId;
  isCorrect.value = answerId === currentQuiz.value?.correctAnswerId;
  showResult.value = true;
  
  // 퀴즈 결과를 새로운 quiz_results 테이블에 저장
  if (currentQuiz.value && authStore.user) {
    const correctOption = currentQuiz.value.options.find(opt => opt.id === currentQuiz.value?.correctAnswerId);
    const selectedOption = currentQuiz.value.options.find(opt => opt.id === answerId);
    
    const quizResultData = {
      userId: authStore.user.id,
      quizType: 'word_quiz' as 'word_quiz' | 'book_quiz' | 'general_quiz',
      questionId: currentQuiz.value.id,
      questionText: '이 소리에 맞는 그림을 찾아보세요',
      correctAnswer: correctOption?.name || '',
      userAnswer: selectedOption?.name || '',
      isCorrect: isCorrect.value,
      responseTimeMs: Date.now() - responseStartTime,
      difficultyLevel: 1
    };
    
    console.log('💾 Saving quiz result:', quizResultData);
    
    try {
      const savedResult = await saveQuizResult(quizResultData);
      console.log('✅ Quiz result saved to database:', savedResult);
    } catch (error: any) {
      console.error('❌ Failed to save quiz result:', error);
      console.error('Error details:', error.message);
    }
  } else {
    console.error('❌ Cannot save quiz result - missing data:', {
      currentQuiz: !!currentQuiz.value,
      user: !!authStore.user,
      userId: authStore.user?.id
    });
  }
  
  if (isCorrect.value) {
    console.log('🎯 Correct answer! Updating quiz score...');
    
    // Supabase에 진행도 업데이트 (기존 시스템과 호환성 유지)
    if (authStore.userProgress) {
      const currentScore = authStore.userProgress.quizScore || 0;
      const currentStreak = authStore.userProgress.quizStreak || 0;
      const newScore = currentScore + 1;
      const newStreak = currentStreak + 1;
      
      console.log('📊 Current progress:', { 
        currentScore, 
        currentStreak, 
        newScore, 
        newStreak 
      });
      
      await authStore.updateProgress({
        quizScore: newScore,
        quizStreak: newStreak
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
      console.log('📊 Resetting quiz streak...');
      
      await authStore.updateProgress({
        quizStreak: 0
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
  background: var(--color-bg-primary);
}

.main-content {
  padding: 40px 0;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: calc(100vh - 80px);
}

.quiz-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.quiz-stats {
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 100%;
}

.stat {
  flex: 1;
  text-align: center;
  background: #2a2a2a;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.quiz-footer-stats {
  background: #1a1a1a;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 8px;
  margin-top: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.stat-label {
  display: block;
  font-size: 0.7rem;
  color: #cccccc;
  margin-bottom: 2px;
  font-weight: 500;
}

.stat-value {
  display: block;
  font-size: 1rem;
  font-weight: 700;
  color: #ffffff;
}

.game-start {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-grow: 1; /* Allow it to grow and take available space */
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

.quiz-question-compact {
  background: #1a1a1a;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.question-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.question-content h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #ffffff;
  font-weight: 700;
  flex: 1;
}

.audio-button-compact {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.audio-button-compact:hover {
  background: #0056b3;
  transform: translateY(-1px);
}

.audio-button-compact.playing {
  animation: pulse 1s infinite;
}

.audio-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .question-content {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .question-content h2 {
    font-size: 1.1rem;
  }
  
  .audio-button-compact {
    align-self: center;
  }
}

.audio-text {
  color: white;
  font-weight: 600;
}

.quiz-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

@media (max-width: 768px) {
  .quiz-options {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .quiz-options {
    grid-template-columns: 1fr;
  }
}

.quiz-option {
  background: #2a2a2a;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
}

.quiz-option:hover {
  transform: translateY(-2px);
  border-color: #007bff;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.4);
}

.quiz-option.selected {
  border-color: #007bff;
  box-shadow: 0 6px 12px rgba(0, 123, 255, 0.3);
}

.quiz-option.correct {
  border-color: #28a745;
  background: rgba(40, 167, 69, 0.1);
  animation: correctAnswer 0.6s ease;
}

.quiz-option.incorrect {
  border-color: #dc3545;
  background: rgba(220, 53, 69, 0.1);
  animation: incorrectAnswer 0.6s ease;
}

.quiz-option img {
  width: 100%;
  height: 160px;
  object-fit: cover;
}

.option-name {
  padding: 10px 12px;
  font-weight: 600;
  color: #ffffff;
  font-size: 0.9rem;
  line-height: 1.2;
}

.quiz-result {
  text-align: center;
  background: #1a1a1a;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.celebration-container {
  position: relative;
  margin-bottom: 12px;
}

.celebration-text {
  font-size: 2.5rem;
  animation: celebration 1s ease;
  color: #ffffff;
  font-weight: 700;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  animation: confettiFall 3s linear infinite;
}

.result-correct h3 {
  color: #28a745;
  font-size: 1.25rem;
  margin-bottom: 12px;
  font-weight: 700;
}

.result-incorrect h3 {
  color: #dc3545;
  font-size: 1.25rem;
  margin-bottom: 12px;
  font-weight: 700;
}

.new-badge-notification {
  background: linear-gradient(135deg, var(--color-success), var(--color-secondary));
  color: var(--color-text-white);
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
  color: var(--color-text-white);
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

/* Tablet optimizations */
@media (max-width: 1024px) {
  .main-content {
    padding: 20px 0;
    min-height: calc(100vh - 80px);
    justify-content: center;
  }
  
  .quiz-header {
    margin-bottom: 20px;
    flex-shrink: 0;
  }
  
  .page-title {
    font-size: 1.75rem;
    margin-bottom: 12px;
  }
  
  .quiz-stats {
    gap: 12px;
    margin-bottom: 24px;
  }
  
  .stat {
    padding: 8px 12px;
    font-size: 0.875rem;
  }
  
  .quiz-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }
  
  .quiz-content {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 0;
  }
  
  .quiz-options {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .quiz-option {
    max-width: none;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
  }
  
  .quiz-option img {
    height: 200px;
    flex: 1;
    object-fit: cover;
  }
  
  .option-name {
    font-size: 0.875rem;
    padding: 8px;
    flex-shrink: 0;
  }
  
  .quiz-footer-stats {
    padding: 12px;
    flex-shrink: 0;
  }
}

/* Mobile optimizations */
@media (max-width: 768px) {
  .main-content {
    padding: var(--spacing-md) 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .quiz-stats {
    gap: var(--spacing-md);
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .stat {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.9rem;
  }
  
  .quiz-options {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .quiz-option {
    max-width: none;
  }
  
  .quiz-option img {
    height: 180px;
  }
  
  .option-name {
    padding: var(--spacing-md);
    font-size: 1rem;
  }
  
  .start-card {
    padding: var(--spacing-xl);
    margin: 0 var(--spacing-md);
  }
  
  .quiz-question {
    padding: var(--spacing-md);
    margin-top: var(--spacing-sm);
  }
  
  .quiz-question h2 {
    font-size: 1.25rem;
  }
  
  .audio-button {
    padding: var(--spacing-md) var(--spacing-lg);
    font-size: 1rem;
    min-height: 44px;
  }
  
  .quiz-result {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
  }
  
  .celebration-text {
    font-size: 3rem;
  }
  
  .result-correct h3,
  .result-incorrect h3 {
    font-size: 1.5rem;
  }
}

/* Small mobile optimizations */
@media (max-width: 480px) {
  .quiz-options {
    gap: var(--spacing-sm);
  }
  
  .quiz-option img {
    height: 140px;
  }
  
  .option-name {
    padding: var(--spacing-sm);
    font-size: 0.9rem;
  }
  
  .start-card {
    padding: var(--spacing-lg);
    margin: 0 var(--spacing-sm);
  }
  
  .audio-button {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.9rem;
  }
  
  .celebration-text {
    font-size: 2.5rem;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .quiz-option {
    min-height: 44px;
  }
  
  .quiz-option:hover {
    transform: none;
  }
  
  .quiz-option:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
  
  .audio-button {
    min-height: 44px;
  }
  
  .audio-button:hover {
    transform: none;
  }
  
  .audio-button:active {
    transform: scale(0.95);
  }
}
</style>