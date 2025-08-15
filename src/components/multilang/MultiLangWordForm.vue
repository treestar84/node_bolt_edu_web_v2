<template>
  <div class="multilang-word-form">
    <!-- 언어 선택기 -->
    <LanguageSelector
      v-model="languageSelection"
      @change="onLanguageSelectionChange"
    />

    <!-- 메인 입력 폼 -->
    <div class="main-form" v-if="languageSelection.primary && languageSelection.secondary">
      <div class="form-header">
        <h2 class="form-title">{{ t('multiLang.formTitle') }}</h2>
        <p class="form-subtitle">{{ t('multiLang.formSubtitle') }}</p>
      </div>

      <div class="input-section">
        <!-- 기본 정보 입력 -->
        <div class="basic-info">
          <div class="form-row">
            <div class="form-group">
              <label for="category">{{ t('admin.words.category') }}</label>
              <select 
                id="category"
                v-model="formData.category"
                class="form-control"
                required
              >
                <option value="animals">{{ t('categories.animals') }}</option>
                <option value="colors">{{ t('categories.colors') }}</option>
                <option value="food">{{ t('categories.food') }}</option>
                <option value="family">{{ t('categories.family') }}</option>
                <option value="toys">{{ t('categories.toys') }}</option>
                <option value="nature">{{ t('categories.nature') }}</option>
                <option value="general">{{ t('categories.general') }}</option>
              </select>
            </div>
            
            <div class="form-group age-group">
              <label>{{ t('admin.words.ageRange') }}</label>
              <div class="age-range">
                <select v-model="formData.minAge" class="form-control small">
                  <option v-for="age in [3,4,5,6,7,8]" :key="age" :value="age">{{ age }}세</option>
                </select>
                <span class="range-separator">~</span>
                <select v-model="formData.maxAge" class="form-control small">
                  <option v-for="age in [3,4,5,6,7,8]" :key="age" :value="age">{{ age }}세</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 언어별 단어 입력 -->
        <div class="language-inputs">
          <!-- 모국어 입력 -->
          <div class="input-group primary">
            <div class="input-header">
              <span class="flag">{{ getPrimaryConfig().flag }}</span>
              <label class="input-label">
                {{ t('multiLang.primaryInput') }}
                <span class="language-name">({{ getPrimaryConfig().nativeName }})</span>
              </label>
            </div>
            <div class="input-wrapper">
              <input
                v-model="formData.primaryText"
                type="text"
                class="text-input primary-input"
                :placeholder="`${getPrimaryConfig().nativeName}로 단어를 입력하세요`"
                @input="onPrimaryTextInput"
                @blur="onPrimaryTextBlur"
                required
                autocomplete="off"
              />
              <div class="input-status">
                <div v-if="formData.primaryText" class="status-indicator completed">
                  <span class="checkmark">✓</span>
                </div>
                <div v-if="formData.primaryText" class="tts-test">
                  <button
                    @click="testTTS(languageSelection.primary, formData.primaryText)"
                    :disabled="isTesting"
                    class="tts-button"
                    :class="{ testing: testingLanguage === languageSelection.primary }"
                    type="button"
                  >
                    <span v-if="testingLanguage === languageSelection.primary" class="spinner"></span>
                    <span v-else>🔊</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="input-help">
              {{ t('multiLang.primaryInputHelp') || '이 언어로 입력한 단어가 기준이 됩니다' }}
            </div>
          </div>

          <!-- 공용어 입력 -->
          <div class="input-group secondary">
            <div class="input-header">
              <span class="flag">{{ getSecondaryConfig().flag }}</span>
              <label class="input-label">
                {{ t('multiLang.secondaryInput') }}
                <span class="language-name">({{ getSecondaryConfig().nativeName }})</span>
              </label>
            </div>
            <div class="input-wrapper">
              <input
                v-model="formData.secondaryText"
                type="text"
                class="text-input secondary-input"
                :placeholder="`${getSecondaryConfig().nativeName}로 단어를 입력하세요`"
                @input="onSecondaryTextInput"
                @blur="onSecondaryTextBlur"
                required
                autocomplete="off"
              />
              <div class="input-status">
                <div v-if="formData.secondaryText" class="status-indicator completed">
                  <span class="checkmark">✓</span>
                </div>
                <div v-if="formData.secondaryText" class="tts-test">
                  <button
                    @click="testTTS(languageSelection.secondary, formData.secondaryText)"
                    :disabled="isTesting"
                    class="tts-button"
                    :class="{ testing: testingLanguage === languageSelection.secondary }"
                    type="button"
                  >
                    <span v-if="testingLanguage === languageSelection.secondary" class="spinner"></span>
                    <span v-else>🔊</span>
                  </button>
                </div>
              </div>
            </div>
            <div class="input-help">
              {{ t('multiLang.secondaryInputHelp') || '번역의 정확도를 높이는 기준 언어입니다' }}
            </div>
          </div>
        </div>

        <!-- 자동 처리 시작 버튼 -->
        <div class="action-section" v-if="canStartAutoProcess">
          <div class="auto-process-card">
            <div class="card-header">
              <div class="icon">✨</div>
              <div class="title">{{ t('multiLang.readyToProcess') || '자동 처리 준비 완료' }}</div>
            </div>
            <div class="card-content">
              <p class="description">
                {{ t('multiLang.processDescription') || '입력하신 2개 언어를 바탕으로 나머지 8개 언어 번역, 이미지 검색, TTS 음성을 자동으로 생성합니다.' }}
              </p>
              <div class="process-preview">
                <div class="process-step">
                  <span class="step-icon">🖼️</span>
                  <span class="step-text">이미지 자동 검색</span>
                </div>
                <div class="process-step">
                  <span class="step-icon">🌍</span>
                  <span class="step-text">8개 언어 자동 번역</span>
                </div>
                <div class="process-step">
                  <span class="step-icon">🎤</span>
                  <span class="step-text">TTS 음성 생성</span>
                </div>
              </div>
              <div class="estimated-time">
                <span class="time-icon">⏱️</span>
                <span class="time-text">예상 소요시간: 30-60초</span>
              </div>
            </div>
            <div class="card-actions">
              <button
                @click="startAutoProcessing"
                :disabled="isProcessing"
                class="btn btn-magic btn-large"
              >
                <span v-if="!isProcessing" class="btn-icon">🚀</span>
                <span v-else class="spinner"></span>
                {{ isProcessing ? t('multiLang.processing') : t('multiLang.startProcessing') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 입력 가이드 (아직 입력이 부족한 경우) -->
        <div class="input-guide" v-else-if="!canStartAutoProcess">
          <div class="guide-header">
            <span class="icon">💡</span>
            <span class="title">{{ t('multiLang.inputGuide') || '입력 가이드' }}</span>
          </div>
          <div class="guide-steps">
            <div class="guide-step" :class="{ completed: languageSelection.primary && languageSelection.secondary }">
              <span class="step-number">1</span>
              <span class="step-text">모국어와 공용어를 선택하세요</span>
              <span v-if="languageSelection.primary && languageSelection.secondary" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: formData.primaryText }">
              <span class="step-number">2</span>
              <span class="step-text">{{ languageSelection.primary ? getPrimaryConfig().nativeName : '모국어' }}로 단어를 입력하세요</span>
              <span v-if="formData.primaryText" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: formData.secondaryText }">
              <span class="step-number">3</span>
              <span class="step-text">{{ languageSelection.secondary ? getSecondaryConfig().nativeName : '공용어' }}로 단어를 입력하세요</span>
              <span v-if="formData.secondaryText" class="step-check">✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 언어 선택 가이드 (언어가 선택되지 않은 경우) -->
    <div class="language-guide" v-else>
      <div class="guide-content">
        <div class="guide-icon">🌍</div>
        <h3 class="guide-title">{{ t('multiLang.selectLanguagesFirst') || '먼저 언어를 선택해주세요' }}</h3>
        <p class="guide-description">
          {{ t('multiLang.languageSelectionDescription') || '모국어와 공용어를 선택하면 단어 입력 폼이 나타납니다. 선택하신 언어에 최적화된 입력 환경을 제공합니다.' }}
        </p>
        <div class="guide-benefits">
          <div class="benefit">
            <span class="benefit-icon">🎯</span>
            <span class="benefit-text">언어별 최적화된 TTS</span>
          </div>
          <div class="benefit">
            <span class="benefit-icon">⚡</span>
            <span class="benefit-text">빠른 자동 번역</span>
          </div>
          <div class="benefit">
            <span class="benefit-icon">🔍</span>
            <span class="benefit-text">스마트 이미지 검색</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import LanguageSelector from './LanguageSelector.vue';
