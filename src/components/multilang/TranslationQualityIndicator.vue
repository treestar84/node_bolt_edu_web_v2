<template>
  <div class="quality-indicator" :class="qualityClass">
    <div class="quality-header">
      <div class="quality-score">
        <div class="score-circle" :class="scoreClass">
          <span class="score-number">{{ qualityScore.overall }}</span>
        </div>
        <div class="quality-info">
          <div class="quality-grade">{{ gradeText }}</div>
          <div class="confidence-level">{{ confidenceText }}</div>
        </div>
      </div>
      
      <button 
        v-if="showDetails"
        @click="toggleDetailsExpanded"
        class="details-toggle"
        :class="{ expanded: detailsExpanded }"
        type="button"
      >
        <span class="toggle-icon">{{ detailsExpanded ? '▼' : '▶' }}</span>
        {{ $t('quality.viewDetails') }}
      </button>
    </div>

    <!-- 상세 품질 정보 -->
    <div v-if="detailsExpanded && showDetails" class="quality-details">
      <div class="score-breakdown">
        <h4>{{ $t('quality.scoreBreakdown') }}</h4>
        <div class="breakdown-items">
          <div class="breakdown-item">
            <span class="breakdown-label">{{ $t('quality.providerReliability') }}</span>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill" 
                :style="{ width: `${qualityScore.breakdown.providerReliability}%` }"
              ></div>
            </div>
            <span class="breakdown-score">{{ qualityScore.breakdown.providerReliability }}</span>
          </div>
          
          <div class="breakdown-item">
            <span class="breakdown-label">{{ $t('quality.languagePairQuality') }}</span>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill" 
                :style="{ width: `${qualityScore.breakdown.languagePairQuality}%` }"
              ></div>
            </div>
            <span class="breakdown-score">{{ qualityScore.breakdown.languagePairQuality }}</span>
          </div>
          
          <div class="breakdown-item">
            <span class="breakdown-label">{{ $t('quality.contextComplexity') }}</span>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill" 
                :style="{ width: `${qualityScore.breakdown.contextComplexity}%` }"
              ></div>
            </div>
            <span class="breakdown-score">{{ qualityScore.breakdown.contextComplexity }}</span>
          </div>
          
          <div class="breakdown-item">
            <span class="breakdown-label">{{ $t('quality.lengthAppropriateness') }}</span>
            <div class="breakdown-bar">
              <div 
                class="breakdown-fill" 
                :style="{ width: `${qualityScore.breakdown.lengthAppropriateness}%` }"
              ></div>
            </div>
            <span class="breakdown-score">{{ qualityScore.breakdown.lengthAppropriateness }}</span>
          </div>
        </div>
      </div>

      <!-- 권장사항 -->
      <div v-if="qualityScore.recommendations.length > 0" class="recommendations">
        <h4>{{ $t('quality.recommendations') }}</h4>
        <ul class="recommendation-list">
          <li 
            v-for="(recommendation, index) in qualityScore.recommendations" 
            :key="index"
            class="recommendation-item"
          >
            {{ recommendation }}
          </li>
        </ul>
      </div>

      <!-- 검증 필요 알림 -->
      <div v-if="qualityScore.needsValidation" class="validation-alert">
        <div class="alert-icon">⚠️</div>
        <div class="alert-content">
          <div class="alert-title">{{ $t('quality.validationNeeded') }}</div>
          <div class="alert-message">{{ $t('quality.validationMessage') }}</div>
        </div>
      </div>
    </div>

    <!-- 빠른 액션 버튼들 -->
    <div v-if="showActions" class="quality-actions">
      <button 
        v-if="qualityScore.needsValidation"
        @click="$emit('validate')"
        class="action-btn validate-btn"
        type="button"
      >
        <span class="action-icon">✓</span>
        {{ $t('quality.validate') }}
      </button>
      
      <button 
        @click="$emit('suggest-alternatives')"
        class="action-btn alternatives-btn"
        type="button"
      >
        <span class="action-icon">💡</span>
        {{ $t('quality.suggestAlternatives') }}
      </button>
      
      <button 
        @click="$emit('report-issue')"
        class="action-btn report-btn"
        type="button"
      >
        <span class="action-icon">🚩</span>
        {{ $t('quality.reportIssue') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { TranslationQualityScore } from '@/types/multilingual';

// Props
interface Props {
  qualityScore: TranslationQualityScore;
  showDetails?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showDetails: true,
  showActions: true,
  compact: false
});

// Emits
interface Emits {
  (e: 'validate'): void;
  (e: 'suggest-alternatives'): void;
  (e: 'report-issue'): void;
}

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// State
const detailsExpanded = ref(false);

// Computed
const qualityClass = computed(() => ({
  'compact': props.compact,
  'excellent': props.qualityScore.grade === 'excellent',
  'good': props.qualityScore.grade === 'good',
  'fair': props.qualityScore.grade === 'fair',
  'poor': props.qualityScore.grade === 'poor',
  'needs-review': props.qualityScore.grade === 'needs_review'
}));

const scoreClass = computed(() => ({
  'score-excellent': props.qualityScore.overall >= 90,
  'score-good': props.qualityScore.overall >= 80 && props.qualityScore.overall < 90,
  'score-fair': props.qualityScore.overall >= 70 && props.qualityScore.overall < 80,
  'score-poor': props.qualityScore.overall >= 50 && props.qualityScore.overall < 70,
  'score-bad': props.qualityScore.overall < 50
}));

const gradeText = computed(() => {
  const gradeKeys: Record<string, string> = {
    excellent: 'quality.grade.excellent',
    good: 'quality.grade.good',
    fair: 'quality.grade.fair',
    poor: 'quality.grade.poor',
    needs_review: 'quality.grade.needsReview'
  };
  return t(gradeKeys[props.qualityScore.grade] || 'quality.grade.unknown');
});

const confidenceText = computed(() => {
  const confidenceKeys: Record<string, string> = {
    high: 'quality.confidence.high',
    medium: 'quality.confidence.medium',
    low: 'quality.confidence.low'
  };
  return t(confidenceKeys[props.qualityScore.confidence] || 'quality.confidence.unknown');
});

// Methods
const toggleDetailsExpanded = () => {
  detailsExpanded.value = !detailsExpanded.value;
};
</script>

<style scoped>
.quality-indicator {
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
  transition: all 0.3s ease;
}

.quality-indicator.compact {
  padding: var(--spacing-sm);
}

/* 품질 등급별 테두리 색상 */
.quality-indicator.excellent {
  border-color: var(--color-success);
  background: rgba(34, 197, 94, 0.05);
}

.quality-indicator.good {
  border-color: var(--color-info);
  background: rgba(59, 130, 246, 0.05);
}

.quality-indicator.fair {
  border-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
}

.quality-indicator.poor,
.quality-indicator.needs-review {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.05);
}

