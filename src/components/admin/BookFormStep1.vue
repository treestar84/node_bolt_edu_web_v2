<template>
  <div class="step-content">
    <div class="step-header">
      <h3 class="step-title">📚 기본 정보</h3>
      <p class="step-description">책의 기본 정보를 입력해주세요</p>
    </div>
    
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">{{ t('forms.title') }}</label>
        <input 
          :value="modelValue.title"
          @input="updateValue('title', ($event.target as HTMLInputElement).value)"
          type="text" 
          class="form-input" 
          :placeholder="t('forms.titlePlaceholder')"
          required 
        />
      </div>

      <div class="form-group">
        <label class="form-label">
          {{ t('forms.appropriateAge') }}
          <button 
            type="button"
            class="tooltip-trigger"
            @mouseenter="showTooltip = 'age'"
            @mouseleave="showTooltip = null"
          >
            ℹ️
            <div v-if="showTooltip === 'age'" class="tooltip">
              {{ t('forms.tooltips.age') }}
            </div>
          </button>
        </label>
        <div class="age-inputs">
          <select 
            :value="modelValue.minAge"
            @change="updateValue('minAge', Number(($event.target as HTMLSelectElement).value))"
            class="form-input" 
            required
          >
            <option value="3">{{ t('settings.age3') }}</option>
            <option value="4">{{ t('settings.age4') }}</option>
            <option value="5">{{ t('settings.age5') }}</option>
            <option value="6">{{ t('settings.age6') }}</option>
          </select>
          <span class="age-separator">~</span>
          <select 
            :value="modelValue.maxAge"
            @change="updateValue('maxAge', Number(($event.target as HTMLSelectElement).value))"
            class="form-input" 
            required
          >
            <option value="3">{{ t('settings.age3') }}</option>
            <option value="4">{{ t('settings.age4') }}</option>
            <option value="5">{{ t('settings.age5') }}</option>
            <option value="6">{{ t('settings.age6') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 시스템 관리자만 소유권 선택 가능 -->
    <div v-if="isSystemAdmin" class="form-group">
      <label class="form-label">
        {{ t('admin.ownership.global') }}/{{ t('admin.ownership.user') }} 설정
        <button 
          type="button"
          class="tooltip-trigger"
          @mouseenter="showTooltip = 'ownership'"
          @mouseleave="showTooltip = null"
        >
          ℹ️
          <div v-if="showTooltip === 'ownership'" class="tooltip" v-html="t('forms.tooltips.ownership')">
          </div>
        </button>
      </label>
      <div class="ownership-options">
        <label class="radio-option">
          <input 
            type="radio" 
            :checked="modelValue.ownerType === 'global'"
            @change="updateValue('ownerType', 'global')"
            value="global"
          />
          <span class="radio-text">
            <strong>{{ t('admin.ownership.global') }}</strong>
            <small>{{ t('admin.ownership.globalDesc') }}</small>
          </span>
        </label>
        <label class="radio-option">
          <input 
            type="radio" 
            :checked="modelValue.ownerType === 'user'"
            @change="updateValue('ownerType', 'user')"
            value="user"
          />
          <span class="radio-text">
            <strong>{{ t('admin.ownership.user') }}</strong>
            <small>{{ t('admin.ownership.userDesc') }}</small>
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { BookModalFormData } from '@/types';

interface Props {
  modelValue: BookModalFormData;
  isSystemAdmin: boolean;
}

const { t } = useI18n();
const props = defineProps<Props>();
const emit = defineEmits<{
  'update:modelValue': [value: BookModalFormData];
}>();

const showTooltip = ref<string | null>(null);

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

.form-grid {
  display: grid;
  gap: 24px;
  margin-bottom: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 600;
  color: var(--color-text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.tooltip-trigger {
  background: none;
  border: none;
  cursor: help;
  position: relative;
  padding: 2px;
  border-radius: 50%;
  font-size: 0.875rem;
}

.tooltip {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%) translateY(-100%);
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 12px;
  font-size: 0.875rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  max-width: 300px;
  white-space: normal;
}

.form-input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.age-inputs {
  display: flex;
  align-items: center;
  gap: 12px;
}

.age-inputs .form-input {
  flex: 1;
}

.age-separator {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.ownership-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-option:hover {
  border-color: var(--color-primary);
  background: var(--color-bg-secondary);
}

.radio-option input[type="radio"] {
  margin-top: 2px;
}

.radio-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.radio-text strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

.radio-text small {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}
</style>