import { SUPPORTED_LANGUAGES, type SupportedLanguageCode } from '@/constants/languages';
import { useMultiLangAudio } from '@/composables/useMultiLangAudio';
import type { MultiLangFormData } from '@/types/multilingual';

// Props
interface Props {
  modelValue?: MultiLangFormData;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({
    primaryText: '',
    secondaryText: '',
    category: 'general',
    minAge: 3,
    maxAge: 8
  }),
  disabled: false
});

const { t } = useI18n();

// Emits
interface Emits {
  (e: 'update:modelValue', value: MultiLangFormData): void;
  (e: 'start-processing', data: MultiLangFormData & { languages: { primary: string; secondary: string } }): void;
  (e: 'input-change', field: string, value: string): void;
}

const emit = defineEmits<Emits>();

// Composables
const { speakText } = useMultiLangAudio();

// State
const languageSelection = ref({
  primary: 'ko',
  secondary: 'en'
});

const formData = ref<MultiLangFormData>({
  primaryText: props.modelValue.primaryText || '',
  secondaryText: props.modelValue.secondaryText || '',
  category: props.modelValue.category || 'general',
  minAge: props.modelValue.minAge || 3,
  maxAge: props.modelValue.maxAge || 8
});

const isProcessing = ref(false);
const isTesting = ref(false);
const testingLanguage = ref('');

