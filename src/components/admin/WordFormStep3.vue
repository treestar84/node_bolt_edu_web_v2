<template>
  <div class="step-content">
    <div class="step-description">
      <h3>추가 설정</h3>
      <p>카테고리 선택 및 소유권 설정을 완료해주세요</p>
    </div>

    <div class="form-group">
      <label class="form-label">
        카테고리
        <button 
          type="button" 
          class="info-tooltip" 
          @click="handleShowTooltip('category')"
          @blur="handleHideTooltip"
        >
          ℹ️
        </button>
        <div v-if="activeTooltip === 'category'" class="tooltip">
          단어가 속할 분류를 선택하세요
        </div>
      </label>
      <select 
        v-model="localFormData.category" 
        class="form-select" 
        required
        @change="updateData"
      >
        <option value="">카테고리 선택</option>
        <option v-for="category in categories" :key="category.key" :value="category.key">
          {{ category.name }}
        </option>
      </select>
    </div>

    <!-- 시스템 관리자만 소유권 선택 가능 -->
    <div v-if="isSystemAdmin" class="form-group">
      <label class="form-label">
        소유권 설정
        <button 
          type="button" 
          class="info-tooltip" 
          @click="handleShowTooltip('ownership')"
          @blur="handleHideTooltip"
        >
          ℹ️
        </button>
        <div v-if="activeTooltip === 'ownership'" class="tooltip">
          공용: 모든 사용자가 볼 수 있음<br>
          개인: 본인만 볼 수 있음
        </div>
      </label>
      <div class="ownership-options">
        <label class="radio-option">
          <input 
            type="radio" 
            v-model="localFormData.ownerType" 
            value="admin"
            name="ownerType"
            @change="updateData"
          />
          <div class="radio-content">
            <div class="radio-icon">🌍</div>
            <div class="radio-text">
              <strong>공용</strong>
              <span>모든 사용자에게 표시</span>
            </div>
          </div>
        </label>
        <label class="radio-option">
          <input 
            type="radio" 
            v-model="localFormData.ownerType" 
            value="teacher"
            name="ownerType"
            @change="updateData"
          />
          <div class="radio-content">
            <div class="radio-icon">👤</div>
            <div class="radio-text">
              <strong>개인</strong>
              <span>나만 볼 수 있음</span>
            </div>
          </div>
        </label>
      </div>
    </div>

    <div v-else class="form-group">
      <div class="ownership-info">
        <div class="info-icon">👤</div>
        <div class="info-text">
          <strong>개인 단어</strong>
          <span>이 단어는 본인만 볼 수 있습니다</span>
        </div>
      </div>
    </div>

    <!-- 요약 정보 -->
    <div class="summary-card">
      <h4>입력 정보 요약</h4>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="label">한국어:</span>
          <span class="value">{{ localFormData.name || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">영어:</span>
          <span class="value">{{ localFormData.nameEn || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">카테고리:</span>
          <span class="value">{{ getCategoryName(localFormData.category) || '-' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">나이:</span>
          <span class="value">{{ localFormData.ageGroup }}세</span>
        </div>
        <div class="summary-item">
          <span class="label">이미지:</span>
          <span class="value">{{ localFormData.imageUrl ? '업로드됨' : '없음' }}</span>
        </div>
        <div class="summary-item">
          <span class="label">음성:</span>
          <span class="value">{{ localFormData.audioUrl ? '업로드됨' : 'TTS 사용' }}</span>
        </div>
        <div v-if="isSystemAdmin" class="summary-item">
          <span class="label">소유권:</span>
          <span class="value">{{ localFormData.ownerType === 'admin' ? '공용' : '개인' }}</span>
        </div>
      </div>
    </div>

    <div class="form-validation">
      <div class="validation-checklist">
        <div class="validation-item" :class="{ valid: localFormData.category }">
          <span class="validation-icon">{{ localFormData.category ? '✅' : '❌' }}</span>
          카테고리 선택
        </div>
        <div class="validation-item" :class="{ valid: true }">
          <span class="validation-icon">✅</span>
          모든 필수 정보 입력 완료
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import type { WordModalFormData } from '@/types';

interface Props {
  formData: WordModalFormData;
  isSystemAdmin: boolean;
  activeTooltip?: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:formData': [data: Partial<WordModalFormData>];
  'showTooltip': [id: string];
  'hideTooltip': [];
}>();

const { t, messages } = useI18n();
const localFormData = ref({ ...props.formData });

// 카테고리 목록 (원본 코드에서 가져온 로직)
const categories = computed(() => {
  const categoryKeys = Object.keys(messages.value['ko'].categories).filter(key => key !== 'all');
  return categoryKeys.map(key => ({
    key,
    name: t('categories.' + key)
  }));
});

const getCategoryName = (category: string) => {
  if (!category) return '';
  return t('categories.' + category);
};

const updateData = () => {
  emit('update:formData', {
    category: localFormData.value.category,
    ownerType: localFormData.value.ownerType
  });
};

const handleShowTooltip = (id: string) => {
  emit('showTooltip', id);
};

const handleHideTooltip = () => {
  emit('hideTooltip');
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

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  position: relative;
  margin-bottom: 8px;
}

.info-tooltip {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.info-tooltip:hover {
  background: var(--color-bg-secondary);
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 0;
  background: var(--color-text-primary);
  color: var(--color-bg-primary);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  white-space: nowrap;
  z-index: 10;
  box-shadow: var(--shadow-md);
}

.form-select {
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s ease;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  width: 100%;
}

.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.ownership-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
}

.radio-option:hover {
  background: var(--color-bg-hover);
}

.radio-option input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.radio-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.radio-icon {
  font-size: 1.2rem;
}

.radio-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-text strong {
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.radio-text span {
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.ownership-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.info-icon {
  font-size: 1.5rem;
}

.info-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-text strong {
  color: var(--color-text-primary);
  font-size: 1rem;
}

.info-text span {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.summary-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin: 24px 0;
}

.summary-card h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  text-align: center;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border);
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-item .label {
  font-weight: 500;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.summary-item .value {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.form-validation {
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

.validation-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  
  .tooltip {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    white-space: normal;
    max-width: 250px;
  }
  
  .ownership-options {
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
  }
  
  .radio-option {
    padding: var(--spacing-sm);
  }
}
</style>