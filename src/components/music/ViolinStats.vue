<template>
  <div class="violin-stats">
    <div class="stat-item">
      <span class="stat-label">연주한 음</span>
      <span class="stat-value">{{ stats.totalNotes }}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">연습 시간</span>
      <span class="stat-value">{{ stats.playDuration }}초</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">현재 곡</span>
      <span class="stat-value">{{ currentSongName || '자유연주' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ViolinStats {
  totalNotes: number;
  playDuration: number;
}

interface Props {
  stats: ViolinStats;
  currentSongName?: string;
}

defineProps<Props>();
</script>

<style scoped>
.violin-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  background: linear-gradient(135deg, #8B4513, #A0522D, #CD853F);
  border-radius: 16px;
  padding: 20px;
  color: white;
  box-shadow: 0 8px 25px rgba(139, 69, 19, 0.4);
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

@media (max-width: 768px) {
  .violin-stats {
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
    font-size: 1.25rem;
  }
}
</style>