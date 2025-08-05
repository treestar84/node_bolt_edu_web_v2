<template>
  <div class="step-content">
    <div class="step-header">
      <h3 class="step-title">🎭 {{ $t('forms.contentMode') }}</h3>
      <p class="step-description">어떤 방식으로 책을 만들지 선택해주세요</p>
    </div>
    
    <div class="content-modes">
      <label class="mode-option" :class="{ selected: modelValue.isVideoMode }">
        <input 
          type="radio" 
          :checked="modelValue.isVideoMode"
          @change="updateValue('isVideoMode', true)"
          name="contentMode"
        />
        <div class="mode-card">
          <div class="mode-icon">🎬</div>
          <div class="mode-info">
            <h4 class="mode-title">{{ $t('forms.videoMode') }}</h4>
            <p class="mode-description">{{ $t('forms.videoModeDesc') }}</p>
            <div class="mode-features">
              <span class="feature-tag">동영상 스토리</span>
              <span class="feature-tag">자동 커버 생성</span>
            </div>
          </div>
        </div>
      </label>

      <label class="mode-option" :class="{ selected: !modelValue.isVideoMode }">
        <input 
          type="radio"
          :checked="!modelValue.isVideoMode"
          @change="updateValue('isVideoMode', false)"
          name="contentMode"
        />
        <div class="mode-card">
          <div class="mode-icon">📚</div>
          <div class="mode-info">
            <h4 class="mode-title">{{ $t('forms.traditionalMode') }}</h4>
            <p class="mode-description">{{ $t('forms.traditionalModeDesc') }}</p>
            <div class="mode-features">
              <span class="feature-tag">페이지별 이미지</span>
              <span class="feature-tag">음성 지원</span>
            </div>
          </div>
        </div>
      </label>
    </div>

    <div class="mode-preview">
      <div v-if="modelValue.isVideoMode" class="preview-section">
        <h5 class="preview-title">🎬 비디오 모드 미리보기</h5>
        <div class="preview-content">
          <div class="preview-item">
            <span class="preview-icon">📹</span>
            <span>스토리 영상 업로드</span>
          </div>
          <div class="preview-item">
            <span class="preview-icon">🖼️</span>
            <span>첫 프레임에서 자동 커버 생성</span>
          </div>
          <div class="preview-item">
            <span class="preview-icon">🎯</span>
            <span>간편한 영상 책 제작</span>
          </div>
        </div>
      </div>

      <div v-else class="preview-section">
        <h5 class="preview-title">📚 전통 모드 미리보기</h5>
        <div class="preview-content">
          <div class="preview-item">
            <span class="preview-icon">📄</span>
            <span>페이지별 이미지와 텍스트</span>
          </div>
          <div class="preview-item">
            <span class="preview-icon">🔊</span>
            <span>각 페이지마다 음성 추가</span>
          </div>
          <div class="preview-item">
            <span class="preview-icon">📖</span>
            <span>상세한 스토리텔링</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BookModalFormData } from '@/types';

interface Props {
  modelValue: BookModalFormData;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: BookModalFormData];
}>();

const updateValue = (field: keyof BookModalFormData, value: any) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  });
};
</script>

<style scoped>
.step-content {
  padding: 24px;
}

.step-header {
  text-align: center;
  margin-bottom: 32px;
}

.step-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.step-description {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.content-modes {
  display: grid;
  gap: 20px;
  margin-bottom: 32px;
}

.mode-option {
  cursor: pointer;
}

.mode-option input[type="radio"] {
  display: none;
}

.mode-card {
  display: flex;
  gap: 20px;
  padding: 24px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-xl);
  background: var(--color-bg-secondary);
  transition: all 0.3s ease;
  position: relative;
}

.mode-option:hover .mode-card {
  border-color: var(--color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.mode-option.selected .mode-card {
  border-color: var(--color-primary);
  background: var(--color-primary-light);
  box-shadow: var(--shadow-lg);
}

.mode-option.selected .mode-card::after {
  content: '✓';
  position: absolute;
  top: 16px;
  right: 16px;
  width: 24px;
  height: 24px;
  background: var(--color-primary);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 700;
}

.mode-icon {
  font-size: 3rem;
  line-height: 1;
  flex-shrink: 0;
}

.mode-info {
  flex: 1;
}

.mode-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.mode-description {
  color: var(--color-text-secondary);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.mode-features {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.feature-tag {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.mode-option.selected .feature-tag {
  background: var(--color-primary);
  color: white;
}

.mode-preview {
  background: var(--color-bg-tertiary);
  border-radius: var(--radius-lg);
  padding: 24px;
}

.preview-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.preview-icon {
  font-size: 1.25rem;
  width: 24px;
  text-align: center;
}

@media (max-width: 768px) {
  .mode-card {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
  
  .mode-icon {
    font-size: 2.5rem;
  }
}
</style>