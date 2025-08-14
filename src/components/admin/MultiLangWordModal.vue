<template>
  <div v-if="show" class="modal-overlay" @click="handleClose">
    <div class="modal-content multilang-modal" @click.stop>
      <div class="modal-header">
        <div class="step-header">
          <h2>
            <span class="title-icon">🌍</span>
            {{ word ? $t('multiLang.editWord') : $t('multiLang.formTitle') }}
          </h2>
          <p class="subtitle">{{ $t('multiLang.formSubtitle') }}</p>
          <div class="step-indicator">
            <div class="steps">
              <div 
                v-for="(step, index) in steps" 
                :key="index"
                class="step-item"
                :class="{ 
                  'active': currentStep === index + 1, 
                  'completed': currentStep > index + 1 
                }"
              >
                <div class="step-number">{{ index + 1 }}</div>
                <div class="step-title">{{ step.title }}</div>
              </div>
            </div>
          </div>
        </div>
        <button @click="handleClose" class="modal-close">×</button>
      </div>
      
      <div class="modal-body">
        <!-- Step 1: 언어 선택 및 기본 입력 -->
        <div v-if="currentStep === 1" class="step-content">
          <MultiLangWordForm
            ref="multiLangFormRef"
            v-model="formData"
            @start-processing="handleStartProcessing"
            @input-change="handleInputChange"
          />
        </div>

        <!-- Step 2: 자동 처리 진행 상황 -->
        <div v-if="currentStep === 2" class="step-content">
          <TranslationProgress
            ref="translationProgressRef"
            :status="processingStatus"
            :form-data="formDataWithLanguages"
          />
        </div>

        <!-- Step 3: 커스터마이징 (선택사항) -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="customization-section">
            <div class="section-header">
              <h3>{{ $t('multiLang.customization') }}</h3>
              <p class="section-description">원하는 경우 번역된 내용이나 이미지를 수정할 수 있습니다.</p>
            </div>

            <div class="customization-content">
              <!-- 이미지 커스터마이징 -->
              <div class="custom-group">
                <h4>{{ $t('multiLang.customImage') }}</h4>
                <FileUploadInput
                  v-model="processedData.imageUrl"
                  type="image"
                  :placeholder="$t('forms.imagePlaceholder')"
                  @upload-complete="onImageUpload"
                />
                <div v-if="processedData.imageUrl" class="current-image">
                  <img :src="processedData.imageUrl" alt="Current image" class="preview-image" />
                </div>
              </div>

              <!-- 번역 수정 (품질 검증 포함) -->
              <div class="custom-group">
                <h4>{{ $t('multiLang.translationEdit') }}</h4>
                <div class="translation-grid">
                  <div 
                    v-for="(translation, langCode) in processedData.translations" 
                    :key="langCode"
                    class="translation-item-enhanced"
                  >
                    <div class="translation-header">
                      <label class="translation-label">
                        <span class="flag">{{ SUPPORTED_LANGUAGES[langCode]?.flag }}</span>
                        <span class="language-name">{{ SUPPORTED_LANGUAGES[langCode]?.nativeName }}</span>
                      </label>
                      
                      <!-- 품질 지표 -->
                      <div v-if="translationQualities[langCode]" class="quality-indicator-mini">
                        <TranslationQualityIndicator
                          :quality-score="translationQualities[langCode]"
                          :show-details="false"
                          :show-actions="false"
                          compact
                        />
                      </div>
                    </div>
                    
                    <div class="translation-input-group">
                      <input
                        v-model="translation.name"
                        type="text"
                        class="translation-input"
                        :class="getTranslationInputClass(langCode)"
                        @input="onTranslationEdit(langCode, $event)"
                        @blur="validateTranslation(langCode)"
                      />
                      
                      <div class="translation-actions">
                        <!-- TTS 테스트 버튼 -->
                        <button
                          @click="testTTS(langCode, translation.name)"
                          :disabled="isTesting"
                          class="tts-test-button"
                          :class="{ testing: testingLanguage === langCode }"
                          type="button"
                          :title="$t('multiLang.testPronunciation')"
                        >
                          <span v-if="testingLanguage === langCode" class="spinner"></span>
                          <span v-else>🔊</span>
                        </button>
                        
                        <!-- 품질 검증 버튼 -->
                        <button
                          v-if="shouldShowValidationButton(langCode)"
                          @click="openValidationModal(langCode)"
                          class="validation-button"
                          :class="getValidationButtonClass(langCode)"
                          type="button"
                          :title="$t('quality.validateTranslation')"
                        >
                          <span class="validation-icon">{{ getValidationIcon(langCode) }}</span>
                        </button>
                        
                        <!-- 대안 제안 버튼 -->
                        <button
                          v-if="translationAlternatives[langCode]?.length > 0"
                          @click="showAlternatives(langCode)"
                          class="alternatives-button"
                          type="button"
                          :title="$t('quality.showAlternatives')"
                        >
                          <span class="alternatives-icon">💡</span>
                          <span class="alternatives-count">{{ translationAlternatives[langCode].length }}</span>
                        </button>
                      </div>
                    </div>
                    
                    <!-- 품질 경고 메시지 -->
                    <div 
                      v-if="getQualityWarning(langCode)" 
                      class="quality-warning"
                    >
                      <span class="warning-icon">⚠️</span>
                      <span class="warning-text">{{ getQualityWarning(langCode) }}</span>
                    </div>
                    
                    <!-- 대안 번역 표시 -->
                    <div 
                      v-if="showingAlternatives[langCode] && translationAlternatives[langCode]?.length > 0"
                      class="alternatives-dropdown"
                    >
                      <div class="alternatives-header">
                        <span>{{ $t('quality.suggestedAlternatives') }}</span>
                        <button @click="hideAlternatives(langCode)" class="close-alternatives">×</button>
                      </div>
                      <div class="alternatives-list">
                        <button
                          v-for="(alternative, index) in translationAlternatives[langCode]"
                          :key="index"
                          @click="selectAlternative(langCode, alternative)"
                          class="alternative-option"
                          type="button"
                        >
                          {{ alternative }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 기본 설정 -->
              <div class="custom-group">
                <h4>{{ $t('forms.category') }}</h4>
                <select v-model="processedData.category" class="form-control">
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

              <div class="custom-group">
                <h4>{{ $t('forms.appropriateAge') }}</h4>
                <div class="age-range">
                  <select v-model="processedData.minAge" class="form-control small">
                    <option v-for="age in [3,4,5,6,7,8]" :key="age" :value="age">{{ age }}세</option>
                  </select>
                  <span class="range-separator">~</span>
                  <select v-model="processedData.maxAge" class="form-control small">
                    <option v-for="age in [3,4,5,6,7,8]" :key="age" :value="age">{{ age }}세</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: 최종 확인 및 저장 -->
        <div v-if="currentStep === 4" class="step-content">
          <div class="confirmation-section">
            <div class="confirmation-header">
              <h3>{{ $t('multiLang.finalConfirmation') }}</h3>
              <p class="confirmation-description">모든 설정이 완료되었습니다. 다음 내용으로 단어를 저장합니다.</p>
            </div>

            <div class="confirmation-content">
              <!-- 이미지 미리보기 -->
              <div class="preview-group">
                <h4>{{ $t('forms.image') }}</h4>
                <div class="image-preview">
                  <img :src="processedData.imageUrl" alt="Word image" class="final-preview-image" />
                </div>
              </div>

              <!-- 번역 요약 -->
              <div class="preview-group">
                <h4>{{ $t('multiLang.translationSummary') }}</h4>
                <div class="translation-summary">
                  <div 
                    v-for="(translation, langCode) in processedData.translations" 
                    :key="langCode"
                    class="summary-item"
                  >
                    <span class="flag">{{ SUPPORTED_LANGUAGES[langCode]?.flag }}</span>
                    <span class="language-name">{{ SUPPORTED_LANGUAGES[langCode]?.nativeName }}:</span>
                    <span class="translation-text">{{ translation.name }}</span>
                    <button
                      @click="testTTS(langCode, translation.name)"
                      :disabled="isTesting"
                      class="tts-button small"
                      :class="{ testing: testingLanguage === langCode }"
                    >
                      <span v-if="testingLanguage === langCode" class="spinner"></span>
                      <span v-else>🔊</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- 기본 정보 요약 -->
              <div class="preview-group">
                <h4>{{ $t('forms.summary.title') }}</h4>
                <div class="basic-info-summary">
                  <div class="info-item">
                    <span class="label">{{ $t('forms.category') }}:</span>
                    <span class="value">{{ $t(`categories.${processedData.category}`) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ $t('forms.appropriateAge') }}:</span>
                    <span class="value">{{ processedData.minAge }}~{{ processedData.maxAge }}세</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ $t('admin.ownership.type') }}:</span>
                    <span class="value">{{ processedData.ownerType === 'global' ? $t('admin.ownership.global') : $t('admin.ownership.user') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button 
          v-if="currentStep > 1 && currentStep !== 2" 
          type="button" 
          @click="previousStep" 
          class="btn btn-secondary"
          :disabled="isProcessing"
        >
          {{ $t('common.back') }}
        </button>
        
        <button 
          v-if="currentStep === 1" 
          type="button" 
          @click="nextStep" 
          class="btn btn-primary"
          :disabled="!canProceedStep1"
        >
          {{ $t('common.next') }}
        </button>

        <button 
          v-if="currentStep === 3" 
          type="button" 
          @click="nextStep" 
          class="btn btn-primary"
        >
          {{ $t('multiLang.proceedToSave') }}
        </button>
        
        <button 
          v-if="currentStep === 4" 
          type="button" 
          @click="handleSave" 
          class="btn btn-success"
          :disabled="isSaving"
        >
          <span v-if="isSaving" class="spinner"></span>
          {{ isSaving ? $t('common.processing') : $t('multiLang.saveWord') }}
        </button>
      </div>
    </div>

    <!-- 번역 검증 모달 -->
    <TranslationValidationModal
      :show="validationModalOpen"
      :source-text="formDataWithLanguages.primaryText"
      :current-translation="getCurrentTranslation()"
      :source-lang="formDataWithLanguages.languages.primary as SupportedLanguageCode"
      :target-lang="currentValidationLang as SupportedLanguageCode"
      :quality-score="translationQualities[currentValidationLang]"
      :alternatives="translationAlternatives[currentValidationLang] || []"
      @close="validationModalOpen = false"
      @validate-correct="handleValidationCorrect"
      @submit-correction="handleValidationSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import MultiLangWordForm from '@/components/multilang/MultiLangWordForm.vue';
import TranslationProgress from '@/components/multilang/TranslationProgress.vue';
import TranslationQualityIndicator from '@/components/multilang/TranslationQualityIndicator.vue';
import TranslationValidationModal from '@/components/multilang/TranslationValidationModal.vue';
import FileUploadInput from '@/components/FileUploadInput.vue';
import { SUPPORTED_LANGUAGES, type SupportedLanguageCode } from '@/constants/languages';
import { useMultiLangAudio } from '@/composables/useMultiLangAudio';
import { useMultiLangProcessor } from '@/composables/useMultiLangProcessor';
import { useTranslationQuality } from '@/composables/useTranslationQuality';
import { WordCompatibilityHelper } from '@/utils/wordCompatibility';
import type { 
  MultiLangFormData, 
  AutoProcessingStatus, 
  MultiLangWordItem, 
  TranslationResult,
  TranslationQualityScore,
  UserTranslationValidation
} from '@/types/multilingual';
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
  (e: 'save', wordData: MultiLangWordItem): void;
}

const emit = defineEmits<Emits>();

// Composables
const { speakText } = useMultiLangAudio();
const processor = useMultiLangProcessor();
const { 
  calculateQuality, 
  getSuggestedAlternatives,
  startValidation,
  submitValidation,
  confirmTranslationCorrect,
  isQualitySuitableForChildren,
  getParentalGuidanceMessage,
  getQualityColor,
  getQualityIcon
} = useTranslationQuality();

// Refs
const multiLangFormRef = ref<InstanceType<typeof MultiLangWordForm> | null>(null);
const translationProgressRef = ref<InstanceType<typeof TranslationProgress> | null>(null);

// State
const currentStep = ref(1);
const isProcessing = ref(false);
const isSaving = ref(false);
const isTesting = ref(false);
const testingLanguage = ref('');

// Quality validation state
const translationQualities = ref<Record<string, TranslationQualityScore>>({});
const translationAlternatives = ref<Record<string, string[]>>({});
const showingAlternatives = ref<Record<string, boolean>>({});
const validationModalOpen = ref(false);
const currentValidationLang = ref<string>('');

const formData = ref<MultiLangFormData>({
  primaryText: '',
  secondaryText: '',
  category: 'animals',
  minAge: 3,
  maxAge: 8
});

const formDataWithLanguages = ref<MultiLangFormData & { languages: { primary: string; secondary: string } }>({
  primaryText: '',
  secondaryText: '',
  category: 'animals',
  minAge: 3,
  maxAge: 8,
  languages: { primary: 'ko', secondary: 'en' }
});

// 처리 상태는 processor에서 관리
const processingStatus = computed(() => processor.processingStatus.value);

const processedData = ref<MultiLangWordItem>({
  id: '',
  name: '',
  nameEn: '',
  imageUrl: '',
  audioKo: '',
  audioEn: '',
  category: 'animals',
  minAge: 3,
  maxAge: 8,
  ownerType: 'user',
  translations: {},
  primaryLanguage: 'ko',
  secondaryLanguage: 'en',
  autoTranslatedLanguages: []
});

// Computed
const steps = computed(() => [
  { title: $t('multiLang.languageAndInput') || '언어 선택 및 입력' },
  { title: $t('multiLang.autoProcessing') || '자동 처리' },
  { title: $t('multiLang.customization') || '커스터마이징' },
  { title: $t('multiLang.finalConfirmation') || '최종 확인' }
]);

const canProceedStep1 = computed(() => {
  return formData.value.primaryText.trim() && 
         formData.value.secondaryText.trim() &&
         formDataWithLanguages.value.languages.primary &&
         formDataWithLanguages.value.languages.secondary;
});

// Methods
const handleInputChange = (field: string, value: string) => {
  console.log(`📝 Input changed: ${field} = "${value}"`);
};

const handleStartProcessing = async (data: MultiLangFormData & { languages: { primary: string; secondary: string } }) => {
  console.log('🚀 다국어 처리 시작:', data);
  
  formDataWithLanguages.value = data;
  isProcessing.value = true;
  currentStep.value = 2;
  
  try {
    // 실제 다국어 처리 시작
    const result = await processor.processMultiLangWord(data);
    
    // 처리 결과로 processedData 업데이트
    processedData.value = {
      id: props.word?.id || '',
      name: result.translations[data.languages.primary as SupportedLanguageCode]?.name || data.primaryText,
      nameEn: result.translations[data.languages.secondary as SupportedLanguageCode]?.name || data.secondaryText,
      imageUrl: result.imageUrl,
      audioKo: '',
      audioEn: '',
      category: data.category,
      minAge: data.minAge,
      maxAge: data.maxAge,
      ownerType: props.isSystemAdmin ? 'global' : 'user',
      translations: result.translations,
      primaryLanguage: data.languages.primary,
      secondaryLanguage: data.languages.secondary,
      autoTranslatedLanguages: Object.keys(result.translations).filter(
        lang => lang !== data.languages.primary && lang !== data.languages.secondary
      )
    };
    
    // 자동으로 3단계(커스텀마이지)로 이동
    setTimeout(() => {
      currentStep.value = 3;
      isProcessing.value = false;
    }, 1000);
    
  } catch (error) {
    console.error('❌ 다국어 처리 실패:', error);
    isProcessing.value = false;
    // 에러 처리 부분에서 사용자에게 알림
  }
};

// 이 메서드는 이제 handleStartProcessing에서 처리되므로 삭제
// const handleProcessingComplete = ... (removed)

const handleProcessingError = (error: any) => {
  console.error('❌ Processing error:', error);
  isProcessing.value = false;
  // Could show an error modal or message
};

const goToCustomization = () => {
  currentStep.value = 3;
};

const nextStep = () => {
  if (currentStep.value < steps.value.length) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1 && currentStep.value !== 2) { // Cannot go back during processing
    currentStep.value--;
  }
};

