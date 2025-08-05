<template>
  <div class="drum-stats">
    <div class="stat-item">
      <span class="stat-label">{{ $t('music.drums.hits') }}</span>
      <span class="stat-value">{{ stats.totalNotes }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">{{ $t('music.drums.uniqueSounds') }}</span>
      <span class="stat-value">{{ stats.uniqueNotes }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">{{ $t('music.drums.playTime') }}</span>
      <span class="stat-value">{{ stats.playDuration }}{{ $t('common.seconds') }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">

interface DrumStats {
  totalNotes: number;
  uniqueNotes: number;
  playDuration: number;
}

interface Props {
  stats: DrumStats;
}

defineProps<Props>();
</script>

<style scoped>
.drum-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px;
  margin-bottom: 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

@media (max-width: 768px) {
  .drum-stats {
    flex-direction: column;
    gap: 16px;
    padding: 16px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    padding: 12px 16px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .drum-stats {
    gap: 12px;
    padding: 12px;
  }
  
  .stat-item {
    padding: 10px 14px;
  }
  
  .stat-label {
    font-size: 0.75rem;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
}
</style>