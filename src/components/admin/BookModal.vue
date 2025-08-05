<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content step-modal" @click.stop>
      <div class="modal-header">
        <div class="modal-title-section">
          <h2>{{ isEditing ? $t('admin.editBook') : $t('admin.addNewBook') }}</h2>
          <div class="step-indicator">
            <div 
              v-for="(_, index) in steps" 
              :key="index" 
              class="step-dot"
              :class="{ 
                'active': currentStep === index + 1,
                'completed': currentStep > index + 1
              }"
            >
              <span v-if="currentStep > index + 1" class="step-check">✓</span>
              <span v-else>{{ index + 1 }}</span>
            </div>
          </div>
        </div>
        <button @click="$emit('close')" class="modal-close">×</button>
      </div>
      
      <form @submit.prevent="handleSubmit" class="modal-form">
        <!-- Step 1: Basic Information -->
        <BookFormStep1
          v-if="currentStep === 1"
          v-model="formData"
          :is-system-admin="isSystemAdmin"
        />

        <!-- Step 2: Content Mode -->
        <BookFormStep2
          v-if="currentStep === 2"
          v-model="formData"
        />

        <!-- Step 3: File Upload (simplified for now) -->
        <div v-if="currentStep === 3" class="step-content">
          <div class="step-header">
            <h3 class="step-title">📁 {{ $t('admin.steps.fileUpload') }}</h3>
            <p class="step-description">필요한 파일들을 업로드해주세요</p>
          </div>
          
          <div v-if="formData.isVideoMode" class="video-upload-section">
            <div class="form-group">
              <label class="form-label">{{ $t('forms.storyVideo') }}</label>
              <FileUploadInput
                v-model="fileData.videoUrl"
                :label="$t('forms.storyVideo')"
                file-type="video"
                :placeholder="$t('forms.storyVideoPlaceholder')"
                @uploaded="handleVideoUpload"
              />
            </div>
            
            <div v-if="fileData.generatedCover" class="generated-cover">
              <label class="form-label">{{ $t('forms.generatedCover') }}</label>
              <img :src="fileData.generatedCover" alt="Generated cover" class="cover-preview" />
            </div>
          </div>
          
          <div v-else class="traditional-upload-section">
            <div class="form-group">
              <label class="form-label">{{ $t('forms.coverImage') }}</label>
              <FileUploadInput
                v-model="fileData.coverImage"
                :label="$t('forms.coverImage')"
                file-type="image"
                :placeholder="$t('forms.coverImagePlaceholder')"
              />
            </div>
            
            <div class="pages-section">
              <div class="pages-header">
                <h4>{{ $t('forms.pages') }}</h4>
                <button type="button" @click="addPage" class="btn btn-sm btn-secondary">
                  {{ $t('forms.addPage') }}
                </button>
              </div>
              
              <div v-for="(page, index) in pageData" :key="index" class="page-item">
                <div class="page-header">
                  <span class="page-number">{{ $t('common.page') }} {{ index + 1 }}</span>
                  <button type="button" @click="removePage(index)" class="btn btn-sm btn-danger">
                    {{ $t('forms.removePage') }}
                  </button>
                </div>
                
                <div class="page-uploads">
                  <div class="form-group">
                    <label class="form-label">{{ $t('forms.pageImage') }}</label>
                    <FileUploadInput
                      v-model="page.imageUrl"
                      :label="$t('forms.pageImage')"
                      file-type="image"
                      :placeholder="$t('forms.pageImagePlaceholder')"
                    />
                  </div>
                  
                  <div class="form-group">
                    <label class="form-label">{{ $t('forms.pageAudio') }}</label>
                    <FileUploadInput
                      v-model="page.audioUrl"
                      :label="$t('forms.pageAudio')"
                      file-type="audio"
                      :placeholder="$t('forms.pageAudioPlaceholder')"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <div class="footer-left">
            <button 
              v-if="currentStep > 1" 
              type="button" 
              @click="prevStep" 
              class="btn btn-secondary"
            >
              {{ $t('common.prev') }}
            </button>
          </div>
          
          <div class="footer-right">
            <button type="button" @click="$emit('close')" class="btn btn-secondary">
              {{ $t('common.cancel') }}
            </button>
            
            <button 
              v-if="currentStep < steps.length" 
              type="button" 
              @click="nextStep" 
              class="btn btn-primary"
              :disabled="!canProceedToNextStep"
            >
              {{ $t('common.next') }}
            </button>
            
            <button 
              v-else 
              type="submit" 
              class="btn btn-primary"
              :disabled="isSaving"
            >
              {{ isSaving ? $t('common.processing') : $t('common.save') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import BookFormStep1 from './BookFormStep1.vue';
import BookFormStep2 from './BookFormStep2.vue';
import FileUploadInput from '@/components/FileUploadInput.vue';
import type { Book, BookModalFormData } from '@/types';

interface Props {
  show: boolean;
  book?: Book | null;
  isSystemAdmin: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  save: [bookData: any];
}>();

const currentStep = ref(1);
const isSaving = ref(false);

const steps = [
  { key: 'basicInfo', name: '기본정보' },
  { key: 'contentType', name: '콘텐츠 방식' },
  { key: 'fileUpload', name: '파일업로드' }
];

const isEditing = computed(() => !!props.book);

// Form data structure
const formData = ref<BookModalFormData>({
  title: '',
  minAge: 3,
  maxAge: 6,
  ownerType: 'user' as 'global' | 'user',
  isVideoMode: false
});

const fileData = ref({
  videoUrl: '',
  coverImage: '',
  generatedCover: ''
});

const pageData = ref([] as Array<{
  imageUrl: string;
  audioUrl: string;
  textContent: string;
}>);

// Initialize form data when book prop changes
watch(() => props.book, (book) => {
  if (book) {
    formData.value = {
      title: book.title,
      minAge: book.minAge || 3,
      maxAge: book.maxAge || 6,
      ownerType: book.ownerType || 'user',
      isVideoMode: book.isVideoMode || false
    };
    fileData.value = {
      videoUrl: book.videoUrl || '',
      coverImage: book.coverImage || '',
      generatedCover: ''
    };
    pageData.value = (book.pages || []).map(page => ({
      imageUrl: page.imageUrl || '',
      audioUrl: page.audioUrl || '',
      textContent: page.textContent || ''
    }));
  } else {
    // Reset form for new book
    resetForm();
  }
}, { immediate: true });

const resetForm = () => {
  formData.value = {
    title: '',
    minAge: 3,
    maxAge: 6,
    ownerType: props.isSystemAdmin ? 'global' : 'user',
    isVideoMode: false
  };
  fileData.value = {
    videoUrl: '',
    coverImage: '',
    generatedCover: ''
  };
  pageData.value = [];
  currentStep.value = 1;
};

const canProceedToNextStep = computed(() => {
  switch (currentStep.value) {
    case 1:
      return formData.value.title.trim() !== '' && 
             formData.value.minAge <= formData.value.maxAge;
    case 2:
      return true; // Content mode is always valid
    case 3:
      if (formData.value.isVideoMode) {
        return fileData.value.videoUrl !== '';
      } else {
        return fileData.value.coverImage !== '' && pageData.value.length > 0;
      }
    default:
      return true;
  }
});

const nextStep = () => {
  if (canProceedToNextStep.value && currentStep.value < steps.length) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const addPage = () => {
  pageData.value.push({
    imageUrl: '',
    audioUrl: '',
    textContent: ''
  });
};

const removePage = (index: number) => {
  pageData.value.splice(index, 1);
};

const handleVideoUpload = async (_url: string) => {
  // Generate cover from video first frame
  // This would call the auto cover generation logic
  try {
    // Placeholder for cover generation
    fileData.value.generatedCover = ''; // This would be set by the cover generation service
  } catch (error) {
    console.error('Cover generation failed:', error);
  }
};

const handleSubmit = async () => {
  if (!canProceedToNextStep.value) return;
  
  isSaving.value = true;
  
  try {
    const bookData = {
      ...formData.value,
      ...fileData.value,
      pages: pageData.value
    };
    
    emit('save', bookData);
  } catch (error) {
    console.error('Save failed:', error);
  } finally {
    isSaving.value = false;
  }
};

// Reset form when modal closes
watch(() => props.show, (show) => {
  if (!show) {
    currentStep.value = 1;
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

.modal-content {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
}

.modal-title-section {
  flex: 1;
}

.modal-title-section h2 {
  margin: 0 0 16px 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.step-indicator {
  display: flex;
  gap: 12px;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid var(--color-border);
  color: var(--color-text-muted);
  transition: all 0.3s ease;
}

.step-dot.active {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: white;
}

.step-dot.completed {
  border-color: var(--color-success);
  background: var(--color-success);
  color: white;
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
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.step-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
}

.footer-left,
.footer-right {
  display: flex;
  gap: 12px;
}

.btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.pages-section {
  margin-top: 24px;
}

.pages-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.pages-header h4 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.page-item {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  margin-bottom: 16px;
  background: var(--color-bg-secondary);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-number {
  font-weight: 600;
  color: var(--color-text-primary);
}

.page-uploads {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.cover-preview {
  max-width: 200px;
  max-height: 200px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

@media (max-width: 768px) {
  .modal-content {
    margin: 0;
    height: 100vh;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .page-uploads {
    grid-template-columns: 1fr;
  }
}
</style>