const onImageUpload = (imageUrl: string) => {
  processedData.value.imageUrl = imageUrl;
  console.log('📷 Custom image uploaded:', imageUrl);
};

const onTranslationEdit = (langCode: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  if (processedData.value.translations[langCode]) {
    processedData.value.translations[langCode].name = target.value;
    console.log(`📝 Translation edited: ${langCode} = "${target.value}"`);
  }
};

const testTTS = async (langCode: string, text: string) => {
  if (isTesting.value || !text.trim()) return;
  
  isTesting.value = true;
  testingLanguage.value = langCode;
  
  try {
    console.log(`🔊 Testing TTS: ${langCode} - "${text}"`);
    await speakText(text, langCode);
  } catch (error) {
    console.error(`TTS test failed:`, error);
  } finally {
    isTesting.value = false;
    testingLanguage.value = '';
  }
};

const handleSave = async () => {
  if (isSaving.value) return;
  
  isSaving.value = true;
  
  try {
    console.log('💾 Saving multilingual word:', processedData.value);
    
    // Convert to the expected format for the parent component
    const wordToSave: MultiLangWordItem = {
      ...processedData.value,
      // Ensure backward compatibility
      name: processedData.value.translations[processedData.value.primaryLanguage!]?.name || processedData.value.name,
      nameEn: processedData.value.translations[processedData.value.secondaryLanguage!]?.name || processedData.value.nameEn,
    };
    
    emit('save', wordToSave);
  } catch (error) {
    console.error('❌ Error saving word:', error);
  } finally {
    isSaving.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

// === 품질 검증 메서드들 ===

/**
 * 번역 품질 검증
 */
const validateTranslation = async (langCode: string) => {
  const translation = processedData.value.translations[langCode];
  if (!translation || !translation.name) return;

  try {
    // Mock translation result for quality calculation
    const mockTranslationResult: TranslationResult = {
      originalText: formDataWithLanguages.value.primaryText,
      translatedText: translation.name,
      sourceLanguage: formDataWithLanguages.value.languages.primary,
      targetLanguage: langCode,
      confidence: translation.confidence || 0.8,
      translatedBy: translation.translatedBy || 'auto',
      timestamp: Date.now()
    };

    // 품질 점수 계산
    const qualityScore = calculateQuality(
      mockTranslationResult,
      formDataWithLanguages.value.primaryText,
      formDataWithLanguages.value.languages.primary as SupportedLanguageCode,
      langCode as SupportedLanguageCode
    );

    translationQualities.value[langCode] = qualityScore;

    // 대안 번역 가져오기 (품질이 낮은 경우에만)
    if (qualityScore.needsValidation || qualityScore.overall < 80) {
      const alternatives = await getSuggestedAlternatives(
        formDataWithLanguages.value.primaryText,
        translation.name,
        formDataWithLanguages.value.languages.primary as SupportedLanguageCode,
        langCode as SupportedLanguageCode
      );
      translationAlternatives.value[langCode] = alternatives;
    }

    console.log(`🔍 ${langCode} 번역 품질 검증 완료:`, qualityScore);
  } catch (error) {
    console.error(`❌ ${langCode} 품질 검증 실패:`, error);
  }
};

/**
 * 품질 검증 모달 열기
 */
const openValidationModal = async (langCode: string) => {
  const translation = processedData.value.translations[langCode];
  if (!translation) return;

  currentValidationLang.value = langCode;
  
  // 검증 프로세스 시작
  await startValidation(
    formDataWithLanguages.value.primaryText,
    translation.name,
    formDataWithLanguages.value.languages.primary as SupportedLanguageCode,
    langCode as SupportedLanguageCode,
    translationQualities.value[langCode]
  );

  validationModalOpen.value = true;
};

/**
 * 번역 검증 완료 처리
 */
const handleValidationCorrect = async (validation: UserTranslationValidation) => {
  const success = await confirmTranslationCorrect(validation);
  if (success) {
    const langCode = currentValidationLang.value;
    // 검증 완료 표시
    if (translationQualities.value[langCode]) {
      translationQualities.value[langCode] = {
        ...translationQualities.value[langCode],
        grade: 'good',
        needsValidation: false
      };
    }
    validationModalOpen.value = false;
    console.log('✅ 번역 검증 완료');
  }
};

/**
 * 번역 수정 제출 처리
 */
const handleValidationSubmit = async (validation: UserTranslationValidation) => {
  const success = await submitValidation(validation);
  if (success) {
    const langCode = currentValidationLang.value;
    
    // 수정된 번역으로 업데이트
    if (processedData.value.translations[langCode]) {
      processedData.value.translations[langCode].name = validation.correctedTranslation;
      
      // 수정 후 품질 재계산
      await validateTranslation(langCode);
    }
    
    validationModalOpen.value = false;
    console.log('✅ 번역 수정 적용 완료');
  }
};

/**
 * 대안 번역 표시/숨기기
 */
const showAlternatives = (langCode: string) => {
  showingAlternatives.value[langCode] = true;
};

const hideAlternatives = (langCode: string) => {
  showingAlternatives.value[langCode] = false;
};

/**
 * 대안 번역 선택
 */
const selectAlternative = async (langCode: string, alternative: string) => {
  if (processedData.value.translations[langCode]) {
    processedData.value.translations[langCode].name = alternative;
    
    // 대안 선택 후 품질 재계산
    await validateTranslation(langCode);
    
    // 대안 목록 숨기기
    hideAlternatives(langCode);
    
    console.log(`🔄 ${langCode} 대안 번역 선택: "${alternative}"`);
  }
};

/**
 * 번역 입력 필드 CSS 클래스
 */
const getTranslationInputClass = (langCode: string): string => {
  const quality = translationQualities.value[langCode];
  if (!quality) return '';

  const classes = ['translation-input'];
  
  if (quality.needsValidation) {
    classes.push('needs-validation');
  } else if (quality.grade === 'excellent') {
    classes.push('high-quality');
  } else if (quality.grade === 'poor' || quality.grade === 'needs_review') {
    classes.push('low-quality');
  }

  return classes.join(' ');
};

/**
 * 검증 버튼 표시 여부
 */
const shouldShowValidationButton = (langCode: string): boolean => {
  const quality = translationQualities.value[langCode];
  return !quality || quality.needsValidation || quality.overall < 85;
};

/**
 * 검증 버튼 CSS 클래스
 */
const getValidationButtonClass = (langCode: string): string => {
  const quality = translationQualities.value[langCode];
  if (!quality) return 'validation-needed';
  
  if (quality.needsValidation) return 'validation-needed';
  if (quality.grade === 'poor' || quality.grade === 'needs_review') return 'validation-urgent';
  return 'validation-optional';
};

/**
 * 검증 아이콘
 */
const getValidationIcon = (langCode: string): string => {
  const quality = translationQualities.value[langCode];
  if (!quality) return '❓';
  
  if (quality.needsValidation) return '⚠️';
  if (quality.grade === 'poor' || quality.grade === 'needs_review') return '🚨';
  return '✓';
};

/**
 * 품질 경고 메시지
 */
const getQualityWarning = (langCode: string): string | null => {
  const quality = translationQualities.value[langCode];
  if (!quality) return null;

  // 유아 학습에 부적합한 품질인 경우
  if (!isQualitySuitableForChildren(quality)) {
    return getParentalGuidanceMessage(quality);
  }

  return null;
};

/**
 * 현재 검증 중인 번역 텍스트 가져오기
 */
const getCurrentTranslation = (): string => {
  if (!currentValidationLang.value || !processedData.value.translations[currentValidationLang.value]) {
    return '';
  }
  return processedData.value.translations[currentValidationLang.value].name;
};

/**
 * 모든 번역에 대해 품질 검증 수행
 */
const validateAllTranslations = async () => {
  const translations = processedData.value.translations;
  const promises = Object.keys(translations).map(langCode => 
    validateTranslation(langCode)
  );
  
  await Promise.allSettled(promises);
  console.log('🔍 모든 번역 품질 검증 완료');
};

const resetForm = () => {
  currentStep.value = 1;
  isProcessing.value = false;
  isSaving.value = false;
  isTesting.value = false;
  testingLanguage.value = '';
  
  // 품질 검증 상태 초기화
  translationQualities.value = {};
  translationAlternatives.value = {};
  showingAlternatives.value = {};
  validationModalOpen.value = false;
  currentValidationLang.value = '';
  
  formData.value = {
    primaryText: '',
    secondaryText: '',
    category: 'animals',
    minAge: 3,
    maxAge: 8
  };
  
  formDataWithLanguages.value = {
    primaryText: '',
    secondaryText: '',
    category: 'animals',
    minAge: 3,
    maxAge: 8,
    languages: { primary: 'ko', secondary: 'en' }
  };
  
  processor.resetStatus();
  
  processedData.value = {
    id: '',
    name: '',
    nameEn: '',
    imageUrl: '',
    audioKo: '',
    audioEn: '',
    category: 'animals',
    minAge: 3,
    maxAge: 8,
    ownerType: 'user',
    translations: {},
    primaryLanguage: 'ko',
    secondaryLanguage: 'en',
    autoTranslatedLanguages: []
  };
};

// Watchers
watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.word) {
      // Edit mode - convert existing word to multilingual format
      const multiLangWord = WordCompatibilityHelper.convertToMultiLang(props.word);
      
      processedData.value = {
        ...multiLangWord,
        ownerType: props.word.ownerType || 'user'
      };
      
      // Skip directly to customization for edit mode
      currentStep.value = 3;
    } else {
      // Add mode - start fresh
      resetForm();
    }
  }
});

