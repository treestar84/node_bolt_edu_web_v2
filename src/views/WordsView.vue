<template>
  <div class="words-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">

        <div class="content-controls">
          <div class="view-mode-toggle">
            <button 
              @click="viewMode = 'grid'"
              class="btn btn-sm"
              :class="viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'"
            >
              📱 {{ $t('words.gridView') }}
            </button>
            <button 
              @click="viewMode = 'single'"
              class="btn btn-sm"
              :class="viewMode === 'single' ? 'btn-primary' : 'btn-secondary'"
            >
              🎯 {{ $t('words.learningMode') }}
            </button>
          </div>
          
          <div class="category-filter">
            <button 
              v-for="category in categories" 
              :key="category"
              @click="selectedCategory = category"
              class="btn btn-sm"
              :class="selectedCategory === category ? 'btn-primary' : 'btn-secondary'"
            >
              {{$t('categories.'+category)}}
            </button>
          </div>
        </div>

        <!-- Grid View Mode -->
        <div v-if="viewMode === 'grid'" class="grid-view">
          <div class="words-grid" v-if="paginatedWords.length > 0">
            <WordCard 
              v-for="word in paginatedWords" 
              :key="word.id" 
              :word="word"
              class="fade-in"
              @audio-played="handleWordLearned"
            />
          </div>

          <!-- Pagination for Grid View -->
          <div v-if="totalPages > 1" class="pagination">
            <button 
              @click="currentPage--" 
              :disabled="currentPage === 1"
              class="btn btn-secondary"
            >
              ← 이전
            </button>
            
            <div class="page-info">
              {{ currentPage }} / {{ totalPages }}
            </div>
            
            <button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages"
              class="btn btn-secondary"
            >
              다음 →
            </button>
          </div>
        </div>

        <!-- Single Card Learning Mode -->
        <div v-else-if="viewMode === 'single'" class="single-view">
          <div v-if="filteredWords.length > 0" class="learning-container">
            <div class="single-word-card">
              <WordCard 
                :word="currentWord" 
                class="large-card"
                @audio-played="handleAudioPlayed"
              />
            </div>


            <div class="learning-header">
              <div class="learning-desc">{{$t('words.singleDesc')}}</div>
              <div class="content-count">{{$t('words.contentCount', { count: filteredWords.length })}}</div>
              <div class="progress-info">
                <span class="current-word">{{ currentWordIndex + 1 }} / {{ filteredWords.length }}</span>
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${((currentWordIndex + 1) / filteredWords.length) * 100}%` }"
                  ></div>
                </div>
              </div>
              
              <div class="auto-advance-controls">
                <label class="auto-advance-toggle">
                  <input 
                    type="checkbox" 
                    v-model="autoAdvanceEnabled"
                    @change="toggleAutoAdvance"
                  />
                  <span class="toggle-text">{{$t('words.autoAdvance')}}</span>
                </label>
              </div>
            </div>

            <!-- Auto-advance progress indicator -->
            <div v-if="autoAdvanceEnabled && autoAdvanceProgress > 0" class="auto-advance-progress">
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${autoAdvanceProgress}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="filteredWords.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>{{$t('words.emptyTitle')}}</h3>
          <p>{{$t('words.emptyDesc')}}</p>
          <router-link to="/admin" class="btn btn-primary">{{$t('words.adminBtn')}}</router-link>
        </div>
      </div>
    </main>

    <div class="content-controls">
      <div class="footer-top-row">
        <h1 class="footer-title">{{$t('words.title')}}</h1>
        <div class="view-mode-toggle">
          <button 
            @click="viewMode = 'grid'"
            class="btn btn-sm"
            :class="viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'"
          >
            전체보기
          </button>
          <button 
            @click="viewMode = 'single'"
            class="btn btn-sm"
            :class="viewMode === 'single' ? 'btn-primary' : 'btn-secondary'"
          >
            학습모드
          </button>
        </div>
      </div>
      
      <div class="footer-bottom-row">
        <div v-if="viewMode === 'single' && filteredWords.length > 0" class="learning-controls">
          <button 
            @click="previousWord" 
            :disabled="currentWordIndex === 0"
            class="btn btn-sm btn-secondary"
          >
            {{$t('common.prev')}}
          </button>
          
          <button 
            @click="shuffleWords"
            class="btn btn-sm btn-secondary"
          >
            {{$t('words.shuffle')}}
          </button>
          
          <button 
            @click="nextWord" 
            :disabled="currentWordIndex === filteredWords.length - 1"
            class="btn btn-sm btn-secondary"
          >
            {{$t('common.next')}}
          </button>
        </div>
        
        <div class="category-filter">
          <button 
            v-for="category in categories" 
            :key="category"
            @click="selectedCategory = category"
            class="btn btn-sm"
            :class="selectedCategory === category ? 'btn-primary' : 'btn-secondary'"
          >
            {{$t('categories.'+category)}}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import Navigation from '@/components/Navigation.vue';
import WordCard from '@/components/WordCard.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useLikes } from '@/composables/useLikes';
import { useI18n } from 'vue-i18n';

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const { loadLikes } = useLikes();
const { messages } = useI18n();

const selectedCategory = ref('all');
const viewMode = ref<'grid' | 'single'>('single'); // Default to learning mode
const currentPage = ref(1);
const currentWordIndex = ref(0);
const autoAdvanceEnabled = ref(true);
const autoAdvanceProgress = ref(0);
const autoAdvanceTimer = ref<NodeJS.Timeout | null>(null);
const progressTimer = ref<NodeJS.Timeout | null>(null);
const learnedWordsSet = ref(new Set<string>());

const itemsPerPage = 10;

const categories = computed(() => Object.keys(messages.value[store.currentLanguage].categories));

const filteredWords = computed(() => {
  let words = selectedCategory.value === 'all' 
    ? [...contentStore.words] 
    : contentStore.words.filter(w => w.category === selectedCategory.value);
  
  // Shuffle words for learning mode
  if (viewMode.value === 'single') {
    return shuffleArray(words);
  }
  
  return words;
});

const totalPages = computed(() => {
  return Math.ceil(filteredWords.value.length / itemsPerPage);
});

const paginatedWords = computed(() => {
  if (viewMode.value !== 'grid') return [];
  
  const start = (currentPage.value - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  return filteredWords.value.slice(start, end);
});

const currentWord = computed(() => {
  return filteredWords.value[currentWordIndex.value];
});

const shuffleArray = <T>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};



const previousWord = () => {
  if (currentWordIndex.value > 0) {
    clearAutoAdvanceTimers();
    currentWordIndex.value--;
  }
};

const nextWord = () => {
  if (currentWordIndex.value < filteredWords.value.length - 1) {
    clearAutoAdvanceTimers();
    currentWordIndex.value++;
  } else {
    // End of words, restart from beginning
    currentWordIndex.value = 0;
  }
};

const shuffleWords = () => {
  clearAutoAdvanceTimers();
  currentWordIndex.value = 0;
  // Force re-computation of filteredWords
  const temp = selectedCategory.value;
  selectedCategory.value = '';
  selectedCategory.value = temp;
};

const handleAudioPlayed = () => {
  if (autoAdvanceEnabled.value && viewMode.value === 'single') {
    startAutoAdvanceTimer();
  }
  handleWordLearned();
};

const handleWordLearned = async () => {
  const word = currentWord.value || paginatedWords.value[0];
  if (!word || learnedWordsSet.value.has(word.id)) return;
  
  learnedWordsSet.value.add(word.id);
  console.log('📚 Word learned:', word.name);
  
  // Supabase에 단어 학습 진행도 업데이트
  if (authStore.userProgress) {
    const newWordsLearned = authStore.userProgress.wordsLearned + 1;
    
    await authStore.updateProgress({
      wordsLearned: newWordsLearned
    });
    
    console.log('✅ Words learned progress updated in Supabase:', { wordsLearned: newWordsLearned });
    
    // 뱃지 확인
    const unlockedBadges = await contentStore.checkBadgeUnlocks();
    if (unlockedBadges.length > 0) {
      console.log('🏆 New word learning badge unlocked:', unlockedBadges[0].name);
    }
  }
};

const startAutoAdvanceTimer = () => {
  if (!autoAdvanceEnabled.value) return;
  
  clearAutoAdvanceTimers();
  autoAdvanceProgress.value = 0;
  
  const totalTime = 3000; // 3 seconds
  const progressInterval = 50; // Update every 50ms
  const progressStep = (progressInterval / totalTime) * 100;
  
  progressTimer.value = setInterval(() => {
    autoAdvanceProgress.value += progressStep;
    if (autoAdvanceProgress.value >= 100) {
      clearInterval(progressTimer.value!);
    }
  }, progressInterval);
  
  autoAdvanceTimer.value = setTimeout(() => {
    nextWord();
  }, totalTime);
};

const clearAutoAdvanceTimers = () => {
  if (autoAdvanceTimer.value) {
    clearTimeout(autoAdvanceTimer.value);
    autoAdvanceTimer.value = null;
  }
  if (progressTimer.value) {
    clearInterval(progressTimer.value);
    progressTimer.value = null;
  }
  autoAdvanceProgress.value = 0;
};

const toggleAutoAdvance = () => {
  if (!autoAdvanceEnabled.value) {
    clearAutoAdvanceTimers();
  }
};

// Watch for category changes
watch(selectedCategory, () => {
  currentPage.value = 1;
  currentWordIndex.value = 0;
  clearAutoAdvanceTimers();
});

// Watch for view mode changes
watch(viewMode, () => {
  currentPage.value = 1;
  currentWordIndex.value = 0;
  clearAutoAdvanceTimers();
});

onMounted(async () => {
  // Load likes for authenticated users
  if (authStore.isAuthenticated) {
    await loadLikes();
  }
  
  // Auto-start learning mode
  if (viewMode.value === 'single' && filteredWords.value.length > 0) {
    setTimeout(() => {
      if (autoAdvanceEnabled.value) {
        startAutoAdvanceTimer();
      }
    }, 2000);
  }
});

onUnmounted(() => {
  clearAutoAdvanceTimers();
});
</script>

<style scoped>
.autoplay-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.overlay-content {
  background: white;
  padding: var(--spacing-xl);
  border-radius: var(--radius-lg);
  text-align: center;
}

.overlay-content h2 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
}

.overlay-content p {
  margin-bottom: var(--spacing-lg);
}

.words-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  padding: 40px 0 120px;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.page-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.content-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background: var(--color-bg-primary);
  border-top: 1px solid var(--color-border);
  z-index: 999;
  backdrop-filter: blur(8px);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
}

.footer-top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.footer-bottom-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  gap: 16px;
}

.view-mode-toggle {
  display: flex;
  gap: 4px;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 4px;
  border: 1px solid var(--color-border);
}

.category-filter {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
  max-width: 100%;
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

/* Responsive grid adjustments */
@media (max-width: 1200px) {
  .words-grid {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .words-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
}

@media (max-width: 640px) {
  .words-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .words-grid {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.page-info {
  background: var(--color-bg-card);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  font-weight: 500;
}

.learning-container {
  max-width: 500px;
  margin: 0 auto;
  text-align: center;
  padding: 0 20px;
}

.learning-header.compact {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md) var(--spacing-lg);
}

.learning-header .progress-info {
  flex-grow: 1;
}

.learning-header .current-word {
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xs);
}

.learning-desc {
  font-size: 1.125rem;
  color: var(--color-text-primary);
}

.content-count {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.current-word {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
  transition: width 0.3s ease;
}

.auto-advance-controls {
  display: flex;
  justify-content: center;
}

.auto-advance-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.auto-advance-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.single-word-card {
  margin-bottom: 32px;
}

.single-word-card :deep(.word-card) {
  max-width: 400px;
  margin: 0 auto;
}

.learning-controls {
  display: flex;
  gap: 8px;
}

.learning-controls .btn {
  min-width: 80px;
  padding: 8px 12px;
  font-size: 0.75rem;
}

.auto-advance-progress {
  position: fixed;
  bottom: var(--spacing-lg);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-lg);
  min-width: 250px;
  text-align: center;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

/* Tablet styles */
@media (max-width: 1024px) {
  .main-content {
    padding: 16px 0 60px;
    min-height: calc(100vh - 80px);
    display: flex;
    flex-direction: column;
  }
  
  .page-title {
    font-size: 1.75rem;
    margin-bottom: 16px;
  }
  
  .content-controls {
    padding: 12px 16px;
    gap: 8px;
    flex-shrink: 0;
  }
  
  .learning-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 600px;
    padding: 0 20px;
  }
}

/* Mobile styles */
@media (max-width: 768px) {
  .main-content {
    padding: 24px 0 120px;
  }
  
  .content-controls {
    padding: 12px;
    gap: 8px;
  }
  
  .footer-top-row {
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
  
  .footer-title {
    font-size: 1.125rem;
  }
  
  .footer-bottom-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .category-filter {
    gap: 6px;
  }
  
  .category-filter .btn {
    padding: 6px 10px;
    font-size: 0.75rem;
  }

  .learning-container {
    padding: 0 16px;
    max-width: none;
  }

  .single-word-card :deep(.word-card) {
    max-width: 350px;
  }
  
  .learning-controls {
    gap: 6px;
  }
  
  .learning-controls .btn {
    min-width: 70px;
    padding: 6px 10px;
    font-size: 0.75rem;
  }
}

/* Small mobile styles */
@media (max-width: 480px) {
  .main-content {
    padding: 20px 0 140px;
  }
  
  .learning-container {
    padding: 0 12px;
  }

  .single-word-card :deep(.word-card) {
    max-width: 300px;
  }
  
  .content-controls {
    padding: 8px;
  }
  
  .footer-title {
    font-size: 1rem;
  }
  
  .view-mode-toggle {
    gap: 2px;
  }
  
  .view-mode-toggle .btn {
    font-size: 0.75rem;
    padding: 6px 10px;
  }
  
  .learning-controls .btn {
    min-width: 60px;
    padding: 6px 8px;
    font-size: 0.7rem;
  }
}
</style>