// Computed properties
const canStartAutoProcess = computed(() => {
  return (
    languageSelection.value.primary &&
    languageSelection.value.secondary &&
    formData.value.primaryText.trim().length > 0 &&
    formData.value.secondaryText.trim().length > 0 &&
    !isProcessing.value
  );
});

const getPrimaryConfig = () => 
  SUPPORTED_LANGUAGES[languageSelection.value.primary as SupportedLanguageCode];

const getSecondaryConfig = () => 
  SUPPORTED_LANGUAGES[languageSelection.value.secondary as SupportedLanguageCode];

// Methods
const onLanguageSelectionChange = (selection: { primary: string; secondary: string }) => {
  languageSelection.value = selection;
  console.log(`🌍 Language selection changed:`, selection);
  emitUpdate();
};

const onPrimaryTextInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  formData.value.primaryText = target.value;
  emit('input-change', 'primaryText', target.value);
  emitUpdate();
};

const onSecondaryTextInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  formData.value.secondaryText = target.value;
  emit('input-change', 'secondaryText', target.value);
  emitUpdate();
};

const onPrimaryTextBlur = () => {
  console.log(`📝 Primary text entered: "${formData.value.primaryText}"`);
};

const onSecondaryTextBlur = () => {
  console.log(`📝 Secondary text entered: "${formData.value.secondaryText}"`);
};

const testTTS = async (languageCode: string, text: string) => {
  if (isTesting.value || !text.trim()) return;
  
  isTesting.value = true;
  testingLanguage.value = languageCode;
  
  try {
    console.log(`🔊 Testing TTS: ${languageCode} - "${text}"`);
    await speakText(text, languageCode);
  } catch (error) {
    console.error(`TTS test failed:`, error);
  } finally {
    isTesting.value = false;
    testingLanguage.value = '';
  }
};

const startAutoProcessing = () => {
  if (!canStartAutoProcess.value) return;
  
  isProcessing.value = true;
  
  const processingData = {
    ...formData.value,
    languages: languageSelection.value
  };
  
  console.log('🚀 Starting auto processing with data:', processingData);
  emit('start-processing', processingData);
};

const emitUpdate = () => {
  emit('update:modelValue', { ...formData.value });
};

// Watchers
watch(() => props.modelValue, (newValue) => {
  formData.value = { ...newValue };
}, { deep: true });

// Auto-adjust age range
watch(() => formData.value.minAge, (newMin) => {
  if (newMin > formData.value.maxAge) {
    formData.value.maxAge = newMin;
    emitUpdate();
  }
});

watch(() => formData.value.maxAge, (newMax) => {
  if (newMax < formData.value.minAge) {
    formData.value.minAge = newMax;
    emitUpdate();
  }
});

// Watch form data changes
watch(formData, () => {
  emitUpdate();
}, { deep: true });

// External control of processing state
defineExpose({
  setProcessing: (processing: boolean) => {
    isProcessing.value = processing;
  },
  getFormData: () => ({
    ...formData.value,
    languages: languageSelection.value
  }),
  resetForm: () => {
    formData.value = {
      primaryText: '',
      secondaryText: '',
      category: 'general',
      minAge: 3,
      maxAge: 8
    };
    isProcessing.value = false;
  }
});
</script>

