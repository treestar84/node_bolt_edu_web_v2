<template>
  <div class="violin-instrument">
    <!-- 바이올린 연주 영역 (상단으로 이동, 확대) -->
    <div 
      class="violin-play-area"
      @mousedown="startDrag"
      @touchstart="startDrag"
    >
      <!-- 드래그 가이드 -->
      <div class="drag-guide" v-if="!currentSong">
        <h4>🎻 곡을 선택해주세요!</h4>
        <p>위에서 연주하고 싶은 곡을 선택하면 바이올린 연주를 시작할 수 있어요.</p>
      </div>

      <!-- 연주 상태 표시 -->
      <div class="play-status" v-if="currentSong">
        <div class="song-info">
          <h4>{{ currentSong.icon }} {{ currentSong.name }}</h4>
          <div class="play-instruction" v-if="!isDragging && !hasStarted">
            🏹 화면을 클릭하고 드래그하여 연주를 시작하세요!
          </div>
          <div class="play-instruction" v-else-if="isDragging">
            🎵 연주 중... 계속 드래그하세요!
          </div>
          <div class="play-instruction" v-else-if="isPaused">
            ⏸️ 일시정지됨. 다시 드래그하여 연주를 계속하세요.
          </div>
        </div>

        <!-- 진행 상황 -->
        <div class="progress-section">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="progress-info">
            <span class="progress-text">{{ currentNoteIndex }} / {{ currentSong.notes.length }}</span>
            <span class="current-note">
              현재: <strong>{{ getCurrentNote() }}</strong>
            </span>
          </div>
        </div>
      </div>

      <!-- 바이올린 시각화 -->
      <div class="violin-visualization">
        <div class="violin-body">
          <div class="violin-shape">
            <!-- 바이올린 몸체 -->
            <div class="violin-main"></div>
            <!-- f홀 -->
            <div class="f-holes">
              <div class="f-hole left"></div>
              <div class="f-hole right"></div>
            </div>
            <!-- 브릿지 -->
            <div class="violin-bridge"></div>
            <!-- 현들 (장식용) -->
            <div class="violin-strings">
              <div class="string" v-for="n in 4" :key="n"></div>
            </div>
          </div>
        </div>

        <!-- 바이올린 활 -->
        <div 
          class="violin-bow"
          :class="{ dragging: isDragging, playing: isPlaying }"
          :style="bowStyle"
        >
          <div class="bow-stick"></div>
          <div class="bow-hair"></div>
          <div class="bow-tip"></div>
          <div class="bow-frog"></div>
        </div>
      </div>

      <!-- 완주 축하 메시지 -->
      <div v-if="isCompleted" class="completion-message">
        <h3>🎉 축하합니다!</h3>
        <p>"{{ currentSong?.name }}" 연주를 완주했어요!</p>
        <button @click="resetSong" class="reset-btn">다시 연주하기</button>
      </div>
    </div>

    <!-- 곡 선택 패널 (하단으로 이동, 축소) -->
    <div class="song-selection-panel compact">
      <h4 class="panel-title">🎵 {{ $t('music.violin.selectSong') }}</h4>
      <div class="song-grid">
        <button
          v-for="song in songs"
          :key="song.id"
          @click="selectSong(song)"
          class="song-card compact"
          :class="{ active: currentSong?.id === song.id }"
        >
          <div class="song-icon">{{ song.icon }}</div>
          <div class="song-name">{{ song.name }}</div>
        </button>
      </div>
    </div>

    <!-- 바이올린 연주 통계 (하단으로 이동, 축소) -->
    <ViolinStats
      :stats="playStats"
      :current-song-name="currentSong?.name"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useMusic } from '@/composables/useMusic';
import ViolinStats from '@/components/music/ViolinStats.vue';

interface Song {
  id: string;
  name: string;
  icon: string;
  notes: string[];
  bpm: number;
}

const music = useMusic();

// 상태 관리
const currentSong = ref<Song | null>(null);
const currentNoteIndex = ref(0);
const isDragging = ref(false);
const isPlaying = ref(false);
const isPaused = ref(false);
const hasStarted = ref(false);
const isCompleted = ref(false);

// 드래그 관련
const dragStartPos = ref({ x: 0, y: 0 });
const currentPos = ref({ x: 0, y: 0 });
const lastMoveTime = ref(0);
const dragDistance = ref(0);

