<template>
  <div v-if="show" class="rhythm-songs">
    <h4>🎶 연습할 곡을 선택하세요</h4>
    <div class="song-buttons">
      <button
        v-for="song in rhythmSongs"
        :key="song.id"
        @click="handleSongSelect(song)"
        class="song-btn"
        :class="{ active: currentSong?.id === song.id }"
      >
        <div class="song-icon">{{ song.icon }}</div>
        <div class="song-info">
          <div class="song-name">{{ song.name }}</div>
          <div class="song-rhythm">{{ song.rhythm.join(' ') }}</div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface RhythmSong {
  id: string;
  name: string;
  icon: string;
  rhythm: string[];
  bpm: number;
}

interface Props {
  show: boolean;
  rhythmSongs: RhythmSong[];
  currentSong?: RhythmSong | null;
}

defineProps<Props>();
const emit = defineEmits<{
  songSelect: [song: RhythmSong];
}>();

const handleSongSelect = (song: RhythmSong) => {
  emit('songSelect', song);
};
</script>

<style scoped>
.rhythm-songs {
  background: linear-gradient(135deg, #F0E68C, #DAA520);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 8px 25px rgba(218, 165, 32, 0.3);
}

.rhythm-songs h4 {
  text-align: center;
  color: #8B4513;
  font-size: 1.3rem;
  font-weight: 700;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.5);
}

.song-buttons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.song-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #FFF8DC, #F5DEB3);
  border: 2px solid transparent;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.1);
}

.song-btn:hover {
  background: linear-gradient(135deg, #F5DEB3, #DEB887);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 69, 19, 0.2);
}

.song-btn.active {
  background: linear-gradient(135deg, #8B4513, #A0522D);
  color: white;
  border-color: #CD853F;
  box-shadow: 0 6px 16px rgba(139, 69, 19, 0.4);
}

.song-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.song-info {
  flex: 1;
}

.song-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.song-rhythm {
  font-size: 0.9rem;
  opacity: 0.7;
  font-family: monospace;
  letter-spacing: 1px;
}

.song-btn.active .song-rhythm {
  opacity: 0.9;
}

@media (max-width: 768px) {
  .song-buttons {
    grid-template-columns: 1fr;
  }
  
  .song-btn {
    padding: 12px;
  }
  
  .song-icon {
    font-size: 1.5rem;
  }
  
  .song-name {
    font-size: 1rem;
  }
  
  .song-rhythm {
    font-size: 0.8rem;
  }
}
</style>