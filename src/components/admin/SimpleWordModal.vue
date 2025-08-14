<template>
  <div v-if="show" class="modal-overlay" @click="handleClose">
    <div class="modal-content simple-word-modal" @click.stop>
      <div class="modal-header">
        <h2>
          <span class="title-icon">📝</span>
          {{ word ? $t('admin.editWord') : $t('admin.addNewWord') }}
        </h2>
        <button @click="handleClose" class="modal-close">×</button>
      </div>
      
      <div class="modal-body">
        <form @submit.prevent="handleSave" class="word-form">
          <!-- 기본 정보 입력 -->
          <div class="form-group">
            <label class="form-label required">{{ $t('forms.koreanName') }}</label>
            <input
              v-model="formData.korean"
              type="text"
              class="form-input"
              :placeholder="$t('forms.koreanNamePlaceholder')"
              required
            />
          </div>

          <div class="form-group">
            <label class="form-label required">{{ $t('forms.englishName') }}</label>
            <input
              v-model="formData.english"
              type="text"
              class="form-input"
              :placeholder="$t('forms.englishNamePlaceholder')"
              required
            />
          </div>

          <!-- 다국어 자동 번역 토글 -->
          <div class="form-group">
            <div class="auto-translate-toggle" :class="{ 'enabled': formData.autoTranslate }">
              <div class="toggle-header">
                <label class="toggle-label">
                  <input
                    v-model="formData.autoTranslate"
                    type="checkbox"
                    class="toggle-input"
                  />
                  <span class="toggle-slider"></span>
                  <span class="toggle-text">
                    <span class="mode-icon">{{ formData.autoTranslate ? '🌍' : '🔄' }}</span>
                    <span class="mode-title">{{ formData.autoTranslate ? '다국어 자동 번역 모드' : '기본 모드 (한국어, 영어만)' }}</span>
                  </span>
                </label>
              </div>
              
              <div class="toggle-info">
                <div v-if="formData.autoTranslate" class="multilang-info">
                  <p class="info-title">✨ 자동으로 처리될 언어들:</p>
                  <div class="language-list">
                    <span class="lang-item primary">🇰🇷 한국어</span>
                    <span class="lang-item primary">🇺🇸 영어</span>
                    <span class="lang-item auto">🇯🇵 일본어</span>
                    <span class="lang-item auto">🇨🇳 중국어</span>
                    <span class="lang-item auto">🇪🇸 스페인어</span>
                    <span class="lang-item auto">🇫🇷 프랑스어</span>
                    <span class="lang-item auto">+4개 더</span>
                  </div>
                  <p class="processing-note">💡 브라우저 무료 번역을 기본으로 사용하여 비용 없이 처리됩니다</p>
                </div>
                
                <div v-else class="basic-info">
                  <p class="info-desc">한국어와 영어만 저장됩니다. 다른 언어로 번역하려면 위 토글을 활성화하세요.</p>
                </div>
              </div>
            </div>
          </div>

          <!-- 고급 번역 옵션 (자동 번역 활성화 시에만 표시) -->
          <div v-if="formData.autoTranslate" class="form-group advanced-options">
            <div class="advanced-header" @click="showAdvanced = !showAdvanced">
              <span>⚙️ {{ $t('admin.advancedOptions') }}</span>
              <span class="toggle-icon">{{ showAdvanced ? '▼' : '▶' }}</span>
            </div>
            
            <div v-if="showAdvanced" class="advanced-content">
              <label class="form-label">{{ $t('admin.translationService') }}</label>
              <select v-model="formData.translationService" class="form-input">
                <option value="browser">🆓 {{ $t('admin.browserTranslation') }} (무료)</option>
                <option value="google">🔵 Google Translate</option>
                <option value="microsoft">🟢 Microsoft Translator</option>
                <option value="papago">🟡 Naver Papago</option>
              </select>
              <p class="service-description">
                {{ getServiceDescription(formData.translationService) }}
              </p>
            </div>
          </div>

          <!-- 카테고리 및 연령 -->
          <div class="form-row">
            <div class="form-group half">
              <label class="form-label required">{{ $t('forms.category') }}</label>
              <select v-model="formData.category" class="form-input" required>
                <option value="animals">{{ $t('categories.animals') }}</option>
                <option value="fruits">{{ $t('categories.fruits') }}</option>
                <option value="vehicles">{{ $t('categories.vehicles') }}</option>
                <option value="objects">{{ $t('categories.objects') }}</option>
                <option value="nature">{{ $t('categories.nature') }}</option>
                <option value="toys">{{ $t('categories.toys') }}</option>
                <option value="clothes">{{ $t('categories.clothes') }}</option>
                <option value="other">{{ $t('categories.other') }}</option>
              </select>
            </div>

            <div class="form-group half">
              <label class="form-label">{{ $t('forms.appropriateAge') }}</label>
              <div class="age-range">
                <select v-model="formData.minAge" class="form-input small">
                  <option v-for="age in [3,4,5,6]" :key="age" :value="age">{{ age }}세</option>
                </select>
                <span class="range-separator">~</span>
                <select v-model="formData.maxAge" class="form-input small">
                  <option v-for="age in [3,4,5,6]" :key="age" :value="age">{{ age }}세</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 선택적 이미지 업로드 -->
          <div class="form-group">
            <label class="form-label optional">{{ $t('forms.image') }}</label>
            <FileUploadInput
              v-model="formData.imageUrl"
              :label="$t('forms.image')"
              file-type="image"
              :placeholder="$t('forms.imagePlaceholder')"
            />
            <p class="form-hint">{{ $t('forms.autoFetchInfo') }}</p>
          </div>

          <!-- 처리 상태 표시 -->
          <div v-if="isProcessing" class="processing-status">
            <div class="status-header">
              <span class="status-icon">⚡</span>
              <span>{{ $t('multiLang.processing') }}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: processingProgress + '%' }"></div>
            </div>
            <p class="status-text">{{ currentProcessingStep }}</p>
          </div>
        </form>
      </div>

      <div class="modal-footer">
        <button type="button" @click="handleClose" class="btn btn-secondary">
          {{ $t('common.cancel') }}
        </button>
        <button 
          type="button" 
          @click="handleSave" 
          class="btn btn-primary"
          :disabled="!canSave || isProcessing"
        >
          <span v-if="isProcessing" class="spinner"></span>
          {{ isProcessing ? $t('common.processing') : (word ? $t('common.save') : $t('admin.addNewWord')) }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import FileUploadInput from '@/components/FileUploadInput.vue';
import { useMultiLangProcessor } from '@/composables/useMultiLangProcessor';
import { useAutoImageFetch } from '@/composables/useAutoImageFetch';
import type { WordItem } from '@/types';

// Props
interface Props {
  show: boolean;
  word?: WordItem | null;
  isSystemAdmin: boolean;
}

const props = defineProps<Props>();

// Emits
interface Emits {
  (e: 'close'): void;
  (e: 'save', wordData: WordItem): void;
}

const emit = defineEmits<Emits>();

// Composables
const processor = useMultiLangProcessor();
const imageService = useAutoImageFetch();

// State
const formData = ref({
  korean: '',
  english: '',
  category: 'vehicles',
  minAge: 3,
  maxAge: 6,
  autoTranslate: true, // 기본적으로 자동 번역 활성화
  translationService: 'browser', // 기본은 브라우저 번역
  imageUrl: ''
});

const showAdvanced = ref(false);
const isProcessing = ref(false);
const processingProgress = ref(0);
const currentProcessingStep = ref('');

// Computed
const canSave = computed(() => {
  return formData.value.korean.trim() && 
         formData.value.english.trim() && 
         formData.value.category;
});

// Methods
const getServiceDescription = (service: string): string => {
  const descriptions = {
    browser: '브라우저 내장 번역 - 완전 무료, 기본 품질',
    google: 'Google Translate - 높은 정확도, 월 50만자 무료',
    microsoft: 'Microsoft Translator - 월 200만자 무료',
    papago: 'Naver Papago - 일 1만자 무료, 한국어 특화'
  };
  return descriptions[service] || '';
};

const handleSave = async () => {
  if (!canSave.value || isProcessing.value) return;
  
  console.log('🚀 Starting word save process:', formData.value);
  
  isProcessing.value = true;
  processingProgress.value = 0;
  
  try {
    let finalWordData: WordItem;
    
    if (formData.value.autoTranslate) {
      // 자동 번역 모드
      currentProcessingStep.value = '이미지 검색 중...';
      processingProgress.value = 20;
      
      // 이미지가 없으면 자동 검색
      let imageUrl = formData.value.imageUrl;
      if (!imageUrl) {
        imageUrl = await imageService.fetchAndUploadImage(
          formData.value.korean,
          formData.value.english
        );
      }
      
      currentProcessingStep.value = '다국어 번역 중...';
      processingProgress.value = 60;
      
      // 다국어 처리
      const multiLangData = {
        primaryText: formData.value.korean,
        secondaryText: formData.value.english,
        category: formData.value.category,
        minAge: formData.value.minAge,
        maxAge: formData.value.maxAge,
        languages: { primary: 'ko', secondary: 'en' }
      };
      
      const result = await processor.processMultiLangWord(multiLangData);
      
      processingProgress.value = 100;
      currentProcessingStep.value = '완료!';
      
      // 결과를 기존 WordItem 형식으로 변환
      finalWordData = {
        id: props.word?.id || '',
        name: formData.value.korean,
        nameEn: formData.value.english,
        imageUrl: result.imageUrl || imageUrl,
        audioKo: '',
        audioEn: '',
        category: formData.value.category,
        minAge: formData.value.minAge,
        maxAge: formData.value.maxAge,
        ownerType: props.isSystemAdmin ? 'global' : 'user',
        // 다국어 데이터 추가
        translations: result.translations,
        autoTranslated: true
      };
    } else {
      // 기본 모드 (한국어, 영어만)
      currentProcessingStep.value = '이미지 검색 중...';
      processingProgress.value = 50;
      
      let imageUrl = formData.value.imageUrl;
      if (!imageUrl) {
        imageUrl = await imageService.fetchAndUploadImage(
          formData.value.korean,
          formData.value.english
        );
      }
      
      processingProgress.value = 100;
      currentProcessingStep.value = '완료!';
      
      finalWordData = {
        id: props.word?.id || '',
        name: formData.value.korean,
        nameEn: formData.value.english,
        imageUrl: imageUrl || '',
        audioKo: '',
        audioEn: '',
        category: formData.value.category,
        minAge: formData.value.minAge,
        maxAge: formData.value.maxAge,
        ownerType: props.isSystemAdmin ? 'global' : 'user',
        autoTranslated: false
      };
    }
    
    console.log('✅ Emitting save event with data:', finalWordData);
    emit('save', finalWordData);
    
  } catch (error) {
    console.error('❌ 단어 저장 실패:', error);
    currentProcessingStep.value = '오류 발생: ' + (error instanceof Error ? error.message : '알 수 없는 오류');
  } finally {
    setTimeout(() => {
      isProcessing.value = false;
      processingProgress.value = 0;
      currentProcessingStep.value = '';
    }, 1000);
  }
};

const handleClose = () => {
  emit('close');
};

const resetForm = () => {
  formData.value = {
    korean: '',
    english: '',
    category: 'vehicles',
    minAge: 3,
    maxAge: 6,
    autoTranslate: true,
    translationService: 'browser',
    imageUrl: ''
  };
  showAdvanced.value = false;
};

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.word) {
      // 편집 모드
      formData.value = {
        korean: props.word.name || '',
        english: props.word.nameEn || '',
        category: props.word.category || 'vehicles',
        minAge: props.word.minAge || 3,
        maxAge: props.word.maxAge || 6,
        autoTranslate: !!(props.word as any).autoTranslated,
        translationService: 'browser',
        imageUrl: props.word.imageUrl || ''
      };
    } else {
      // 추가 모드
      resetForm();
    }
  }
});

