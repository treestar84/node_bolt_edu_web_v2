<template>
  <div class="quality-feedback-system">
    <!-- 품질 통계 대시보드 -->
    <div v-if="showStatistics" class="statistics-section">
      <div class="section-header">
        <h3>{{ $t('quality.feedback.statisticsTitle') }}</h3>
        <button 
          @click="refreshStatistics"
          :disabled="isLoading"
          class="refresh-btn"
          type="button"
        >
          <span class="refresh-icon" :class="{ spinning: isLoading }">🔄</span>
          {{ $t('quality.feedback.refresh') }}
        </button>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ statistics.summary.totalValidations }}</div>
          <div class="stat-label">{{ $t('quality.feedback.stats.totalValidations') }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ formatPercentage(statistics.summary.correctionRate) }}</div>
          <div class="stat-label">{{ $t('quality.feedback.stats.correctionRate') }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ statistics.summary.nativeContributions }}</div>
          <div class="stat-label">{{ $t('quality.feedback.stats.nativeContributions') }}</div>
        </div>
        
        <div class="stat-card">
          <div class="stat-value">{{ statistics.summary.languagePairCount }}</div>
          <div class="stat-label">{{ $t('quality.feedback.stats.languagePairs') }}</div>
        </div>
      </div>

      <!-- 학습된 패턴 표시 -->
      <div v-if="learnedPatterns.length > 0" class="learned-patterns">
        <h4>{{ $t('quality.feedback.learnedPatterns') }}</h4>
        <div class="patterns-list">
          <div 
            v-for="(pattern, index) in learnedPatterns.slice(0, 5)" 
            :key="index"
            class="pattern-item"
          >
            <div class="pattern-languages">
              {{ pattern.languagePair }}
            </div>
            <div class="pattern-correction">
              <span class="original">{{ pattern.original }}</span>
              <span class="arrow">→</span>
              <span class="corrected">{{ pattern.corrected }}</span>
            </div>
            <div class="pattern-frequency">
              {{ $t('quality.feedback.usedTimes', { count: pattern.frequency }) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 실시간 피드백 수집 -->
    <div v-if="showFeedbackForm" class="feedback-form-section">
      <div class="section-header">
        <h3>{{ $t('quality.feedback.improveTranslations') }}</h3>
        <div class="feedback-status">
          <span 
            class="status-indicator" 
            :class="{ active: feedbackEnabled }"
          ></span>
          {{ feedbackEnabled ? $t('quality.feedback.active') : $t('quality.feedback.inactive') }}
        </div>
      </div>

      <div class="feedback-settings">
        <div class="setting-group">
          <label class="setting-label">
            <input
              v-model="localSettings.enableUserValidation"
              type="checkbox"
              class="setting-checkbox"
              @change="updateSettings"
            >
            {{ $t('quality.feedback.settings.enableUserValidation') }}
          </label>
          <p class="setting-description">
            {{ $t('quality.feedback.settings.enableUserValidationDesc') }}
          </p>
        </div>

        <div class="setting-group">
          <label class="setting-label">
            <input
              v-model="localSettings.allowLearningDataCollection"
              type="checkbox"
              class="setting-checkbox"
              @change="updateSettings"
            >
            {{ $t('quality.feedback.settings.allowLearningData') }}
          </label>
          <p class="setting-description">
            {{ $t('quality.feedback.settings.allowLearningDataDesc') }}
          </p>
        </div>

        <div class="setting-group">
          <label class="setting-label">
            <input
              v-model="localSettings.prioritizeNativeValidation"
              type="checkbox"
              class="setting-checkbox"
              @change="updateSettings"
            >
            {{ $t('quality.feedback.settings.prioritizeNative') }}
          </label>
          <p class="setting-description">
            {{ $t('quality.feedback.settings.prioritizeNativeDesc') }}
          </p>
        </div>

        <div class="setting-group">
          <label class="setting-label">{{ $t('quality.feedback.settings.minConfidence') }}</label>
          <div class="confidence-slider">
            <input
              v-model="localSettings.minConfidenceThreshold"
              type="range"
              min="0"
              max="100"
              step="5"
              class="slider"
              @input="updateSettings"
            >
            <span class="slider-value">{{ localSettings.minConfidenceThreshold }}%</span>
          </div>
          <p class="setting-description">
            {{ $t('quality.feedback.settings.minConfidenceDesc') }}
          </p>
        </div>
      </div>
    </div>

    <!-- 커뮤니티 기여 섹션 -->
    <div v-if="showCommunitySection" class="community-section">
      <div class="section-header">
        <h3>{{ $t('quality.feedback.communityContribution') }}</h3>
        <div class="contribution-level">
          <span class="level-badge" :class="contributionLevel">
            {{ $t(`quality.feedback.levels.${contributionLevel}`) }}
          </span>
        </div>
      </div>

      <div class="contribution-stats">
        <div class="contribution-item">
          <div class="contrib-icon">✅</div>
          <div class="contrib-content">
            <div class="contrib-number">{{ userContributions.validations }}</div>
            <div class="contrib-label">{{ $t('quality.feedback.yourValidations') }}</div>
          </div>
        </div>

        <div class="contribution-item">
          <div class="contrib-icon">🔧</div>
          <div class="contrib-content">
            <div class="contrib-number">{{ userContributions.corrections }}</div>
            <div class="contrib-label">{{ $t('quality.feedback.yourCorrections') }}</div>
          </div>
        </div>

        <div class="contribution-item">
          <div class="contrib-icon">🌟</div>
          <div class="contrib-content">
            <div class="contrib-number">{{ userContributions.helpfulVotes }}</div>
            <div class="contrib-label">{{ $t('quality.feedback.helpfulVotes') }}</div>
          </div>
        </div>
      </div>

      <!-- 기여 독려 메시지 -->
      <div class="contribution-encouragement">
        <div class="encouragement-content">
          <h4>{{ $t('quality.feedback.helpImprove') }}</h4>
          <p>{{ getEncouragementMessage() }}</p>
          <div class="next-level-info">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${contributionProgress}%` }"
              ></div>
            </div>
            <span class="progress-text">
              {{ $t('quality.feedback.nextLevel', { 
                current: userContributions.validations + userContributions.corrections,
                next: getNextLevelThreshold() 
              }) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 품질 개선 제안 -->
    <div v-if="qualityInsights.length > 0" class="insights-section">
      <div class="section-header">
        <h3>{{ $t('quality.feedback.qualityInsights') }}</h3>
      </div>

      <div class="insights-list">
        <div 
          v-for="(insight, index) in qualityInsights" 
          :key="index"
          class="insight-item"
          :class="insight.priority"
        >
          <div class="insight-icon">{{ insight.icon }}</div>
          <div class="insight-content">
            <div class="insight-title">{{ insight.title }}</div>
            <div class="insight-description">{{ insight.description }}</div>
            <div v-if="insight.action" class="insight-action">
              <button 
                @click="handleInsightAction(insight)"
                class="action-btn"
                type="button"
              >
                {{ insight.action.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useTranslationQuality } from '@/composables/useTranslationQuality';
import type { QualityValidationSettings } from '@/types/multilingual';

// Props
interface Props {
  showStatistics?: boolean;
  showFeedbackForm?: boolean;
  showCommunitySection?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showStatistics: true,
  showFeedbackForm: true,
  showCommunitySection: true
});

// Emits
interface Emits {
  (e: 'settings-updated', settings: QualityValidationSettings): void;
  (e: 'insight-action', insight: any): void;
}

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();
const { statistics, settings, updateSettings: updateQualitySettings } = useTranslationQuality();

// State
const isLoading = ref(false);
const localSettings = ref<QualityValidationSettings>({ ...settings.value });

// Mock data for demonstration (실제로는 API나 스토어에서 가져옴)
const userContributions = ref({
  validations: 23,
  corrections: 8,
  helpfulVotes: 15
});

// Computed
const feedbackEnabled = computed(() => 
  localSettings.value.enableUserValidation && localSettings.value.allowLearningDataCollection
);

const contributionLevel = computed(() => {
  const total = userContributions.value.validations + userContributions.value.corrections;
  if (total >= 100) return 'expert';
  if (total >= 50) return 'advanced';
  if (total >= 20) return 'intermediate';
  if (total >= 5) return 'beginner';
  return 'newcomer';
});

const contributionProgress = computed(() => {
  const total = userContributions.value.validations + userContributions.value.corrections;
  const thresholds = [5, 20, 50, 100];
  const currentLevel = contributionLevel.value;
  const levels = ['newcomer', 'beginner', 'intermediate', 'advanced', 'expert'];
  const currentIndex = levels.indexOf(currentLevel);
  
  if (currentIndex >= thresholds.length) return 100;
  
  const nextThreshold = thresholds[currentIndex];
  const prevThreshold = currentIndex > 0 ? thresholds[currentIndex - 1] : 0;
  
  return Math.min(100, ((total - prevThreshold) / (nextThreshold - prevThreshold)) * 100);
});

const learnedPatterns = computed(() => {
  // 실제로는 statistics에서 가져온 학습된 패턴을 포맷팅
  const patterns = [];
  const commonErrors = statistics.value.database.learnedPatterns.commonErrors;
  
  Object.entries(commonErrors).forEach(([languagePair, errors]) => {
    errors.forEach((error: string) => {
      if (error.includes('→')) {
        const [original, corrected] = error.split('→');
        patterns.push({
          languagePair,
          original: original.trim(),
          corrected: corrected.trim(),
          frequency: Math.floor(Math.random() * 10) + 1 // Mock frequency
        });
      }
    });
  });
  
  return patterns.sort((a, b) => b.frequency - a.frequency);
});

const qualityInsights = computed(() => {
  const insights = [];
  
  // 낮은 품질 언어 쌍 식별
  const stats = statistics.value;
  if (stats.summary.correctionRate > 0.3) {
    insights.push({
      icon: '⚠️',
      title: t('quality.feedback.insights.highCorrectionRate.title'),
      description: t('quality.feedback.insights.highCorrectionRate.description', { rate: Math.round(stats.summary.correctionRate * 100) }),
      priority: 'high',
      action: {
        label: t('quality.feedback.insights.adjustSettings'),
        type: 'adjust-settings'
      }
    });
  }
  
  // 원어민 기여도가 낮은 경우
  if (stats.summary.nativeContributions < stats.summary.totalValidations * 0.2) {
    insights.push({
      icon: '🌍',
      title: t('quality.feedback.insights.lowNativeContribution.title'),
      description: t('quality.feedback.insights.lowNativeContribution.description'),
      priority: 'medium',
      action: {
        label: t('quality.feedback.insights.encourageNative'),
        type: 'encourage-native'
      }
    });
  }
  
  // 학습된 패턴이 많은 경우
  if (stats.summary.learnedPatternsCount > 50) {
    insights.push({
      icon: '🎯',
      title: t('quality.feedback.insights.improvingQuality.title'),
      description: t('quality.feedback.insights.improvingQuality.description', { count: stats.summary.learnedPatternsCount }),
      priority: 'low'
    });
  }
  
  return insights;
});

// Methods
const formatPercentage = (value: number): string => {
  return `${Math.round(value * 100)}%`;
};

const refreshStatistics = async () => {
  isLoading.value = true;
  
  try {
    // 실제로는 통계 데이터를 다시 로드
    await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
    console.log('📊 통계 데이터 새로고침 완료');
  } catch (error) {
    console.error('통계 새로고침 실패:', error);
  } finally {
    isLoading.value = false;
  }
};

const updateSettings = () => {
  updateQualitySettings(localSettings.value);
  emit('settings-updated', localSettings.value);
  console.log('⚙️ 피드백 설정 업데이트됨');
};

const getEncouragementMessage = (): string => {
  const level = contributionLevel.value;
  const messages = {
    newcomer: t('quality.feedback.encouragement.newcomer'),
    beginner: t('quality.feedback.encouragement.beginner'),
    intermediate: t('quality.feedback.encouragement.intermediate'),
    advanced: t('quality.feedback.encouragement.advanced'),
    expert: t('quality.feedback.encouragement.expert')
  };
  return messages[level] || messages.newcomer;
};

const getNextLevelThreshold = (): number => {
  const thresholds = { newcomer: 5, beginner: 20, intermediate: 50, advanced: 100 };
  return thresholds[contributionLevel.value] || 100;
};

const handleInsightAction = (insight: any) => {
  emit('insight-action', insight);
  
  switch (insight.action?.type) {
    case 'adjust-settings':
      // 설정 조정 제안
      localSettings.value.minConfidenceThreshold = Math.min(85, localSettings.value.minConfidenceThreshold + 10);
      updateSettings();
      break;
      
    case 'encourage-native':
      // 원어민 참여 독려 메시지 표시
      console.log('원어민 참여 독려 프로그램 시작');
      break;
      
    default:
      console.log('인사이트 액션:', insight.action?.type);
  }
};

// Watchers
watch(() => settings.value, (newSettings) => {
  localSettings.value = { ...newSettings };
}, { deep: true });

// Lifecycle
onMounted(() => {
  console.log('🔄 품질 피드백 시스템 초기화됨');
});
</script>

<style scoped>
.quality-feedback-system {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.refresh-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.refresh-icon {
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.statistics-section,
.feedback-form-section,
.community-section,
.insights-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.learned-patterns h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.patterns-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.pattern-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
}

.pattern-languages {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  min-width: 80px;
  background: var(--color-bg-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.pattern-correction {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.original {
  color: var(--color-danger);
  text-decoration: line-through;
}

.arrow {
  color: var(--color-text-secondary);
}

.corrected {
  color: var(--color-success);
  font-weight: 500;
}

.pattern-frequency {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.feedback-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  transition: background 0.2s ease;
}

.status-indicator.active {
  background: var(--color-success);
}

.feedback-settings {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.setting-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
}

.setting-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.setting-description {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin: 0;
  margin-left: 24px;
}

.confidence-slider {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-sm);
}

.slider {
  flex: 1;
  height: 6px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--color-primary);
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.slider-value {
  font-weight: 600;
  color: var(--color-primary);
  min-width: 40px;
}

.contribution-level {
  display: flex;
  align-items: center;
}

.level-badge {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.level-badge.newcomer {
  background: rgba(107, 114, 128, 0.1);
  color: var(--color-text-secondary);
}

.level-badge.beginner {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
}

.level-badge.intermediate {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-info);
}

.level-badge.advanced {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.level-badge.expert {
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
}

.contribution-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.contribution-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.contrib-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.contrib-content {
  flex: 1;
}

.contrib-number {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.contrib-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.contribution-encouragement {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.encouragement-content h4 {
  margin: 0 0 var(--spacing-sm) 0;
  color: var(--color-primary);
  font-weight: 600;
}

.encouragement-content p {
  margin: 0 0 var(--spacing-md) 0;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.next-level-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.progress-bar {
  height: 8px;
  background: rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), #a855f7);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.insight-item {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-left: 4px solid var(--color-border);
  border-radius: var(--radius-md);
}

.insight-item.high {
  border-left-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.05);
}

.insight-item.medium {
  border-left-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
}

.insight-item.low {
  border-left-color: var(--color-info);
  background: rgba(59, 130, 246, 0.05);
}

.insight-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.insight-content {
  flex: 1;
}

.insight-title {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
}

.insight-description {
  color: var(--color-text-secondary);
  line-height: 1.4;
  margin-bottom: var(--spacing-sm);
}

.insight-action {
  margin-top: var(--spacing-sm);
}

.action-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }
  
  .contribution-stats {
    grid-template-columns: 1fr;
  }
  
  .pattern-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .confidence-slider {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>