// 곡 목록 (실제 음정으로 매핑)
const songs: Song[] = [
  {
    id: 'three-bears',
    name: '곰 세 마리',
    icon: '🐻',
    notes: ['G4', 'G4', 'A4', 'A4', 'G4', 'G4', 'E4', 'G4', 'G4', 'A4', 'A4', 'G4', 'G4', 'E4', 'E4', 'E4', 'G4', 'G4', 'E4', 'E4', 'G4', 'G4', 'D4', 'G4', 'G4', 'A4', 'A4', 'G4', 'G4', 'E4'],
    bpm: 100
  },
  {
    id: 'butterfly',
    name: '나비야',
    icon: '🦋',
    notes: ['E4', 'G4', 'G4', 'G4', 'E4', 'G4', 'A4', 'A4', 'G4', 'E4', 'G4', 'G4', 'G4', 'E4', 'D4', 'E4', 'G4', 'G4', 'A4', 'G4', 'E4', 'G4', 'G4', 'G4', 'E4', 'G4', 'A4', 'A4', 'G4'],
    bpm: 90
  },
  {
    id: 'santa',
    name: '산토끼',
    icon: '🐰',
    notes: ['D4', 'E4', 'G4', 'G4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4', 'G4', 'A4', 'G4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'D4'],
    bpm: 120
  },
  {
    id: 'mom-sister',
    name: '엄마야 누나야',
    icon: '👪',
    notes: ['G4', 'A4', 'G4', 'E4', 'G4', 'A4', 'G4', 'E4', 'G4', 'G4', 'A4', 'G4', 'E4', 'D4', 'E4', 'G4', 'A4', 'G4', 'E4', 'G4', 'A4', 'G4', 'E4', 'G4', 'G4', 'A4', 'G4', 'E4', 'D4'],
    bpm: 80
  }
];

// 계산된 속성들
const playStats = computed(() => music.getPlayStats.value);

const progressPercentage = computed(() => {
  if (!currentSong.value) return 0;
  return (currentNoteIndex.value / currentSong.value.notes.length) * 100;
});

const bowStyle = computed(() => {
  const rotation = dragDistance.value * 0.1;
  const translateX = (currentPos.value.x - dragStartPos.value.x) * 0.3;
  const translateY = (currentPos.value.y - dragStartPos.value.y) * 0.3;
  
  return {
    transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
    transition: isDragging.value ? 'none' : 'all 0.3s ease'
  };
});

// 메서드들
const selectSong = (song: Song) => {
  currentSong.value = song;
  resetSong();
  console.log('🎵 Selected song:', song.name);
};

const resetSong = () => {
  currentNoteIndex.value = 0;
  isDragging.value = false;
  isPlaying.value = false;
  isPaused.value = false;
  hasStarted.value = false;
  isCompleted.value = false;
  dragDistance.value = 0;
  
  // 위치 초기화
  dragStartPos.value = { x: 0, y: 0 };
  currentPos.value = { x: 0, y: 0 };
};

const getCurrentNote = () => {
  if (!currentSong.value || currentNoteIndex.value >= currentSong.value.notes.length) {
    return '완료!';
  }
  const note = currentSong.value.notes[currentNoteIndex.value];
  // 음정을 한국어로 변환
  const noteNames: { [key: string]: string } = {
    'C4': '도', 'D4': '레', 'E4': '미', 'F4': '파', 'G4': '솔', 'A4': '라', 'B4': '시',
    'C5': '높은도', 'D5': '높은레', 'E5': '높은미', 'F5': '높은파', 'G5': '높은솔', 'A5': '높은라', 'B5': '높은시'
  };
  return noteNames[note] || note;
};

const playCurrentNote = async () => {
  if (!currentSong.value || isCompleted.value) return;
  
  if (currentNoteIndex.value >= currentSong.value.notes.length) {
    completeSong();
    return;
  }
  
  // 실제 음표 이름 가져오기 (G4, A4 등)
  const actualNote = currentSong.value.notes[currentNoteIndex.value];
  const displayNote = getCurrentNote(); // 한국어 표시용
  
  // 음표 재생
  await music.playViolinNote(actualNote, 0.6);
  
  // 진동 효과
  if (navigator.vibrate) {
    navigator.vibrate(30);
  }
  
  console.log(`🎵 Playing note: ${actualNote} (${displayNote}) - ${currentNoteIndex.value + 1}/${currentSong.value.notes.length}`);
  
  // 다음 음표로 진행
  currentNoteIndex.value++;
  
  // 곡 완료 체크
  if (currentNoteIndex.value >= currentSong.value.notes.length) {
    await nextTick();
    completeSong();
  }
};

const completeSong = () => {
  isCompleted.value = true;
  isDragging.value = false;
  isPlaying.value = false;
  console.log(`🎉 Completed "${currentSong.value?.name}"!`);
};

// 드래그 이벤트 처리
const startDrag = (event: MouseEvent | TouchEvent) => {
  if (!currentSong.value || isCompleted.value) return;
  
  event.preventDefault();
  
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
  isDragging.value = true;
  isPlaying.value = true;
  isPaused.value = false;
  hasStarted.value = true;
  
  dragStartPos.value = { x: clientX, y: clientY };
  currentPos.value = { x: clientX, y: clientY };
  lastMoveTime.value = Date.now();
  
  // 첫 번째 음표 재생
  if (currentNoteIndex.value === 0) {
    playCurrentNote();
  }
  
  // 이벤트 리스너 추가
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchmove', handleDrag);
  document.addEventListener('touchend', stopDrag);
  
  console.log('🎻 Started violin dragging');
};

const handleDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value || !currentSong.value) return;
  
  event.preventDefault();
  
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
  // 이전 위치와의 거리 계산 (누적 거리가 아닌 이동 거리)
  const moveDistance = Math.sqrt(
    Math.pow(clientX - currentPos.value.x, 2) + 
    Math.pow(clientY - currentPos.value.y, 2)
  );
  
  // 현재 위치 업데이트
  currentPos.value = { x: clientX, y: clientY };
  
  const now = Date.now();
  const timeDelta = now - lastMoveTime.value;
  
  // 조건을 더 관대하게: 작은 움직임이라도 시간이 충분히 지나면 다음 음표 재생
  const shouldPlayNext = (moveDistance > 15 && timeDelta > 150) || (timeDelta > 400);
  
  if (shouldPlayNext && currentNoteIndex.value < currentSong.value.notes.length) {
    lastMoveTime.value = now;
    playCurrentNote();
    
    console.log(`🎵 Drag progress: ${currentNoteIndex.value}/${currentSong.value.notes.length}, moveDistance: ${moveDistance.toFixed(1)}, timeDelta: ${timeDelta}`);
  }
};

