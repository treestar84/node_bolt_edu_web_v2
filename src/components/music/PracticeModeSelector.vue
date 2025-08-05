<template>
  <div class="practice-mode-selector">
    <button 
      @click="handleModeChange('free')"
      class="mode-btn"
      :class="{ active: practiceMode === 'free' }"
    >
      🎵 자유연주
    </button>
    <button 
      @click="handleModeChange('rhythm')"
      class="mode-btn"
      :class="{ active: practiceMode === 'rhythm' }"
    >
      🎼 리듬연습
    </button>
  </div>
</template>

<script setup lang="ts">
type PracticeMode = 'free' | 'rhythm';

interface Props {
  practiceMode: PracticeMode;
}

defineProps<Props>();
const emit = defineEmits<{
  modeChange: [mode: PracticeMode];
}>();

const handleModeChange = (mode: PracticeMode) => {
  emit('modeChange', mode);
};
</script>

<style scoped>
.practice-mode-selector {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
}

.mode-btn {
  padding: 12px 24px;
  border: 2px solid #8B4513;
  background: linear-gradient(135deg, #F5DEB3, #DEB887);
  color: #8B4513;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
}

.mode-btn:hover {
  background: linear-gradient(135deg, #DEB887, #D2B48C);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 69, 19, 0.3);
}

.mode-btn.active {
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: white;
  box-shadow: 0 6px 16px rgba(139, 69, 19, 0.4);
}

@media (max-width: 768px) {
  .practice-mode-selector {
    flex-direction: column;
    align-items: center;
  }
  
  .mode-btn {
    width: 200px;
  }
}
</style>