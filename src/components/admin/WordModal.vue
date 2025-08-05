<template>
  <div v-if="show" class="modal-overlay" @click="handleClose">
    <div class="modal-content step-modal" @click.stop>
      <div class="modal-header">
        <div class="step-header">
          <h2>{{ word ? '단어 수정' : '새 단어 추가' }}</h2>
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
      
      <form @submit.prevent="handleStepSubmit" class="modal-form">
        <!-- Step 1: 기본 정보 -->
        <WordFormStep1
          v-if="currentStep === 1"
          :form-data="formData"
          :active-tooltip="activeTooltip"
          @update:form-data="updateFormData"
          @show-tooltip="showTooltip"
          @hide-tooltip="hideTooltip"
        />

        <!-- Step 2: 파일 업로드 -->
        <WordFormStep2
          v-if="currentStep === 2"
          :form-data="formData"
          :uploading="uploading"
          @update:form-data="updateFormData"
          @upload-start="uploading = true"
          @upload-end="uploading = false"
        />

        <!-- Step 3: 추가 설정 -->
        <WordFormStep3
          v-if="currentStep === 3"
          :form-data="formData"
          :is-system-admin="isSystemAdmin"
          :active-tooltip="activeTooltip"
          @update:form-data="updateFormData"
          @show-tooltip="showTooltip"
          @hide-tooltip="hideTooltip"
        />

        <div class="modal-footer">
          <button 
            v-if="currentStep > 1" 
            type="button" 
            @click="previousStep" 
            class="btn btn-secondary"
          >
            이전
          </button>
          
          <button 
            v-if="currentStep < steps.length" 
            type="submit" 
            class="btn btn-primary"
            :disabled="!canProceed"
          >
            다음
          </button>
          
          <button 
            v-if="currentStep === steps.length" 
            type="button" 
            @click="handleSave" 
            class="btn btn-success"
            :disabled="isSaving || !isFormValid"
          >
            {{ isSaving ? '저장 중...' : '저장' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import WordFormStep1 from './WordFormStep1.vue';
import WordFormStep2 from './WordFormStep2.vue';
import WordFormStep3 from './WordFormStep3.vue';
import type { WordTableItem, WordModalFormData } from '@/types';

interface Props {
  show: boolean;
  word?: WordTableItem | null;
  isSystemAdmin: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [wordData: WordModalFormData];
}>();

const currentStep = ref(1);
const uploading = ref(false);
const isSaving = ref(false);
const activeTooltip = ref<string | null>(null);

const steps = [
  { title: '기본 정보', description: '단어 정보 입력' },
  { title: '파일 업로드', description: '이미지/음성 업로드' },
  { title: '추가 설정', description: '카테고리 및 설정' }
];

const formData = ref<WordModalFormData>({
  name: '',
  nameEn: '',
  imageUrl: '',
  audioUrl: '',
  category: '동물',
  ageGroup: 3,
  ownerType: 'teacher'
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.name.trim() && formData.value.nameEn.trim();
    case 2:
      return formData.value.imageUrl.trim();
    case 3:
      return formData.value.category.trim();
    default:
      return false;
  }
});

const isFormValid = computed(() => {
  return formData.value.name.trim() && 
         formData.value.nameEn.trim() && 
         formData.value.imageUrl.trim() && 
         formData.value.category.trim();
});

const updateFormData = (updates: Partial<WordModalFormData>) => {
  formData.value = { ...formData.value, ...updates };
};

const showTooltip = (id: string) => {
  activeTooltip.value = id;
};

const hideTooltip = () => {
  activeTooltip.value = null;
};

const handleStepSubmit = () => {
  if (canProceed.value && currentStep.value < steps.length) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const handleSave = async () => {
  if (!isFormValid.value || isSaving.value) return;
  
  isSaving.value = true;
  try {
    emit('save', formData.value);
  } finally {
    isSaving.value = false;
  }
};

const handleClose = () => {
  emit('close');
};

const resetForm = () => {
  currentStep.value = 1;
  formData.value = {
    name: '',
    nameEn: '',
    imageUrl: '',
    audioUrl: '',
    category: '동물',
    ageGroup: 3,
    ownerType: 'teacher'
  };
  activeTooltip.value = null;
  uploading.value = false;
  isSaving.value = false;
};

watch(() => props.show, (newShow) => {
  if (newShow) {
    if (props.word) {
      // Edit mode - populate form
      formData.value = {
        name: props.word.name,
        nameEn: props.word.nameEn,
        imageUrl: props.word.imageUrl,
        audioUrl: props.word.audioUrl || '',
        category: props.word.category,
        ageGroup: props.word.ageGroup,
        ownerType: props.word.ownerType || 'teacher'
      };
    } else {
      // Add mode - reset form
      resetForm();
    }
  }
});

watch(() => props.word, (newWord) => {
  if (newWord && props.show) {
    formData.value = {
      name: newWord.name,
      nameEn: newWord.nameEn,
      imageUrl: newWord.imageUrl,
      audioUrl: newWord.audioUrl || '',
      category: newWord.category,
      ageGroup: newWord.ageGroup,
      ownerType: newWord.ownerType || 'teacher'
    };
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
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.step-modal {
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
  align-items: flex-start;
  padding: 24px 24px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
}

.step-header {
  flex: 1;
}

.step-header h2 {
  margin: 0 0 20px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.step-indicator {
  width: 100%;
}

.steps {
  display: flex;
  justify-content: space-between;
  position: relative;
  margin-bottom: 20px;
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
  margin-bottom: 8px;
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
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-align: center;
}

.step-item.active .step-title {
  color: var(--color-primary);
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 8px;
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

.modal-form {
  padding: 24px;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
  justify-content: flex-end;
  border-top: 1px solid var(--color-border);
  margin-top: 24px;
  padding-top: 24px;
}

.btn {
  padding: 12px 24px;
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

@media (max-width: 768px) {
  .step-modal {
    max-width: 95vw;
    margin: 10px;
  }
  
  .modal-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .steps {
    flex-direction: column;
    gap: 16px;
  }
  
  .steps::before {
    display: none;
  }
  
  .step-item {
    flex-direction: row;
    justify-content: flex-start;
    gap: 12px;
  }
  
  .step-number {
    margin-bottom: 0;
  }
  
  .modal-footer {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>