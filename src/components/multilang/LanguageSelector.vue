<template>
  <div class="language-selector">
    <!-- 모국어 선택 섹션 -->
    <div class="language-section primary">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">🌟</span>
          {{ $t('multiLang.primaryLanguage') }}
          <span class="subtitle">{{ $t('multiLang.primarySubtitle') }}</span>
        </h3>
      </div>
      
      <div class="language-grid primary-grid">
        <button
          v-for="lang in popularLanguages"
          :key="`primary-${lang.code}`"
          @click="selectPrimaryLanguage(lang.code)"
          :class="{
            'language-button': true,
            'selected': primaryLanguage === lang.code,
            'popular': true,
            'disabled': lang.code === secondaryLanguage
          }"
          :disabled="lang.code === secondaryLanguage"
          :aria-pressed="primaryLanguage === lang.code"
        >
          <span class="flag">{{ lang.flag }}</span>
          <div class="text-content">
            <span class="native-name">{{ lang.nativeName }}</span>
            <span class="local-name">{{ lang.name }}</span>
          </div>
          <div v-if="primaryLanguage === lang.code" class="selected-indicator">
            <span class="checkmark">✓</span>
          </div>
          <span v-if="lang.isPopular" class="popular-badge">{{ $t('multiLang.popular') }}</span>
        </button>
        
        <!-- 기타 언어 버튼 -->
        <details class="other-languages" v-if="otherLanguages.length > 0">
          <summary class="other-languages-toggle">
            <span class="icon">🌍</span>
            <span class="text">{{ $t('multiLang.moreLanguages') }}</span>
            <span class="count">({{ otherLanguages.length }})</span>
          </summary>
          
          <div class="other-languages-grid">
            <button
              v-for="lang in otherLanguages"
              :key="`primary-other-${lang.code}`"
              @click="selectPrimaryLanguage(lang.code)"
              :class="{
                'language-button small': true,
                'selected': primaryLanguage === lang.code,
                'disabled': lang.code === secondaryLanguage
              }"
              :disabled="lang.code === secondaryLanguage"
              :aria-pressed="primaryLanguage === lang.code"
            >
              <span class="flag">{{ lang.flag }}</span>
              <span class="native-name">{{ lang.nativeName }}</span>
              <div v-if="primaryLanguage === lang.code" class="selected-indicator">
                <span class="checkmark">✓</span>
              </div>
            </button>
          </div>
        </details>
      </div>
    </div>

    <!-- 공용어 선택 섹션 -->
    <div class="language-section secondary">
      <div class="section-header">
        <h3 class="section-title">
          <span class="icon">🌐</span>
          {{ $t('multiLang.secondaryLanguage') }}
          <span class="subtitle">{{ $t('multiLang.secondarySubtitle') }}</span>
        </h3>
      </div>
      
      <div class="language-options secondary-options">
        <button
          v-for="lang in availableSecondaryLanguages"
          :key="`secondary-${lang.code}`"
          @click="selectSecondaryLanguage(lang.code)"
          :class="{
            'language-option': true,
            'selected': secondaryLanguage === lang.code,
            'recommended': lang.code === 'en' && primaryLanguage !== 'en'
          }"
          :aria-pressed="secondaryLanguage === lang.code"
        >
          <span class="flag">{{ lang.flag }}</span>
          <div class="text-content">
            <span class="native-name">{{ lang.nativeName }}</span>
            <span class="local-name">{{ lang.name }}</span>
          </div>
          <div v-if="secondaryLanguage === lang.code" class="selected-indicator">
            <span class="checkmark">✓</span>
          </div>
          <span 
            v-if="lang.code === 'en' && primaryLanguage !== 'en'" 
            class="recommended-badge"
          >
            {{ $t('multiLang.recommended') }}
          </span>
        </button>
      </div>
    </div>

    <!-- 선택 요약 및 미리보기 -->
    <div class="selection-summary" v-if="primaryLanguage && secondaryLanguage">
      <div class="summary-header">
        <h4>{{ $t('multiLang.selectionSummary') }}</h4>
      </div>
      
      <div class="summary-content">
        <div class="language-pair">
          <div class="pair-item primary-item">
            <span class="flag large">{{ getPrimaryConfig().flag }}</span>
            <div class="info">
              <span class="role">{{ $t('multiLang.primaryRole') }}</span>
              <span class="name">{{ getPrimaryConfig().nativeName }}</span>
              <div class="quality-indicator">
                <div class="tts-quality" :class="`quality-${getTTSQuality(primaryLanguage)}`">
                  <span class="quality-icon">🎤</span>
                  <span class="quality-text">{{ getTTSQualityText(primaryLanguage) }}</span>
                </div>
              </div>
            </div>
            <button 
              @click="testTTS(primaryLanguage)"
              :disabled="isTesting"
              class="test-button"
              :class="{ testing: testingLanguage === primaryLanguage }"
            >
              <span v-if="testingLanguage === primaryLanguage" class="spinner"></span>
              <span v-else>🔊</span>
            </button>
          </div>
          
          <div class="arrow-connector">
            <span class="arrow">→</span>
            <span class="auto-text">{{ $t('multiLang.autoTranslate') }}</span>
          </div>
          
          <div class="pair-item secondary-item">
            <span class="flag large">{{ getSecondaryConfig().flag }}</span>
            <div class="info">
              <span class="role">{{ $t('multiLang.secondaryRole') }}</span>
              <span class="name">{{ getSecondaryConfig().nativeName }}</span>
              <div class="quality-indicator">
                <div class="tts-quality" :class="`quality-${getTTSQuality(secondaryLanguage)}`">
                  <span class="quality-icon">🎤</span>
                  <span class="quality-text">{{ getTTSQualityText(secondaryLanguage) }}</span>
                </div>
              </div>
            </div>
            <button 
              @click="testTTS(secondaryLanguage)"
              :disabled="isTesting"
              class="test-button"
              :class="{ testing: testingLanguage === secondaryLanguage }"
            >
              <span v-if="testingLanguage === secondaryLanguage" class="spinner"></span>
              <span v-else>🔊</span>
            </button>
          </div>
        </div>
        
        <div class="auto-complete-preview">
          <div class="preview-header">
            <span class="icon">🤖</span>
            <span class="text">{{ $t('multiLang.willAutoComplete') }}</span>
            <span class="count">{{ remainingLanguagesCount }}{{ $t('multiLang.languages') }}</span>
          </div>
          
          <div class="remaining-languages">
            <span
              v-for="lang in remainingLanguagesPreview"
              :key="lang.code"
              class="remaining-language"
              :title="lang.name"
            >
              {{ lang.flag }}
            </span>
            <span v-if="remainingLanguagesCount > 6" class="more-languages">
              +{{ remainingLanguagesCount - 6 }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 경고 및 가이드 메시지 -->
    <div class="guidance-messages">
      <div 
        v-if="primaryLanguage === secondaryLanguage"
        class="message warning"
      >
        <span class="icon">⚠️</span>
        <span class="text">{{ $t('multiLang.sameLanguageWarning') }}</span>
      </div>
      
      <div 
        v-if="translationQuality < 0.8 && primaryLanguage && secondaryLanguage"
        class="message caution"
      >
        <span class="icon">📊</span>
        <span class="text">
          {{ $t('multiLang.lowTranslationQuality', { 
            quality: Math.round(translationQuality * 100) 
          }) }}
        </span>
      </div>
      
      <div 
        v-if="primaryLanguage && secondaryLanguage && isGoodCombination"
        class="message success"
      >
        <span class="icon">✨</span>
        <span class="text">{{ $t('multiLang.excellentCombination') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { 
  SUPPORTED_LANGUAGES, 
  POPULAR_LANGUAGES,
  getExpectedTranslationQuality,
  getTTSQualityGrade,
  type SupportedLanguageCode
} from '@/constants/languages';
import { useMultiLangAudio } from '@/composables/useMultiLangAudio';

// Props
interface Props {
  modelValue?: {
    primary: string;
    secondary: string;
  };
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({ primary: 'ko', secondary: 'en' }),
  disabled: false
});

// Emits
interface Emits {
  (e: 'update:modelValue', value: { primary: string; secondary: string }): void;
  (e: 'change', value: { primary: string; secondary: string }): void;
  (e: 'primary-changed', languageCode: string): void;
  (e: 'secondary-changed', languageCode: string): void;
}

const emit = defineEmits<Emits>();

// Audio system
const { speakText, checkTTSSupport } = useMultiLangAudio();

// State
const primaryLanguage = ref<string>(props.modelValue.primary);
const secondaryLanguage = ref<string>(props.modelValue.secondary);
const isTesting = ref(false);
const testingLanguage = ref<string>('');

// Computed properties
const popularLanguages = computed(() => 
  POPULAR_LANGUAGES.map(code => SUPPORTED_LANGUAGES[code])
);

const otherLanguages = computed(() => 
  Object.values(SUPPORTED_LANGUAGES).filter(
    lang => !POPULAR_LANGUAGES.includes(lang.code as SupportedLanguageCode)
  )
);

const availableSecondaryLanguages = computed(() => 
  Object.values(SUPPORTED_LANGUAGES).filter(
    lang => lang.code !== primaryLanguage.value
  )
);

const remainingLanguages = computed(() => 
  Object.values(SUPPORTED_LANGUAGES).filter(
    lang => lang.code !== primaryLanguage.value && lang.code !== secondaryLanguage.value
  )
);

const remainingLanguagesCount = computed(() => 
  remainingLanguages.value.length
);

const remainingLanguagesPreview = computed(() => 
  remainingLanguages.value.slice(0, 6)
);

const translationQuality = computed(() => {
  if (!primaryLanguage.value || !secondaryLanguage.value) return 1;
  return getExpectedTranslationQuality(primaryLanguage.value, secondaryLanguage.value);
});

const isGoodCombination = computed(() => 
  translationQuality.value >= 0.85
);

// Language info getters
const getPrimaryConfig = () => SUPPORTED_LANGUAGES[primaryLanguage.value as SupportedLanguageCode];
const getSecondaryConfig = () => SUPPORTED_LANGUAGES[secondaryLanguage.value as SupportedLanguageCode];

const getTTSQuality = (langCode: string) => getTTSQualityGrade(langCode);

const getTTSQualityText = (langCode: string) => {
  const grade = getTTSQuality(langCode);
  const qualityMap = {
    excellent: '최고',
    good: '좋음',
    fair: '보통',
    poor: '제한적'
  };
  return qualityMap[grade];
};

// Methods
const selectPrimaryLanguage = (langCode: string) => {
  if (langCode === secondaryLanguage.value) return;
  
  primaryLanguage.value = langCode;
  emit('primary-changed', langCode);
  emitUpdate();
  
  console.log(`🌟 Primary language selected: ${SUPPORTED_LANGUAGES[langCode as SupportedLanguageCode].name}`);
};

const selectSecondaryLanguage = (langCode: string) => {
  if (langCode === primaryLanguage.value) return;
  
  secondaryLanguage.value = langCode;
  emit('secondary-changed', langCode);
  emitUpdate();
  
  console.log(`🌐 Secondary language selected: ${SUPPORTED_LANGUAGES[langCode as SupportedLanguageCode].name}`);
};

const emitUpdate = () => {
  const value = {
    primary: primaryLanguage.value,
    secondary: secondaryLanguage.value
  };
  emit('update:modelValue', value);
  emit('change', value);
};

const testTTS = async (langCode: string) => {
  if (isTesting.value) return;
  
  const config = SUPPORTED_LANGUAGES[langCode as SupportedLanguageCode];
  if (!config) return;
  
  const isSupported = checkTTSSupport(langCode);
  if (!isSupported) {
    console.warn(`TTS not supported for ${config.name}`);
    return;
  }
  
  isTesting.value = true;
  testingLanguage.value = langCode;
  
  try {
    // 해당 언어로 "안녕하세요" 테스트
    const testTexts: Record<string, string> = {
      ko: '안녕하세요',
      en: 'Hello',
      zh: '你好',
      ja: 'こんにちは',
      es: 'Hola',
      fr: 'Bonjour',
      de: 'Hallo',
      ar: 'مرحبا',
      hi: 'नमस्ते',
      pt: 'Olá'
    };
    
    const testText = testTexts[langCode] || 'Hello';
    
    console.log(`🔊 Testing TTS for ${config.name}: "${testText}"`);
    await speakText(testText, langCode);
    
  } catch (error) {
    console.error(`TTS test failed for ${config.name}:`, error);
  } finally {
    isTesting.value = false;
    testingLanguage.value = '';
  }
};

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  primaryLanguage.value = newValue.primary;
  secondaryLanguage.value = newValue.secondary;
}, { deep: true });

