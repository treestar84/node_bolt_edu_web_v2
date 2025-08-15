<template>
  <div class="drum-set-view">
    <div class="header">
      <h1>{{ t('drumSet.title') }}</h1>
      <p>{{ t('drumSet.description') }}</p>
      
      <div class="instruction-panel">
        <h3>{{ t('drumSet.keyboardControls') }}</h3>
        <div class="controls-grid">
          <div class="control-item">{{ t('drumSet.spaceBar') }}</div>
          <div class="control-item">{{ t('drumSet.keyA') }}</div>
          <div class="control-item">{{ t('drumSet.keyS') }}</div>
          <div class="control-item">{{ t('drumSet.keyD') }}</div>
          <div class="control-item">{{ t('drumSet.keyF') }}</div>
          <div class="control-item">{{ t('drumSet.keyG') }}</div>
          <div class="control-item">{{ t('drumSet.keyH') }}</div>
          <div class="control-item">{{ t('drumSet.keyJ') }}</div>
          <div class="control-item">{{ t('drumSet.keyK') }}</div>
        </div>
      </div>
    </div>

    <DrumSetUI />

    <div class="tips">
      <p>{{ t('drumSet.clickToPlay') }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import DrumSetUI from '@/components/DrumSetUI.vue'

const { t } = useI18n();
</script>

<style scoped>
.drum-set-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 50%, #2d2d2d 100%);
  padding: 2rem;
  color: white;
  overflow-x: auto;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, #ff7700, #ffaa44);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
}

.header p {
  font-size: 1.2rem;
  opacity: 0.8;
  margin-bottom: 2rem;
}

.instruction-panel {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem auto;
  max-width: 800px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.instruction-panel h3 {
  text-align: center;
  margin-bottom: 1rem;
  color: #ff7700;
  font-size: 1.3rem;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.8rem;
}

.control-item {
  background: rgba(255, 119, 0, 0.1);
  border: 1px solid #ff7700;
  border-radius: 6px;
  padding: 0.7rem;
  text-align: center;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.control-item:hover {
  background: rgba(255, 119, 0, 0.2);
  transform: translateY(-2px);
}

.tips {
  text-align: center;
  margin-top: 2rem;
  opacity: 0.7;
  font-size: 1.1rem;
}

.tips p {
  background: rgba(0, 0, 0, 0.4);
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #ff7700;
  display: inline-block;
}

/* Responsive design */
@media (max-width: 768px) {
  .drum-set-view {
    padding: 1rem;
  }

  .header h1 {
    font-size: 2rem;
  }

  .controls-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 0.5rem;
  }

  .control-item {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  .instruction-panel {
    padding: 1rem;
    margin: 1rem auto;
  }
}
</style>