watch(() => formData.value.minAge, (newMin) => {
  if (newMin > formData.value.maxAge) {
    formData.value.maxAge = newMin;
  }
});

watch(() => formData.value.maxAge, (newMax) => {
  if (newMax < formData.value.minAge) {
    formData.value.minAge = newMax;
  }
});

// 번역 처리 완료 후 품질 검증 실행
watch(() => processedData.value.translations, async (newTranslations) => {
  if (Object.keys(newTranslations).length > 0 && currentStep.value === 3) {
    // 500ms 지연 후 품질 검증 실행 (UI 업데이트 완료 대기)
    setTimeout(async () => {
      await validateAllTranslations();
    }, 500);
  }
}, { deep: true });
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

.multilang-modal {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 1000px;
  max-height: 95vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: var(--spacing-xl) var(--spacing-xl) 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
}

.step-header {
  flex: 1;
}

.step-header h2 {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.title-icon {
  font-size: 2rem;
}

.subtitle {
  color: var(--color-text-secondary);
  font-size: 1rem;
  margin: 0 0 var(--spacing-lg) 0;
  line-height: 1.5;
}

.step-indicator {
  width: 100%;
}

.steps {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-bottom: var(--spacing-lg);
}

.steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 40px;
  right: 40px;
  height: 2px;
  background: var(--color-border);
  z-index: 1;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 2;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-bg-secondary);
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  transition: all 0.3s ease;
}