.quality-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.quality-score {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.score-circle {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: white;
  position: relative;
  overflow: hidden;
}

.compact .score-circle {
  width: 40px;
  height: 40px;
  font-size: 0.875rem;
}

.score-excellent {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.score-good {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.score-fair {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.score-poor {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.score-bad {
  background: linear-gradient(135deg, #991b1b, #7f1d1d);
}

.score-number {
  font-size: 1.25rem;
  font-weight: 700;
}

.quality-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.quality-grade {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.confidence-level {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.details-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.details-toggle:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.toggle-icon {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
}

.details-toggle.expanded .toggle-icon {
  transform: rotate(90deg);
}

.quality-details {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.score-breakdown h4,
.recommendations h4 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.breakdown-items {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.breakdown-label {
  min-width: 140px;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.breakdown-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
}

.breakdown-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light));
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.breakdown-score {
  min-width: 30px;
  text-align: right;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.recommendations {
  margin-top: var(--spacing-lg);
}

.recommendation-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.recommendation-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.recommendation-item::before {
  content: "💡";
  font-size: 1rem;
  flex-shrink: 0;
}

.validation-alert {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-top: var(--spacing-lg);
  padding: var(--spacing-md);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
}

.alert-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-weight: 600;
  color: var(--color-warning-dark);
  margin-bottom: var(--spacing-xs);
}

.alert-message {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.quality-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.validate-btn:hover {
  border-color: var(--color-success);
  color: var(--color-success);
}

.alternatives-btn:hover {
  border-color: var(--color-info);
  color: var(--color-info);
}

.report-btn:hover {
  border-color: var(--color-danger);
  color: var(--color-danger);
}

.action-icon {
  font-size: 1rem;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .quality-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
  
  .breakdown-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-xs);
  }
  
  .breakdown-label {
    min-width: auto;
  }
  
  .quality-actions {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
}
</style>