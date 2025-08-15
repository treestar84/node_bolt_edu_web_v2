<template>
  <div v-if="show" class="modal-overlay" @click="handleClose">
    <div class="modal-content validation-modal" @click.stop>
      <div class="modal-header">
        <h2>
          <span class="modal-icon">✓</span>
          {{ t('quality.validation.title') }}
        </h2>
        <button @click="handleClose" class="modal-close">×</button>
      </div>

      <div class="modal-body">
        <!-- 현재 번역 정보 -->
        <div class="translation-info">
          <div class="info-row">
            <span class="info-label">{{ t('quality.validation.originalText') }}:</span>
            <span class="info-value">{{ sourceText }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ t('quality.validation.currentTranslation') }}:</span>
            <span class="info-value">{{ currentTranslation }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">{{ t('quality.validation.languagePair') }}:</span>
            <span class="info-value">
              {{ SUPPORTED_LANGUAGES[sourceLang]?.nativeName }} → {{ SUPPORTED_LANGUAGES[targetLang]?.nativeName }}
            </span>
          </div>
        </div>

        <!-- 품질 점수 표시 -->
        <div v-if="qualityScore" class="quality-section">
          <TranslationQualityIndicator 
            :quality-score="qualityScore"
            :show-details="true"
            :show-actions="false"
            compact
          />
        </div>

        <!-- 대안 번역 제안 -->
        <div v-if="alternatives.length > 0" class="alternatives-section">
          <h3>{{ t('quality.validation.suggestedAlternatives') }}</h3>
          <div class="alternatives-list">
            <button
              v-for="(alternative, index) in alternatives"
              :key="index"
              @click="selectAlternative(alternative)"
              class="alternative-item"
              :class="{ selected: validationData.correctedTranslation === alternative }"
              type="button"
            >
              <span class="alternative-text">{{ alternative }}</span>
              <span v-if="validationData.correctedTranslation === alternative" class="selected-indicator">✓</span>
            </button>
          </div>
        </div>

        <!-- 번역 수정 폼 -->
        <div class="validation-form">
          <div class="form-group">
            <label class="form-label">{{ t('quality.validation.correctedTranslation') }}</label>
            <textarea
              v-model="validationData.correctedTranslation"
              class="form-textarea"
              :placeholder="t('quality.validation.correctionPlaceholder')"
              rows="3"
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('quality.validation.correctionReason') }}</label>
            <select v-model="validationData.correctionReason" class="form-select">
              <option value="">{{ t('quality.validation.selectReason') }}</option>
              <option value="grammar">{{ t('quality.validation.reasons.grammar') }}</option>
              <option value="vocabulary">{{ t('quality.validation.reasons.vocabulary') }}</option>
              <option value="context">{{ t('quality.validation.reasons.context') }}</option>
              <option value="cultural">{{ t('quality.validation.reasons.cultural') }}</option>
              <option value="other">{{ t('quality.validation.reasons.other') }}</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ t('quality.validation.correctionNote') }} ({{ t('common.optional') }})</label>
            <textarea
              v-model="validationData.correctionNote"
              class="form-textarea"
              :placeholder="t('quality.validation.notePlaceholder')"
              rows="2"
            ></textarea>
          </div>

          <!-- 사용자 프로필 정보 -->
          <div class="user-profile-section">
            <h4>{{ t('quality.validation.userProfile') }}</h4>
            <div class="profile-options">
              <div class="form-check">
                <input
                  id="nativeSpeaker"
                  v-model="validationData.isNativeSpeaker"
                  type="checkbox"
                  class="form-checkbox"
                >
                <label for="nativeSpeaker" class="form-check-label">
                  {{ t('quality.validation.nativeSpeaker') }}
                </label>
              </div>

              <div class="form-group">
                <label class="form-label">{{ t('quality.validation.languageProficiency') }}</label>
                <select v-model="validationData.languageProficiency" class="form-select">
                  <option value="basic">{{ t('quality.validation.proficiency.basic') }}</option>
                  <option value="intermediate">{{ t('quality.validation.proficiency.intermediate') }}</option>
                  <option value="fluent">{{ t('quality.validation.proficiency.fluent') }}</option>
                  <option value="native">{{ t('quality.validation.proficiency.native') }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 개인정보 동의 -->
          <div class="privacy-section">
            <div class="form-check">
              <input
                id="allowLearning"
                v-model="allowLearningData"
                type="checkbox"
                class="form-checkbox"
              >
              <label for="allowLearning" class="form-check-label">
                {{ t('quality.validation.allowLearningData') }}
              </label>
            </div>
            <p class="privacy-note">
              {{ t('quality.validation.privacyNote') }}
            </p>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          @click="handleClose" 
          class="btn btn-secondary"
          type="button"
        >
          {{ t('common.cancel') }}
        </button>
        
        <button 
          @click="handleValidationCorrect" 
          class="btn btn-success"
          :disabled="!canConfirmCorrect"
          type="button"
        >
          <span class="btn-icon">✓</span>
          {{ t('quality.validation.confirmCorrect') }}
        </button>
        
        <button 
          @click="handleValidationSubmit" 
          class="btn btn-primary"
          :disabled="!canSubmitCorrection || isSubmitting"
          type="button"
        >
          <span v-if="isSubmitting" class="spinner"></span>
          <span v-else class="btn-icon">💾</span>
          {{ isSubmitting ? t('common.processing') : t('quality.validation.submitCorrection') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TranslationQualityIndicator from './TranslationQualityIndicator.vue';
import { SUPPORTED_LANGUAGES } from '@/constants/languages';
import type {
  TranslationQualityScore,
  UserTranslationValidation,
  SupportedLanguageCode
  // CorrectionReason
} from '@/types/multilingual';

// Props
interface Props {
  show: boolean;
  sourceText: string;
  currentTranslation: string;
  sourceLang: SupportedLanguageCode;
  targetLang: SupportedLanguageCode;
  qualityScore?: TranslationQualityScore;
  alternatives?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  alternatives: () => []
});

// Emits
interface Emits {
  (e: 'close'): void;
  (e: 'validate-correct', data: UserTranslationValidation): void;
  (e: 'submit-correction', data: UserTranslationValidation): void;
}

const emit = defineEmits<Emits>();

// Composables
const { t } = useI18n();

// State
const isSubmitting = ref(false);
const allowLearningData = ref(true);

const validationData = ref<Partial<UserTranslationValidation>>({
  originalTranslation: '',
  correctedTranslation: '',
  correctionReason: undefined,
  correctionNote: '',
  isNativeSpeaker: false,
  languageProficiency: 'intermediate'
});

// Computed
const canConfirmCorrect = computed(() => {
  return validationData.value.correctedTranslation === props.currentTranslation ||
         !validationData.value.correctedTranslation;
});

const canSubmitCorrection = computed(() => {
  return validationData.value.correctedTranslation &&
         validationData.value.correctedTranslation !== props.currentTranslation &&
         validationData.value.correctionReason;
});

// Methods
const selectAlternative = (alternative: string) => {
  validationData.value.correctedTranslation = alternative;
  if (!validationData.value.correctionReason) {
    validationData.value.correctionReason = 'vocabulary';
  }
};

const handleValidationCorrect = () => {
  const validation: UserTranslationValidation = {
    originalTranslation: props.currentTranslation,
    correctedTranslation: props.currentTranslation, // 수정 없음을 의미
    validatedAt: new Date().toISOString(),
    isNativeSpeaker: validationData.value.isNativeSpeaker,
    languageProficiency: validationData.value.languageProficiency
  };

  emit('validate-correct', validation);
};

const handleValidationSubmit = async () => {
  if (!canSubmitCorrection.value || isSubmitting.value) return;

  isSubmitting.value = true;

  try {
    const validation: UserTranslationValidation = {
      originalTranslation: props.currentTranslation,
      correctedTranslation: validationData.value.correctedTranslation!,
      correctionReason: validationData.value.correctionReason,
      correctionNote: validationData.value.correctionNote,
      validatedAt: new Date().toISOString(),
      isNativeSpeaker: validationData.value.isNativeSpeaker,
      languageProficiency: validationData.value.languageProficiency
    };

    emit('submit-correction', validation);
  } finally {
    isSubmitting.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

const resetForm = () => {
  validationData.value = {
    originalTranslation: props.currentTranslation,
    correctedTranslation: props.currentTranslation,
    correctionReason: undefined,
    correctionNote: '',
    isNativeSpeaker: false,
    languageProficiency: 'intermediate'
  };
  allowLearningData.value = true;
  isSubmitting.value = false;
};

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    resetForm();
  }
});

watch(() => props.currentTranslation, (newTranslation) => {
  if (newTranslation) {
    validationData.value.originalTranslation = newTranslation;
    validationData.value.correctedTranslation = newTranslation;
  }
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.validation-modal {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.modal-icon {
  font-size: 1.75rem;
  color: var(--color-success);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.modal-body {
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.translation-info {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.info-row {
  display: flex;
  margin-bottom: var(--spacing-md);
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-label {
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 120px;
  flex-shrink: 0;
}

.info-value {
  color: var(--color-text-primary);
  flex: 1;
  word-break: break-word;
}

.quality-section {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}

.alternatives-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.alternatives-section h3 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.alternatives-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.alternative-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.alternative-item:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.alternative-item.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: var(--color-primary);
}

.alternative-text {
  flex: 1;
  color: var(--color-text-primary);
  line-height: 1.4;
}

.selected-indicator {
  color: var(--color-success);
  font-weight: 700;
  margin-left: var(--spacing-sm);
}

.validation-form {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.form-group {
  margin-bottom: var(--spacing-lg);
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
}

.form-textarea,
.form-select {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
  resize: vertical;
}

.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.user-profile-section {
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
}

.user-profile-section h4 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.profile-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.form-check {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.form-checkbox {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.form-check-label {
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;
}

.privacy-section {
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.privacy-note {
  margin: var(--spacing-sm) 0 0 0;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.modal-footer {
  display: flex;
  gap: var(--spacing-md);
  padding: 0 var(--spacing-xl) var(--spacing-xl);
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-xl);
}

.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.btn-success {
  background: var(--color-success);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: var(--color-success-dark);
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 1rem;
}

.spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .validation-modal {
    max-width: 95vw;
    margin: var(--spacing-md);
  }
  
  .modal-header {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-md);
  }
  
  .info-row {
    flex-direction: column;
    gap: var(--spacing-xs);
  }
  
  .info-label {
    min-width: auto;
  }
  
  .alternative-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .modal-footer {
    flex-direction: column-reverse;
    gap: var(--spacing-sm);
  }
  
  .btn {
    width: 100%;
  }
}
</style>