.step-item.active .step-number {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.step-item.completed .step-number {
  background: var(--color-success);
  border-color: var(--color-success);
  color: white;
}

.step-title {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
  max-width: 120px;
}

.step-item.active .step-title {
  color: var(--color-primary);
  font-weight: 600;
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

.step-content {
  min-height: 400px;
}

.customization-section,
.confirmation-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.section-header {
  margin-bottom: var(--spacing-xl);
}

.section-header h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.section-description {
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: 0;
}

.customization-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.custom-group {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.custom-group h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.current-image {
  margin-top: var(--spacing-md);
}

.preview-image {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.translation-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

/* 개선된 번역 아이템 레이아웃 */
.translation-item-enhanced {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all 0.3s ease;
}

.translation-item-enhanced:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.translation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.translation-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.translation-actions {
  display: flex;
  gap: var(--spacing-xs);
}

/* 기존 번역 아이템 (하위 호환성) */
.translation-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

/* 품질 지표 */
.quality-indicator-mini {
  flex-shrink: 0;
}

/* 번역 입력 필드 품질 상태 */
.translation-input.needs-validation {
  border-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.05);
}

.translation-input.high-quality {
  border-color: var(--color-success);
  background: rgba(34, 197, 94, 0.05);
}

.translation-input.low-quality {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.05);
}

.translation-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  min-width: 100px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.flag {
  font-size: 1.25rem;
}

.language-name {
  font-size: 0.875rem;
}

.translation-input {
  flex: 1;
  padding: var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.translation-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.tts-test-button {
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

.tts-test-button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.tts-test-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tts-test-button.testing {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}

/* 품질 검증 버튼 */
.validation-button {
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
  font-size: 0.875rem;
}

.validation-button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  transform: translateY(-1px);
}

.validation-button.validation-needed {
  border-color: var(--color-warning);
  background: rgba(245, 158, 11, 0.1);
}

.validation-button.validation-urgent {
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.1);
  animation: pulse 2s infinite;
}

.validation-button.validation-optional {
  border-color: var(--color-info);
  background: rgba(59, 130, 246, 0.1);
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 대안 제안 버튼 */
.alternatives-button {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  height: 32px;
  padding: 0 var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.alternatives-button:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.alternatives-icon {
  font-size: 0.875rem;
}

.alternatives-count {
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-full);
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 600;
}

/* 품질 경고 메시지 */
.quality-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-sm);
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  margin-top: var(--spacing-sm);
}

.warning-icon {
  font-size: 0.875rem;
  flex-shrink: 0;
}

.warning-text {
  color: var(--color-warning-dark);
  line-height: 1.3;
}

/* 대안 번역 드롭다운 */
.alternatives-dropdown {
  position: relative;
  margin-top: var(--spacing-sm);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.alternatives-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  border-radius: var(--radius-md) var(--radius-md) 0 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-primary);
}

