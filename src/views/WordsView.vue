<template>
  <div class="words-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">{{$t('page.title')}}</h1>
          <p class="page-description">
            {{$t('page.desc', { lang: store.currentLanguage === 'ko' ? '한국어' : '영어' })}}
          </p>
        </div>

        <div class="content-controls">
          <div class="view-mode-toggle">
            <button 
              @click="viewMode = 'grid'"
              class="btn btn-sm"
              :class="viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'"
            >
              📱 전체보기
            </button>
            <button 
              @click="viewMode = 'single'"
              class="btn btn-sm"
              :class="viewMode === 'single' ? 'btn-primary' : 'btn-secondary'"
            >
              🎯 학습모드
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

            <div class="learning-controls">
              <button 
                @click="previousWord" 
                :disabled="currentWordIndex === 0"
                class="btn btn-lg btn-secondary"
              >
                {{$t('page.prev')}}
              </button>
              
              <button 
                @click="shuffleWords"
                class="btn btn-lg btn-secondary"
              >
                {{$t('page.shuffle')}}
              </button>
              
              <button 
                @click="nextWord" 
                :disabled="currentWordIndex === filteredWords.length - 1"
                class="btn btn-lg btn-secondary"
              >
                {{$t('page.next')}}
              </button>
            </div>

            <div class="learning-header">
              <div class="learning-desc">{{$t('page.singleDesc')}}</div>
              <div class="content-count">{{$t('page.contentCount', { count: filteredWords.length })}}</div>
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
                  <span class="toggle-text">{{$t('page.autoAdvance')}}</span>
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
          <h3>{{$t('page.emptyTitle')}}</h3>
          <p>{{$t('page.emptyDesc')}}</p>
          <router-link to="/admin" class="btn btn-primary">{{$t('page.adminBtn')}}</router-link>
        </div>
      </div>
    </main>

    <div class="content-controls">
      <div class="view-mode-toggle">
        <button 
          @click="viewMode = 'grid'"
          class="btn btn-sm"
          :class="viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'"
        >
          📱 전체보기
        </button>
        <button 
          @click="viewMode = 'single'"
          class="btn btn-sm"
          :class="viewMode === 'single' ? 'btn-primary' : 'btn-secondary'"
        >
          🎯 학습모드
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
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import Navigation from '@/components/Navigation.vue';
import WordCard from '@/components/WordCard.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useI18n } from 'vue-i18n';

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();
const { t, messages } = useI18n();

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

const getCategoryName = (category: string) => {
  const categoryNames: Record<string, string> = {
    'all': '전체',
    'animals': '동물',
    'fruits': '과일',
    'vehicles': '탈것',
    'objects': '사물',
    'nature': '자연',
    'toys': '장난감',
    'clothes': '옷'
  };
  return categoryNames[category] || category;
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
    const newWordsLearned = authStore.userProgress.words_learned + 1;
    
    await authStore.updateProgress({
      words_learned: newWordsLearned
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

onMounted(() => {
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
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.main-content {
  padding: var(--spacing-2xl) 0;
  padding-bottom: 150px; /* Adjust based on content-controls height */
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.content-controls {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-card);
  border-top: 1px solid var(--color-border);
  z-index: 999;
}

.view-mode-toggle {
  display: flex;
  gap: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 2px;
}

.category-filter {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  justify-content: center;
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

@media (max-width: 640px) {
  .words-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: var(--spacing-lg);
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
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
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
  margin-bottom: var(--spacing-2xl);
}

.single-word-card :deep(.word-card) {
  transform: scale(1.1);
  max-width: 400px;
  margin: 0 auto;
}

.learning-controls {
  display: flex;
  justify-content: space-around;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-xl);
}

.learning-controls .btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md); /* Smaller padding */
  font-size: 0.875rem; /* Smaller font size */
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

@media (max-width: 768px) {
  .main-content {
    padding: var(--spacing-lg) 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .words-grid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: var(--spacing-lg);
  }
  
  .category-filter {
    gap: var(--spacing-xs);
  }
  
  .category-filter .btn {
    padding: var(--spacing-sm) var(--spacing-md);
    font-size: 0.875rem;
  }

  .learning-container {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 150px); /* Adjust based on header height */
  }

  .learning-header {
    flex-shrink: 0;
  }

  .single-word-card {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--spacing-md);
    min-height: 0; /* Prevent flexbox overflow */
  }

  .single-word-card :deep(.word-card) {
    transform: none;
    max-width: none;
    width: 100%;
    height: 100%;
  }
  
  .learning-controls {
    flex-shrink: 0;
    display: flex;
    justify-content: space-around;
    gap: var(--spacing-sm);
  }
  
  .learning-controls .btn {
    flex: 1;
    padding: var(--spacing-sm) var(--spacing-md); /* Smaller padding */
    font-size: 0.875rem; /* Smaller font size */
  }
  
  .auto-advance-progress {
    bottom: var(--spacing-md);
    left: var(--spacing-md);
    right: var(--spacing-md);
    transform: none;
    min-width: auto;
  }
}
</style>