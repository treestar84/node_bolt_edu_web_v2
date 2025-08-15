<template>
  <div class="translation-progress">
    <!-- 전체 진행 상황 헤더 -->
    <div class="progress-header">
      <div class="header-content">
        <div class="status-icon" :class="getOverallStatusClass()">
          <span v-if="status.currentPhase === 'idle'">⭐</span>
          <span v-else-if="status.currentPhase === 'completed'">🎉</span>
          <span v-else-if="status.currentPhase === 'error'">❌</span>
          <div v-else class="spinner-large"></div>
        </div>
        <div class="header-text">
          <h3 class="progress-title">{{ getOverallStatusTitle() }}</h3>
          <p class="progress-subtitle">{{ getOverallStatusDescription() }}</p>
        </div>
        <div class="progress-percentage">
          <span class="percentage-text">{{ Math.round(status.overallProgress) }}%</span>
        </div>
      </div>
      
      <!-- 전체 진행률 바 -->
      <div class="progress-bar-container">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${status.overallProgress}%` }"
            :class="getProgressBarClass()"
          ></div>
        </div>
      </div>
    </div>

    <!-- 단계별 진행 상황 -->
    <div class="phases-container" v-if="status.currentPhase !== 'idle'">
      <!-- Phase 1: 이미지 검색 -->
      <div 
        class="phase-item" 
        :class="{ 
          active: status.currentPhase === 'image',
          completed: status.phaseProgress.image.status === 'completed',
          failed: status.phaseProgress.image.status === 'failed'
        }"
      >
        <div class="phase-header">
          <div class="phase-icon">
            <span v-if="status.phaseProgress.image.status === 'completed'">✅</span>
            <span v-else-if="status.phaseProgress.image.status === 'failed'">❌</span>
            <div v-else-if="status.currentPhase === 'image'" class="spinner"></div>
            <span v-else class="pending-icon">📸</span>
          </div>
          <div class="phase-info">
            <h4 class="phase-title">{{ t('multiLang.imageSearch') }}</h4>
            <p class="phase-description">{{ getPhaseDescription('image') }}</p>
          </div>
          <div class="phase-progress">
            <span class="progress-text">{{ status.phaseProgress.image.progress }}%</span>
          </div>
        </div>
        
        <!-- 이미지 검색 결과 미리보기 -->
        <div 
          v-if="status.phaseProgress.image.generatedImageUrl" 
          class="image-preview"
        >
          <img 
            :src="status.phaseProgress.image.generatedImageUrl" 
            :alt="t('multiLang.generatedImage')"
            class="preview-image"
          />
          <div class="image-info">
            <span class="info-label">{{ t('multiLang.foundImage') }}</span>
            <button 
              @click="regenerateImage" 
              class="regenerate-btn"
              :disabled="status.currentPhase === 'image'"
            >
              🔄 {{ t('multiLang.findDifferentImage') }}
            </button>
          </div>
        </div>
        
        <div class="phase-progress-bar">
          <div 
            class="phase-bar-fill" 
            :style="{ width: `${status.phaseProgress.image.progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Phase 2: 자동 번역 -->
      <div 
        class="phase-item translation-phase" 
        :class="{ 
          active: status.currentPhase === 'translation',
          completed: status.phaseProgress.translation.status === 'completed',
          failed: status.phaseProgress.translation.status === 'failed'
        }"
      >
        <div class="phase-header">
          <div class="phase-icon">
            <span v-if="status.phaseProgress.translation.status === 'completed'">✅</span>
            <span v-else-if="status.phaseProgress.translation.status === 'failed'">❌</span>
            <div v-else-if="status.currentPhase === 'translation'" class="spinner"></div>
            <span v-else class="pending-icon">🌍</span>
          </div>
          <div class="phase-info">
            <h4 class="phase-title">{{ t('multiLang.autoTranslation') }}</h4>
            <p class="phase-description">{{ getPhaseDescription('translation') }}</p>
          </div>
          <div class="phase-progress">
            <span class="progress-text">
              {{ status.phaseProgress.translation.completedLanguages.length }}/{{ targetLanguagesCount }}
            </span>
          </div>
        </div>

        <!-- 번역 진행 상황 그리드 -->
        <div 
          v-if="status.currentPhase === 'translation' || status.phaseProgress.translation.status === 'completed'" 
          class="translation-grid"
        >
          <div 
            v-for="(lang, code) in remainingLanguages" 
            :key="code"
            class="translation-item"
            :class="{ 
              completed: status.phaseProgress.translation.completedLanguages.includes(code),
              active: status.phaseProgress.translation.currentLanguage === code,
              failed: status.phaseProgress.translation.failedLanguages.includes(code),
              pending: !isTranslationStarted(code)
            }"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-name">{{ lang.name }}</span>
            <div class="translation-result">
              <span v-if="translationResults && translationResults[code]" class="translated-text">
                {{ translationResults[code].name }}
              </span>
              <span v-else-if="status.phaseProgress.translation.currentLanguage === code" class="translating">
                번역 중...
              </span>
              <span v-else-if="status.phaseProgress.translation.failedLanguages.includes(code)" class="failed">
                실패
              </span>
              <span v-else class="waiting">대기</span>
            </div>
            <div v-if="translationResults && translationResults[code]" class="confidence-indicator">
              <div class="confidence-bar">
                <div 
                  class="confidence-fill" 
                  :style="{ width: `${(translationResults?.[code]?.confidence || 0) * 100}%` }"
                  :class="getConfidenceClass(translationResults?.[code]?.confidence || 0)"
                ></div>
              </div>
              <span class="confidence-text">{{ Math.round((translationResults?.[code]?.confidence || 0) * 100) }}%</span>
            </div>
          </div>
        </div>
        
        <div class="phase-progress-bar">
          <div 
            class="phase-bar-fill" 
            :style="{ width: `${status.phaseProgress.translation.progress}%` }"
          ></div>
        </div>
      </div>

      <!-- Phase 3: TTS 테스트 -->
      <div 
        class="phase-item tts-phase" 
        :class="{ 
          active: status.currentPhase === 'tts',
          completed: status.phaseProgress.tts.status === 'completed',
          failed: status.phaseProgress.tts.status === 'failed'
        }"
      >
        <div class="phase-header">
          <div class="phase-icon">
            <span v-if="status.phaseProgress.tts.status === 'completed'">✅</span>
            <span v-else-if="status.phaseProgress.tts.status === 'failed'">❌</span>
            <div v-else-if="status.currentPhase === 'tts'" class="spinner"></div>
            <span v-else class="pending-icon">🎤</span>
          </div>
          <div class="phase-info">
            <h4 class="phase-title">{{ t('multiLang.ttsTest') }}</h4>
            <p class="phase-description">{{ getPhaseDescription('tts') }}</p>
          </div>
          <div class="phase-progress">
            <span class="progress-text">
              {{ status.phaseProgress.tts.testedLanguages.length }}/{{ allLanguagesCount }}
            </span>
          </div>
        </div>

        <!-- TTS 테스트 결과 -->
        <div 
          v-if="status.currentPhase === 'tts' || status.phaseProgress.tts.status === 'completed'" 
          class="tts-test-grid"
        >
          <button 
            v-for="result in ttsTestResults" 
            :key="result.languageCode"
            @click="testTTSPlayback(result.languageCode, result.text)"
            class="tts-test-button"
            :class="{ 
              playing: playingTTSLanguage === result.languageCode,
              supported: status.phaseProgress.tts.supportedLanguages.includes(result.languageCode),
              tested: status.phaseProgress.tts.testedLanguages.includes(result.languageCode)
            }"
            :disabled="isTestingTTS"
          >
            <span class="tts-flag">{{ SUPPORTED_LANGUAGES[result.languageCode as SupportedLanguageCode]?.flag }}</span>
            <span class="tts-text">{{ result.text }}</span>
            <div class="tts-status">
              <span v-if="playingTTSLanguage === result.languageCode" class="playing-indicator">🔊</span>
              <span v-else-if="status.phaseProgress.tts.supportedLanguages.includes(result.languageCode)" class="supported-indicator">✓</span>
              <span v-else class="unsupported-indicator">✗</span>
            </div>
          </button>
        </div>
        
        <div class="phase-progress-bar">
          <div 
            class="phase-bar-fill" 
            :style="{ width: `${status.phaseProgress.tts.progress}%` }"
          ></div>
        </div>
      </div>
    </div>

    <!-- 완료 상태 요약 -->
    <div 
      v-if="status.currentPhase === 'completed'" 
      class="completion-summary"
    >
      <div class="summary-header">
        <div class="celebration-icon">🎉</div>
        <h3 class="summary-title">{{ t('multiLang.processingComplete') }}</h3>
        <p class="summary-subtitle">{{ t('multiLang.allTasksCompleted') }}</p>
      </div>
      
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-icon">🌍</span>
          <span class="stat-number">{{ Object.keys(props.translationResults || {}).length }}</span>
          <span class="stat-label">{{ t('multiLang.languagesTranslated') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📸</span>
          <span class="stat-number">1</span>
          <span class="stat-label">{{ t('multiLang.imageFound') }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎤</span>
          <span class="stat-number">{{ status.phaseProgress.tts.supportedLanguages.length }}</span>
          <span class="stat-label">{{ t('multiLang.voicesReady') }}</span>
        </div>
      </div>

      <div class="next-steps">
        <button @click="$emit('customize')" class="btn btn-secondary">
          <span class="btn-icon">🎨</span>
          {{ t('multiLang.customizeResults') }}
        </button>
        <button @click="$emit('save')" class="btn btn-primary">
          <span class="btn-icon">💾</span>
          {{ t('multiLang.saveWord') }}
        </button>
      </div>
    </div>

    <!-- 에러 상태 -->
    <div 
      v-if="status.currentPhase === 'error'" 
      class="error-state"
    >
      <div class="error-content">
        <div class="error-icon">💥</div>
        <h3 class="error-title">{{ t('multiLang.processingError') }}</h3>
        <p class="error-message">{{ status.error?.message || t('multiLang.unknownError') }}</p>
        
        <div class="error-actions">
          <button @click="$emit('retry')" class="btn btn-warning">
            <span class="btn-icon">🔄</span>
            {{ t('multiLang.retryProcessing') }}
          </button>
          <button @click="$emit('save-partial')" class="btn btn-secondary">
            <span class="btn-icon">💾</span>
            {{ t('multiLang.savePartialResults') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { AutoProcessingStatus, TranslationResult, TTSTestResult, SupportedLanguageCode } from '@/types/multilingual';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import { useMultiLangAudio } from '@/composables/useMultiLangAudio';

// Props
interface Props {
  status: AutoProcessingStatus;
  translationResults?: Record<string, TranslationResult>;
  ttsTestResults?: TTSTestResult[];
  remainingLanguages?: Record<string, any>;
}

const props = defineProps<Props>();
const { t } = useI18n();

// Emits
interface Emits {
  (e: 'regenerate-image'): void;
  (e: 'customize'): void;
  (e: 'save'): void;
  (e: 'retry'): void;
  (e: 'save-partial'): void;
  (e: 'test-tts', languageCode: string, text: string): void;
}

const emit = defineEmits<Emits>();

// Audio system
const { speakText } = useMultiLangAudio();

// State
const isTestingTTS = ref(false);
const playingTTSLanguage = ref('');

// Computed properties
const targetLanguagesCount = computed(() => 
  props.remainingLanguages ? Object.keys(props.remainingLanguages).length : 8
);

const allLanguagesCount = computed(() => 
  targetLanguagesCount.value + 2 // 원본 2개 언어 + 번역된 언어들
);

// Methods
const getOverallStatusClass = () => {
  switch (props.status.currentPhase) {
    case 'completed': return 'completed';
    case 'error': return 'error';
    case 'idle': return 'idle';
    default: return 'processing';
  }
};

const getOverallStatusTitle = () => {
  switch (props.status.currentPhase) {
    case 'idle': return '처리 준비 중';
    case 'image': return '이미지 검색 중...';
    case 'translation': return '자동 번역 중...';
    case 'tts': return 'TTS 테스트 중...';
    case 'completed': return '모든 처리 완료!';
    case 'error': return '처리 중 오류 발생';
    default: return '처리 중...';
  }
};

const getOverallStatusDescription = () => {
  switch (props.status.currentPhase) {
    case 'idle': return '자동 처리를 시작할 준비가 되었습니다';
    case 'image': return 'Pexels에서 최적의 이미지를 검색하고 있습니다';
    case 'translation': return `${targetLanguagesCount.value}개 언어로 동시 번역을 진행하고 있습니다`;
    case 'tts': return '각 언어별 TTS 음성 품질을 확인하고 있습니다';
    case 'completed': return `총 ${allLanguagesCount.value}개 언어로 완벽하게 준비되었습니다!`;
    case 'error': return '일부 처리에서 문제가 발생했습니다';
    default: return '자동 처리가 진행 중입니다...';
  }
};

const getProgressBarClass = () => {
  switch (props.status.currentPhase) {
    case 'completed': return 'completed';
    case 'error': return 'error';
    default: return 'processing';
  }
};

const getPhaseDescription = (phase: string) => {
  switch (phase) {
    case 'image':
      if (props.status.phaseProgress.image.status === 'completed') {
        return '이미지 검색 완료';
      } else if (props.status.phaseProgress.image.status === 'failed') {
        return '이미지 검색 실패';
      } else if (props.status.currentPhase === 'image') {
        return 'Pexels API로 최적 이미지 검색 중...';
      } else {
        return '이미지 자동 검색 대기 중';
      }
    case 'translation':
      if (props.status.phaseProgress.translation.status === 'completed') {
        return `${props.status.phaseProgress.translation.completedLanguages.length}개 언어 번역 완료`;
      } else if (props.status.phaseProgress.translation.status === 'failed') {
        return '일부 번역 실패';
      } else if (props.status.currentPhase === 'translation') {
        const currentLang = props.status.phaseProgress.translation.currentLanguage;
        if (currentLang && currentLang in SUPPORTED_LANGUAGES) {
          return `${SUPPORTED_LANGUAGES[currentLang as SupportedLanguageCode].name} 번역 중...`;
        }
        return '다국어 번역 진행 중...';
      } else {
        return '자동 번역 대기 중';
      }
    case 'tts':
      if (props.status.phaseProgress.tts.status === 'completed') {
        return `${props.status.phaseProgress.tts.supportedLanguages.length}개 언어 TTS 지원`;
      } else if (props.status.phaseProgress.tts.status === 'failed') {
        return 'TTS 테스트 실패';
      } else if (props.status.currentPhase === 'tts') {
        return '브라우저 TTS 호환성 테스트 중...';
      } else {
        return 'TTS 품질 테스트 대기 중';
      }
    default:
      return '';
  }
};

const getConfidenceClass = (confidence: number) => {
  if (confidence >= 0.9) return 'high';
  if (confidence >= 0.7) return 'medium';
  return 'low';
};

const isTranslationStarted = (languageCode: string) => {
  return (
    props.status.phaseProgress.translation.completedLanguages.includes(languageCode) ||
    props.status.phaseProgress.translation.failedLanguages.includes(languageCode) ||
    props.status.phaseProgress.translation.currentLanguage === languageCode
  );
};

const regenerateImage = () => {
  emit('regenerate-image');
};

const testTTSPlayback = async (languageCode: string, text: string) => {
  if (isTestingTTS.value) return;
  
  isTestingTTS.value = true;
  playingTTSLanguage.value = languageCode;
  
  try {
    await speakText(text, languageCode);
    emit('test-tts', languageCode, text);
  } catch (error) {
    console.error(`TTS playback failed for ${languageCode}:`, error);
  } finally {
    isTestingTTS.value = false;
    playingTTSLanguage.value = '';
  }
};
</script>

<style scoped>
.translation-progress {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.progress-header {
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.status-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  flex-shrink: 0;
}

.status-icon.idle {
  background: var(--color-bg-tertiary);
}

.status-icon.processing {
  background: var(--color-primary-light);
  color: var(--color-primary);
}

.status-icon.completed {
  background: var(--color-success-light);
  color: var(--color-success);
}

.status-icon.error {
  background: var(--color-danger-light);
  color: var(--color-danger);
}

.header-text {
  flex: 1;
}

.progress-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-xs) 0;
}

.progress-subtitle {
  color: var(--color-text-secondary);
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
}

.progress-percentage {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
  min-width: 80px;
}

.progress-bar-container {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: var(--radius-sm);
}

.progress-fill.processing {
  background: var(--color-primary);
  animation: shimmer 2s infinite;
}

.progress-fill.completed {
  background: var(--color-success);
}

.progress-fill.error {
  background: var(--color-danger);
}

.phases-container {
  padding: var(--spacing-lg);
}

.phase-item {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.phase-item:last-child {
  margin-bottom: 0;
}

.phase-item.active {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: rgba(99, 102, 241, 0.02);
}

.phase-item.completed {
  border-color: var(--color-success);
  background: rgba(34, 197, 94, 0.05);
}

.phase-item.failed {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.05);
}

.phase-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.phase-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-primary);
  border: 2px solid var(--color-border);
  font-size: 1.25rem;
}

.phase-info {
  flex: 1;
}

.phase-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 4px 0;
}

.phase-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.phase-progress .progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.phase-progress-bar {
  margin-top: var(--spacing-md);
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.phase-bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

/* 이미지 미리보기 */
.image-preview {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  margin-bottom: var(--spacing-md);
}

.preview-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.image-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.regenerate-btn {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: flex-start;
}

.regenerate-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.regenerate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 번역 진행 그리드 */
.translation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.translation-item {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.translation-item.completed {
  border-color: var(--color-success);
  background: rgba(34, 197, 94, 0.05);
}

.translation-item.active {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.05);
}

.translation-item.failed {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.05);
}

.translation-item.pending {
  opacity: 0.6;
}

.lang-flag {
  font-size: 1.25rem;
  margin-right: var(--spacing-xs);
}

.lang-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: 4px;
}

