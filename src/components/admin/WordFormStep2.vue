<template>
  <div class="step-content">
    <div class="step-description">
      <h3>파일 업로드</h3>
      <p>단어 학습에 사용할 이미지와 음성 파일을 업로드하세요</p>
    </div>

    <div class="upload-section">
      <div class="upload-group">
        <label class="upload-label">
          이미지 파일 (필수)
          <span class="file-info">JPG, PNG, GIF (최대 10MB)</span>
        </label>
        
        <div class="upload-area">
          <FileUploadInput
            v-model="localFormData.imageUrl"
            label="이미지 파일"
            file-type="image"
            placeholder="이미지를 업로드하세요"
            :uploading="uploading"
            @upload-success="handleImageUpload"
            @upload-start="$emit('uploadStart')"
            @upload-end="$emit('uploadEnd')"
          >
            <div class="upload-content">
              <div v-if="!localFormData.imageUrl" class="upload-placeholder">
                <div class="upload-icon">📸</div>
                <div class="upload-text">
                  <p>이미지를 드래그하거나 클릭하여 업로드</p>
                  <p class="upload-hint">clear하고 아이들이 이해하기 쉬운 이미지를 선택하세요</p>
                </div>
              </div>
              
              <div v-else class="image-preview">
                <img :src="getImageUrl(localFormData.imageUrl || '')" alt="Preview" />
                <div class="image-overlay">
                  <button type="button" class="change-btn">이미지 변경</button>
                </div>
              </div>
            </div>
          </FileUploadInput>
        </div>
      </div>

      <div class="upload-group">
        <label class="upload-label">
          음성 파일 (선택사항)
          <span class="file-info">MP3, WAV (최대 5MB)</span>
        </label>
        
        <div class="upload-area">
          <FileUploadInput
            v-model="localFormData.audioUrl"
            label="음성 파일"
            file-type="audio"
            placeholder="음성 파일을 업로드하세요"
            :uploading="uploading"
            @upload-success="handleAudioUpload"
            @upload-start="$emit('uploadStart')"
            @upload-end="$emit('uploadEnd')"
          >
            <div class="upload-content">
              <div v-if="!localFormData.audioUrl" class="upload-placeholder">
                <div class="upload-icon">🎵</div>
                <div class="upload-text">
                  <p>음성 파일을 드래그하거나 클릭하여 업로드</p>
                  <p class="upload-hint">단어 발음을 녹음한 파일을 업로드하세요</p>
                </div>
              </div>
              
              <div v-else class="audio-preview">
                <div class="audio-info">
                  <div class="audio-icon">🎵</div>
                  <div class="audio-details">
                    <p>음성 파일이 업로드되었습니다</p>
                    <audio controls>
                      <source :src="getAudioUrl(localFormData.audioUrl)" type="audio/mpeg">
                    </audio>
                  </div>
                </div>
                <div class="audio-overlay">
                  <button type="button" class="change-btn">음성 변경</button>
                </div>
              </div>
            </div>
          </FileUploadInput>
        </div>
      </div>
    </div>

    <div class="upload-validation">
      <div class="validation-checklist">
        <div class="validation-item" :class="{ valid: localFormData.imageUrl }">
          <span class="validation-icon">{{ localFormData.imageUrl ? '✅' : '❌' }}</span>
          이미지 파일 업로드 (필수)
        </div>
        <div class="validation-item optional" :class="{ valid: localFormData.audioUrl }">
          <span class="validation-icon">{{ localFormData.audioUrl ? '✅' : '🔘' }}</span>
          음성 파일 업로드 (선택사항)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import FileUploadInput from '@/components/FileUploadInput.vue';
import type { WordModalFormData } from '@/types';

interface Props {
  formData: WordModalFormData;
  uploading: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:formData': [data: Partial<WordModalFormData>];
  'uploadStart': [];
  'uploadEnd': [];
}>();

const localFormData = ref({ ...props.formData });

const handleImageUpload = (filePath: string) => {
  localFormData.value.imageUrl = filePath;
  emit('update:formData', { imageUrl: filePath });
};

const handleAudioUpload = (filePath: string) => {
  localFormData.value.audioUrl = filePath;
  emit('update:formData', { audioUrl: filePath });
};

const getImageUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `/server${path}`;
};

const getAudioUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `/server${path}`;
};

watch(() => props.formData, (newData) => {
  localFormData.value = { ...newData };
}, { deep: true });
</script>

<style scoped>
.step-content {
  padding: 20px 0;
}

.step-description {
  margin-bottom: 32px;
  text-align: center;
}

.step-description h3 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.step-description p {
  color: var(--color-text-secondary);
  margin: 0;
}

.upload-section {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.upload-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.file-info {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 400;
}

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-hover);
}

.upload-content {
  position: relative;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 32px;
  text-align: center;
}

.upload-icon {
  font-size: 3rem;
  opacity: 0.7;
}

.upload-text p {
  margin: 0;
  color: var(--color-text-primary);
}

.upload-hint {
  font-size: 0.9rem;
  color: var(--color-text-secondary) !important;
}

.image-preview {
  position: relative;
  width: 100%;
  max-width: 300px;
  margin: 16px auto;
}

.image-preview img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.image-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  border-radius: var(--radius-md);
}

.image-preview:hover .image-overlay {
  opacity: 1;
}

.audio-preview {
  position: relative;
  width: 100%;
  padding: 24px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  margin: 16px 0;
}

.audio-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.audio-icon {
  font-size: 2rem;
}

.audio-details p {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-weight: 500;
}

.audio-details audio {
  width: 100%;
  max-width: 300px;
}

.audio-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  border-radius: var(--radius-md);
}

.audio-preview:hover .audio-overlay {
  opacity: 1;
}

.change-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.change-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.upload-validation {
  margin-top: 24px;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.validation-checklist {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  transition: all 0.2s ease;
}

.validation-item.valid {
  color: var(--color-success);
}

.validation-item.optional {
  opacity: 0.7;
}

.validation-item.optional.valid {
  opacity: 1;
}

.validation-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .upload-placeholder {
    padding: 24px 16px;
  }
  
  .upload-icon {
    font-size: 2rem;
  }
  
  .image-preview img {
    height: 150px;
  }
  
  .audio-info {
    flex-direction: column;
    text-align: center;
  }
}
</style>