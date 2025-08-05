<template>
  <div class="step-content">
    <div class="step-description">
      <h3>기본 정보</h3>
      <p>단어의 기본 정보를 입력해주세요</p>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">
          한국어 이름
          <button 
            type="button" 
            class="info-tooltip" 
            @click="handleShowTooltip('korean-name')"
            @blur="handleHideTooltip"
          >
            ℹ️
          </button>
          <div v-if="activeTooltip === 'korean-name'" class="tooltip">
            아이들이 학습할 한국어 단어를 입력하세요
          </div>
        </label>
        <input
          type="text"
          v-model="localFormData.name"
          class="form-input"
          placeholder="예: 고양이"
          required
          @input="updateData"
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          영어 이름
          <button 
            type="button" 
            class="info-tooltip" 
            @click="handleShowTooltip('english-name')"
            @blur="handleHideTooltip"
          >
            ℹ️
          </button>
          <div v-if="activeTooltip === 'english-name'" class="tooltip">
            영어 학습을 위한 영어 단어를 입력하세요
          </div>
        </label>
        <input
          type="text"
          v-model="localFormData.nameEn"
          class="form-input"
          placeholder="예: Cat"
          required
          @input="updateData"
        />
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">
        연령대
        <button 
          type="button" 
          class="info-tooltip" 
          @click="handleShowTooltip('age-group')"
          @blur="handleHideTooltip"
        >
          ℹ️
        </button>
        <div v-if="activeTooltip === 'age-group'" class="tooltip">
          이 단어가 적합한 연령대를 선택하세요
        </div>
      </label>
      <select 
        v-model="localFormData.ageGroup" 
        class="form-select"
        @change="updateData"
      >
        <option value="3">3세</option>
        <option value="4">4세</option>
        <option value="5">5세</option>
        <option value="6">6세</option>
        <option value="7">7세</option>
      </select>
    </div>

    <div class="form-validation">
      <div class="validation-checklist">
        <div class="validation-item" :class="{ valid: localFormData.name.trim() }">
          <span class="validation-icon">{{ localFormData.name.trim() ? '✅' : '❌' }}</span>
          한국어 이름 입력
        </div>
        <div class="validation-item" :class="{ valid: localFormData.nameEn.trim() }">
          <span class="validation-icon">{{ localFormData.nameEn.trim() ? '✅' : '❌' }}</span>
          영어 이름 입력
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { WordModalFormData } from '@/types';

interface Props {
  formData: WordModalFormData;
  activeTooltip: string | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:formData': [data: Partial<WordModalFormData>];
  'showTooltip': [id: string];
  'hideTooltip': [];
}>();

const localFormData = ref({ ...props.formData });

const updateData = () => {
  emit('update:formData', {
    name: localFormData.value.name,
    nameEn: localFormData.value.nameEn,
    ageGroup: localFormData.value.ageGroup
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

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  position: relative;
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

.form-input,
.form-select {
  padding: 12px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  transition: all 0.2s ease;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .tooltip {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    white-space: normal;
    max-width: 250px;
  }
}
</style>