// Ensure different languages are selected initially
watch(primaryLanguage, (newPrimary) => {
  if (newPrimary === secondaryLanguage.value) {
    // Auto-select a different secondary language
    const alternatives = availableSecondaryLanguages.value;
    if (alternatives.length > 0) {
      const preferredSecondary = alternatives.find(lang => lang.code === 'en') || alternatives[0];
      secondaryLanguage.value = preferredSecondary.code;
      emitUpdate();
    }
  }
});
</script>

<style scoped>
.language-selector {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.language-section {
  margin-bottom: var(--spacing-xl);
}

.language-section:last-of-type {
  margin-bottom: var(--spacing-lg);
}

.section-header {
  margin-bottom: var(--spacing-lg);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
  flex-wrap: wrap;
}

.section-title .icon {
  font-size: 1.5rem;
}

.section-title .subtitle {
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--color-text-secondary);
  margin-left: auto;
}

/* Primary language grid */
.primary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.language-button {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
  min-height: 80px;
}

.language-button:hover:not(.disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.language-button.selected {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.language-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: var(--color-bg-disabled);
}

.language-button .flag {
  font-size: 2rem;
  flex-shrink: 0;
}

.language-button .text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.language-button .native-name {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.language-button .local-name {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.language-button.small {
  min-height: 60px;
  padding: var(--spacing-md);
}

.language-button.small .flag {
  font-size: 1.5rem;
}

.language-button.small .native-name {
  font-size: 0.875rem;
}

.selected-indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  background: var(--color-success);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.selected-indicator .checkmark {
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
}

.popular-badge {
  position: absolute;
  top: -2px;
  left: -2px;
  background: var(--color-warning);
  color: var(--color-text-white);
  font-size: 0.625rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

.recommended-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--color-success);
  color: var(--color-text-white);
  font-size: 0.625rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
}

/* Other languages section */
.other-languages {
  grid-column: 1 / -1;
  margin-top: var(--spacing-md);
}

.other-languages-toggle {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.other-languages-toggle:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.other-languages-toggle .count {
  margin-left: auto;
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
}

.other-languages-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

/* Secondary language options */
.secondary-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-sm);
}

.language-option {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: left;
}

.language-option:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.language-option.selected {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

.language-option.recommended {
  border-color: var(--color-success);
  background: rgba(34, 197, 94, 0.05);
}

.language-option .flag {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.language-option .text-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.language-option .native-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.language-option .local-name {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Selection summary */
.selection-summary {
  background: var(--color-bg-tertiary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.summary-header h4 {
  margin: 0 0 var(--spacing-md) 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.language-pair {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  flex-wrap: wrap;
}

.pair-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  flex: 1;
  min-width: 200px;
}

.pair-item .flag.large {
  font-size: 2rem;
}

.pair-item .info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pair-item .role {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
}

.pair-item .name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.quality-indicator {
  margin-top: 4px;
}

.tts-quality {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
}

.tts-quality.quality-excellent { color: var(--color-success); }
.tts-quality.quality-good { color: var(--color-primary); }
.tts-quality.quality-fair { color: var(--color-warning); }
.tts-quality.quality-poor { color: var(--color-danger); }

.test-button {
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

.test-button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-button.testing {
  background: var(--color-primary-light);
}

.arrow-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  white-space: nowrap;
}

.arrow-connector .arrow {
  font-size: 1.5rem;
  color: var(--color-primary);
}

.auto-complete-preview {
  padding: var(--spacing-md);
  background: rgba(99, 102, 241, 0.05);
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: var(--radius-md);
}

.preview-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.remaining-languages {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.remaining-language {
  font-size: 1.5rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}

.remaining-language:hover {
  opacity: 1;
}

.more-languages {
  font-size: 0.875rem;
  color: var(--color-text-tertiary);
  align-self: center;
}

/* Guidance messages */
.guidance-messages {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.message {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
}

.message.warning {
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: var(--color-warning-dark);
}

.message.caution {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--color-danger-dark);
}

.message.success {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: var(--color-success-dark);
}

/* Animations */
.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
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
  .language-selector {
    padding: var(--spacing-md);
  }
  
  .primary-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .secondary-options {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .language-pair {
    flex-direction: column;
    gap: var(--spacing-sm);
  }
  
  .pair-item {
    min-width: auto;
  }
  
  .arrow-connector {
    transform: rotate(90deg);
  }
  
  .arrow-connector .arrow {
    transform: rotate(90deg);
  }
  
  .other-languages-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.125rem;
    flex-direction: column;
    align-items: flex-start;
  }
  
  .section-title .subtitle {
    margin-left: 0;
    margin-top: 4px;
  }
  
  .language-button {
    padding: var(--spacing-md);
    min-height: 60px;
  }
  
  .language-button .flag {
    font-size: 1.5rem;
  }
  
  .remaining-languages {
    justify-content: center;
  }
}</style>