const stopDrag = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  isPlaying.value = false;
  isPaused.value = hasStarted.value && !isCompleted.value;
  
  // 이벤트 리스너 제거
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', stopDrag);
  
  console.log('🎻 Stopped violin dragging');
};

// 라이프사이클
onMounted(() => {
  // 기본으로 첫 번째 곡 선택
  if (songs.length > 0) {
    selectSong(songs[0]);
  }
});

onUnmounted(() => {
  // 이벤트 리스너 정리
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('mouseup', stopDrag);
  document.removeEventListener('touchmove', handleDrag);
  document.removeEventListener('touchend', stopDrag);
});
</script>

<style scoped>
.violin-instrument {
  display: flex;
  flex-direction: column;
  gap: 24px;
  user-select: none;
  font-family: 'Comic Sans MS', cursive, sans-serif;
}

/* 곡 선택 패널 - 축소 및 컴팩트 */
.song-selection-panel {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  margin-bottom: 16px;
}

.song-selection-panel.compact {
  padding: 12px;
}

.panel-title {
  text-align: center;
  margin-bottom: 12px;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.song-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.song-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
  box-shadow: var(--shadow-sm);
}

.song-card.compact {
  padding: 8px;
  gap: 4px;
}

.song-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.song-card.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

.song-icon {
  font-size: 2rem;
  margin-bottom: 4px;
}

.song-name {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.song-notes {
  font-size: 0.9rem;
  opacity: 0.8;
}

/* 바이올린 연주 영역 - 상단 확대 */
.violin-play-area {
  min-height: 60vh;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-card);
  position: relative;
  cursor: grab;
  overflow: hidden;
  margin-bottom: 32px;
}

.violin-play-area:active {
  cursor: grabbing;
}

/* 드래그 가이드 */
.drag-guide {
  text-align: center;
  padding: 60px 20px;
}