.close-alternatives {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-xs);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-alternatives:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.alternatives-list {
  padding: var(--spacing-sm);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.alternative-option {
  display: block;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
  font-size: 0.875rem;
  line-height: 1.4;
}

.alternative-option:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  transform: translateX(2px);
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

.confirmation-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.preview-group {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
}

.preview-group h4 {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-md) 0;
}

.image-preview {
  text-align: center;
}

.final-preview-image {
  width: 300px;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.translation-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.translation-text {
  flex: 1;
  font-weight: 500;
  color: var(--color-text-primary);
}

.tts-button {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tts-button.small {
  width: 24px;
  height: 24px;
  font-size: 0.75rem;
}

.tts-button:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.tts-button.testing {
  background: var(--color-primary-light);
}

.basic-info-summary {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.value {
  font-weight: 600;
  color: var(--color-text-primary);
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
  padding: var(--spacing-md) var(--spacing-lg);
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

.btn-success {
  background: var(--color-success);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: var(--color-success-dark);
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
  .multilang-modal {
    max-width: 95vw;
    margin: var(--spacing-md);
  }
  
  .modal-header {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .steps {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .steps::before {
    display: none;
  }
  
  .step-item {
    flex-direction: row;
    justify-content: flex-start;
    gap: var(--spacing-md);
  }
  
  .step-number {
    margin-bottom: 0;
  }
  
  .step-title {
    max-width: none;
    text-align: left;
  }
  
  .translation-grid {
    grid-template-columns: 1fr;
  }
  
  .translation-item {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>