<style scoped>
.multilang-word-form {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.main-form {
  padding: var(--spacing-xl);
}

.form-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.form-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.form-subtitle {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.basic-info {
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--spacing-lg);
}

.form-group label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-control.small {
  padding: var(--spacing-sm) var(--spacing-md);
}

.age-range {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.range-separator {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.language-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-xl);
}

.input-group {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
}

.input-group.primary {
  border-left: 4px solid var(--color-primary);
}

.input-group.secondary {
  border-left: 4px solid var(--color-secondary);
}

.input-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.input-header .flag {
  font-size: 1.5rem;
}

.input-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  margin: 0;
}

.language-name {
  color: var(--color-text-secondary);
  font-weight: 400;
  font-size: 0.8rem;
}

.input-wrapper {
  position: relative;
  margin-bottom: var(--spacing-sm);
}

.text-input {
  width: 100%;
  padding: var(--spacing-md);
  padding-right: 80px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 1rem;
  transition: all 0.2s ease;
}

.text-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.text-input.primary-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.text-input.secondary-input:focus {
  border-color: var(--color-secondary);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
}

.input-status {
  position: absolute;
  right: var(--spacing-sm);
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.status-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-success);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.tts-button {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tts-button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.tts-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tts-button.testing {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.input-help {
  font-size: 0.75rem;
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

.auto-process-card {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  color: white;
  text-align: center;
  box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
}

.auto-process-card .card-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.auto-process-card .icon {
  font-size: 2rem;
}

.auto-process-card .title {
  font-size: 1.25rem;
  font-weight: 700;
}

.auto-process-card .description {
  font-size: 0.875rem;
  opacity: 0.9;
  line-height: 1.6;
  margin: 0 0 var(--spacing-lg) 0;
}

.process-preview {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.process-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
}

.process-step .step-icon {
  font-size: 1.5rem;
  margin-bottom: 4px;
}

.process-step .step-text {
  font-size: 0.75rem;
  opacity: 0.8;
  text-align: center;
}

.estimated-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
  opacity: 0.8;
  margin-bottom: var(--spacing-lg);
}

.btn-magic {
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: var(--spacing-md) var(--spacing-xl);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  min-height: 48px;
}

.btn-magic:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.btn-magic:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-large {
  padding: var(--spacing-lg) var(--spacing-xl);
  font-size: 1.1rem;
}

.input-guide {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.guide-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.guide-header .title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.guide-step {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  background: var(--color-bg-secondary);
  transition: all 0.2s ease;
}

.guide-step.completed {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.guide-step.completed .step-number {
  background: var(--color-success);
}

.step-text {
  flex: 1;
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.guide-step.completed .step-text {
  color: var(--color-text-primary);
}

.step-check {
  color: var(--color-success);
  font-weight: 700;
}

.language-guide {
  padding: var(--spacing-3xl);
  text-align: center;
  background: var(--color-bg-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  margin: var(--spacing-lg);
}

.guide-content {
  max-width: 500px;
  margin: 0 auto;
}

.guide-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.guide-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.guide-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0 0 var(--spacing-xl) 0;
}

.guide-benefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: var(--spacing-md);
}

.benefit {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.benefit-icon {
  font-size: 1.5rem;
}

.benefit-text {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-align: center;
}

.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive design */
@media (max-width: 768px) {
  .main-form {
    padding: var(--spacing-md);
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .language-inputs {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .process-preview {
    gap: var(--spacing-md);
  }
  
  .process-step .step-text {
    font-size: 0.7rem;
  }
  
  .guide-benefits {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .auto-process-card {
    padding: var(--spacing-lg);
  }
  
  .auto-process-card .title {
    font-size: 1.125rem;
  }
}

@media (max-width: 480px) {
  .form-title {
    font-size: 1.5rem;
  }
  
  .form-subtitle {
    font-size: 0.875rem;
  }
  
  .input-group {
    padding: var(--spacing-md);
  }
  
  .text-input {
    font-size: 0.875rem;
    padding-right: 70px;
  }
  
  .language-guide {
    padding: var(--spacing-lg);
    margin: var(--spacing-md);
  }
  
  .guide-icon {
    font-size: 3rem;
  }
  
  .guide-title {
    font-size: 1.25rem;
  }
}
</style>