.drag-guide h4 {
  font-size: 1.5rem;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.drag-guide p {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* 연주 상태 표시 */
.play-status {
  margin-bottom: 24px;
}

.song-info {
  text-align: center;
  margin-bottom: 20px;
}

.song-info h4 {
  font-size: 1.4rem;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.play-instruction {
  font-size: 1rem;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  padding: 12px 20px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  display: inline-block;
}

/* 진행 상황 */
.progress-section {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 16px;
  border: 1px solid var(--color-border);
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: var(--color-border);
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #81C784);
  border-radius: 6px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { left: -100%; }
  100% { left: 100%; }
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.95rem;
}

.progress-text {
  color: var(--color-text-secondary);
  font-weight: 600;
}

.current-note {
  color: var(--color-text-primary);
  font-size: 1.1rem;
}

.current-note strong {
  background: var(--color-primary);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 1.2rem;
}

/* 바이올린 시각화 */
.violin-visualization {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  position: relative;
}

.violin-body {
  position: relative;
}

.violin-shape {
  width: 100px;
  height: 240px;
  position: relative;
}

.violin-main {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #DEB887, #CD853F, #A0522D);
  border-radius: 50px 50px 45px 45px;
  position: relative;
  border: 3px solid #8B4513;
  box-shadow: 
    inset 0 4px 8px rgba(139, 69, 19, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.2);
}

.f-holes {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 80px;
}

.f-hole {
  position: absolute;
  width: 8px;
  height: 60px;
  background: #2C1810;
  border-radius: 4px;
}

.f-hole.left {
  left: 15px;
  transform: rotate(-10deg);
}

.f-hole.right {
  right: 15px;
  transform: rotate(10deg);
}

.violin-bridge {
  position: absolute;
  top: 45%;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 8px;
  background: #F5DEB3;
  border-radius: 2px;
  border: 1px solid #DEB887;
}

.violin-strings {
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 60%;
  display: flex;
  justify-content: space-between;
}

.string {
  width: 1px;
  height: 100%;
  background: linear-gradient(180deg, #C0C0C0, #808080);
  border-radius: 0.5px;
  margin-right: 3px;
}

.string:last-child {
  margin-right: 0;
}

/* 바이올린 활 */
.violin-bow {
  position: absolute;
  right: 60px;
  top: 50%;
  transform: translateY(-50%);
  width: 150px;
  height: 8px;
  transform-origin: center;
  transition: all 0.3s ease;
}

.violin-bow.dragging {
  transform: translateY(-50%) scale(1.1);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.violin-bow.playing {
  animation: bowVibrate 0.1s infinite alternate;
}

@keyframes bowVibrate {
  0% { transform: translateY(-50%) translateX(0px); }
  100% { transform: translateY(-50%) translateX(2px); }
}

.bow-stick {
  position: absolute;
  top: 2px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #8B4513, #A0522D, #8B4513);
  border-radius: 2px;
  border: 1px solid #654321;
}

.bow-hair {
  position: absolute;
  top: 0;
  left: 10px;
  right: 15px;
  height: 1px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 0.5px;
}

.bow-tip {
  position: absolute;
  right: 0;
  top: 1px;
  width: 12px;
  height: 6px;
  background: #654321;
  border-radius: 0 3px 3px 0;
}

.bow-frog {
  position: absolute;
  left: 0;
  top: 0;
  width: 8px;
  height: 8px;
  background: #2F4F4F;
  border-radius: 2px;
}

/* 완주 축하 메시지 */
.completion-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-bg-card);
  border: 3px solid var(--color-success);
  border-radius: var(--radius-xl);
  padding: 32px;
  text-align: center;
  box-shadow: var(--shadow-xl);
  animation: celebrationBounce 0.6s ease-out;
}

@keyframes celebrationBounce {
  0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
  50% { transform: translate(-50%, -50%) scale(1.1); }
  100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
}

.completion-message h3 {
  color: var(--color-success);
  font-size: 1.8rem;
  margin-bottom: 16px;
}

.completion-message p {
  color: var(--color-text-primary);
  font-size: 1.2rem;
  margin-bottom: 24px;
}

.reset-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.reset-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .song-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .violin-play-area {
    min-height: 50vh;
    padding: 20px;
  }
  
  .violin-shape {
    width: 80px;
    height: 200px;
  }
  
  .violin-bow {
    width: 120px;
    right: 40px;
  }
  
  .progress-info {
    flex-direction: column;
    gap: 8px;
  }
  
  .song-selection-panel {
    padding: 12px;
  }
  
  .panel-title {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .song-grid {
    grid-template-columns: 1fr;
  }
  
  .violin-play-area {
    min-height: 45vh;
    padding: 16px;
  }
  
  .song-card {
    padding: 10px;
  }
  
  .song-card.compact {
    padding: 8px;
  }
  
  .song-icon {
    font-size: 1.5rem;
  }
  
  .song-name {
    font-size: 0.8rem;
  }
  
  .completion-message {
    margin: 16px;
    padding: 24px;
  }
  
  .song-selection-panel {
    padding: 8px;
  }
}
</style>