.translation-result .translated-text {
  font-weight: 600;
  color: var(--color-text-primary);
}

.translation-result .translating {
  color: var(--color-primary);
  font-style: italic;
}

.translation-result .failed {
  color: var(--color-danger);
  font-style: italic;
}

.translation-result .waiting {
  color: var(--color-text-tertiary);
  font-style: italic;
}

.confidence-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-top: 4px;
}

.confidence-bar {
  flex: 1;
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.confidence-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.3s ease;
}

.confidence-fill.high {
  background: var(--color-success);
}

.confidence-fill.medium {
  background: var(--color-warning);
}

.confidence-fill.low {
  background: var(--color-danger);
}

.confidence-text {
  font-size: 0.625rem;
  color: var(--color-text-tertiary);
  min-width: 35px;
  text-align: right;
}

/* TTS 테스트 그리드 */
.tts-test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-md);
}

.tts-test-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-sm);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.tts-test-button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.tts-test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tts-test-button.playing {
  border-color: var(--color-primary);
  background: rgba(99, 102, 241, 0.1);
}

.tts-test-button.supported {
  border-color: var(--color-success);
}

.tts-flag {
  font-size: 1rem;
  margin-right: var(--spacing-xs);
}

.tts-text {
  flex: 1;
  font-size: 0.75rem;
  color: var(--color-text-primary);
  font-weight: 500;
}