watch(() => formData.value.minAge, (newMin) => {
  if (newMin > formData.value.maxAge) {
    formData.value.maxAge = newMin;
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

.simple-word-modal {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 600px;
  max-height: 95vh;
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

.title-icon {
  font-size: 1.8rem;
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
}

.word-form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-group.half {
  margin: 0;
}

.form-label {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-label.required::after {
  content: ' *';
  color: var(--color-error);
}

.form-label.optional::after {
  content: ' (선택)';
  color: var(--color-text-secondary);
  font-weight: 400;
}

.form-input {
  padding: var(--spacing-md);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-input.small {
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

.auto-translate-toggle {
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.auto-translate-toggle.enabled {
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(168, 85, 247, 0.05));
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.toggle-header {
  margin-bottom: var(--spacing-md);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
  font-weight: 500;
}

.toggle-input {
  display: none;
}

.toggle-slider {
  width: 44px;
  height: 24px;
  background: var(--color-border);
  border-radius: 12px;
  position: relative;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  top: 2px;
  left: 2px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.toggle-input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle-input:checked + .toggle-slider::before {
  transform: translateX(20px);
}

.toggle-text {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 1rem;
}

.mode-icon {
  font-size: 1.2rem;
}

.mode-title {
  font-weight: 600;
  color: var(--color-text-primary);
}

.toggle-info {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-md);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.multilang-info .info-title {
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 0.9rem;
}

.language-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.lang-item {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid;
}

.lang-item.primary {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.lang-item.auto {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border-color: var(--color-border);
}

.processing-note {
  font-size: 0.8rem;
  color: var(--color-success);
  margin: 0;
  font-style: italic;
}

.basic-info .info-desc {
  font-size: 0.85rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.advanced-options {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.advanced-header {
  background: var(--color-bg-secondary);
  padding: var(--spacing-md) var(--spacing-lg);
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
  color: var(--color-text-primary);
  transition: background 0.2s ease;
}

.advanced-header:hover {
  background: var(--color-bg-hover);
}

.toggle-icon {
  color: var(--color-text-secondary);
  transition: transform 0.2s ease;
}

.advanced-content {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.service-description {
  margin-top: var(--spacing-xs);
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.form-hint {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  margin: var(--spacing-xs) 0 0 0;
}

.processing-status {
  background: var(--color-primary-light);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.status-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 600;
  color: var(--color-primary-dark);
  margin-bottom: var(--spacing-md);
}

.status-icon {
  font-size: 1.2rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: var(--spacing-sm);
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s ease;
}

.status-text {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  margin: 0;
}

.modal-footer {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
}

.btn {
  padding: var(--spacing-md) var(--spacing-xl);
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-xs);
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

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
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

/* Responsive design */
@media (max-width: 768px) {
  .simple-word-modal {
    max-width: 95vw;
    margin: var(--spacing-md);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>