.tts-status {
  font-size: 0.875rem;
}

.supported-indicator {
  color: var(--color-success);
}

.unsupported-indicator {
  color: var(--color-text-tertiary);
}

.playing-indicator {
  animation: pulse 1s infinite;
}

/* 완료 요약 */
.completion-summary {
  padding: var(--spacing-xl);
  text-align: center;
  background: linear-gradient(135deg, var(--color-success) 0%, var(--color-primary) 100%);
  color: white;
}

.summary-header {
  margin-bottom: var(--spacing-xl);
}

.celebration-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.summary-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 var(--spacing-sm) 0;
}

.summary-subtitle {
  font-size: 0.875rem;
  opacity: 0.9;
  margin: 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.stat-icon {
  font-size: 2rem;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.75rem;
  opacity: 0.8;
}

.next-steps {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

.btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.btn-warning {
  background: var(--color-warning);
  color: var(--color-text-white);
}

.btn-warning:hover {
  background: var(--color-warning-dark);
}

/* 에러 상태 */
.error-state {
  padding: var(--spacing-xl);
  text-align: center;
  background: rgba(239, 68, 68, 0.05);
  border-top: 1px solid rgba(239, 68, 68, 0.2);
}

.error-content {
  max-width: 400px;
  margin: 0 auto;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-danger);
  margin: 0 0 var(--spacing-md) 0;
}

.error-message {
  color: var(--color-text-secondary);
  margin: 0 0 var(--spacing-xl) 0;
  line-height: 1.5;
}

.error-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-md);
  flex-wrap: wrap;
}

/* 애니메이션 */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner-large {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid transparent;
  border-top: 3px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes shimmer {
  0% { opacity: 1; }
  50% { opacity: 0.7; }
  100% { opacity: 1; }
}

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .progress-header {
    padding: var(--spacing-lg);
  }
  
  .header-content {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-md);
  }
  
  .progress-percentage {
    order: -1;
    font-size: 1.5rem;
  }
  
  .phases-container {
    padding: var(--spacing-md);
  }
  
  .phase-item {
    padding: var(--spacing-md);
  }
  
  .phase-header {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
  
  .translation-grid,
  .tts-test-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-md);
  }
  
  .next-steps {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .progress-title {
    font-size: 1.25rem;
  }
  
  .phase-title {
    font-size: 1rem;
  }
  
  .celebration-icon,
  .error-icon {
    font-size: 3rem;
  }
  
  .summary-title {
    font-size: 1.5rem;
  }
  
  .summary-stats {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .stat-number {
    font-size: 1.5rem;
  }
}</style>