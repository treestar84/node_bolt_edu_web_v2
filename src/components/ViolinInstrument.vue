<template>
  <div class="violin-instrument">
    <!-- 바이올린 학습 통계 -->
    <div class="violin-stats">
      <div class="stat-item">
        <span class="stat-label">연주한 음</span>
        <span class="stat-value">{{ playStats.totalNotes }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">연습 시간</span>
        <span class="stat-value">{{ playStats.playDuration }}초</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">현재 곡</span>
        <span class="stat-value">{{ currentSong?.name || '자유연주' }}</span>
      </div>
    </div>

    <!-- 연습 모드 선택 -->
    <div class="practice-mode-selector">
      <button 
        @click="setPracticeMode('free')"
        class="mode-btn"
        :class="{ active: practiceMode === 'free' }"
      >
        🎵 자유연주
      </button>
      <button 
        @click="setPracticeMode('rhythm')"
        class="mode-btn"
        :class="{ active: practiceMode === 'rhythm' }"
      >
        🎼 리듬연습
      </button>
    </div>

    <!-- 리듬 연습 곡 선택 -->
    <div v-if="practiceMode === 'rhythm'" class="rhythm-songs">
      <h4>🎶 연습할 곡을 선택하세요</h4>
      <div class="song-buttons">
        <button
          v-for="song in rhythmSongs"
          :key="song.id"
          @click="selectSong(song)"
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

    <!-- 바이올린 본체 -->
    <div class="violin-body">
      <div class="violin-container">
        <!-- 바이올린 외형 (대폭 확대) -->
        <div class="violin-shape">
          <!-- 스크롤 (상단 장식) -->
          <div class="violin-scroll">
            <div class="scroll-decoration"></div>
          </div>

          <!-- 펙박스 (조율 부분) -->
          <div class="violin-pegbox">
            <div class="peg" v-for="i in 4" :key="i"></div>
          </div>

          <!-- 넥 -->
          <div class="violin-neck">
            <div class="fingerboard"></div>
          </div>

          <!-- 바디 -->
          <div class="violin-main-body">
            <!-- f홀 -->
            <div class="f-holes">
              <div class="f-hole left"></div>
              <div class="f-hole right"></div>
            </div>

            <!-- 브릿지 -->
            <div class="violin-bridge"></div>

            <!-- 현들 (실제 바이올린처럼 가로 배치) -->
            <div class="violin-strings">
              <div
                v-for="(string, index) in violinStrings"
                :key="string.note"
                class="violin-string"
                :class="{ 
                  active: activeStrings.has(string.note),
                  highlighted: practiceMode === 'rhythm' && currentNote === string.note,
                  [`string-${index + 1}`]: true
                }"
                :style="{ 
                  background: string.color
                }"
                @click="playStringDirect(string)"
              >
                <div class="string-label">{{ string.note }}</div>
                <div class="string-glow" v-if="activeStrings.has(string.note)"></div>
                <div class="string-touch-area"></div>
              </div>
            </div>

            <!-- 현 라벨 (더 크고 명확하게) -->
            <div class="string-labels">
              <div 
                v-for="string in violinStrings"
                :key="`label-${string.note}`"
                class="string-name"
              >
                {{ string.displayName }}
              </div>
            </div>
          </div>

          <!-- 테일피스 -->
          <div class="violin-tailpiece"></div>
        </div>

        <!-- 활 (인터랙티브, 드래그 가능) -->
        <div 
          class="violin-bow" 
          :class="{ 
            playing: isPlaying,
            dragging: isDragging,
            'bow-ready': !isDragging 
          }"
          :style="{ transform: bowTransform }"
          @mousedown="startBowDrag($event)"
          @touchstart="startBowDrag($event)"
        >
          <div class="bow-stick"></div>
          <div class="bow-hair"></div>
          <div class="bow-frog"></div>
          <div class="bow-tip"></div>
          
          <!-- 활 사용 가이드 -->
          <div class="bow-guide" v-if="!isDragging && !isPlaying">
            <div class="guide-text">활을 드래그해서 연주하세요!</div>
            <div class="guide-arrow">👆</div>
          </div>
        </div>

        <!-- 드래그 영역 표시 -->
        <div class="bow-drag-area" v-if="isDragging">
          <div class="drag-indicator"></div>
        </div>
      </div>

      <!-- 드래그 연주 안내 -->
      <div v-if="practiceMode === 'rhythm' && currentSong" class="drag-guide">
        <h4>🎯 {{ currentSong.name }}</h4>
        <p class="drag-instruction">
          🎻 활을 드래그하여 연주하세요! 움직일 때마다 다음 음이 연주됩니다.
        </p>
        <div class="song-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: `${(currentNoteIndex / currentSong.rhythm.length) * 100}%` }"
            ></div>
          </div>
          <div class="progress-text">
            {{ currentNoteIndex }} / {{ currentSong.rhythm.length }}
          </div>
        </div>
        <div class="current-note">
          <span class="note-label">다음 음:</span>
          <span class="note-display">{{ getCurrentNote() }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMusic } from '@/composables/useMusic';

interface ViolinString {
  note: string;
  displayName: string;
  frequency: number;
  color: string;
}

interface RhythmSong {
  id: string;
  name: string;
  icon: string;
  rhythm: string[];
  bpm: number;
}

const music = useMusic();
const activeStrings = ref<Set<string>>(new Set());
const isPlaying = ref(false);
const practiceMode = ref<'free' | 'rhythm'>('rhythm');
const currentSong = ref<RhythmSong | null>(null);
const currentNoteIndex = ref(0);
const currentNote = ref<string | null>(null);
const lastDragPosition = ref({ x: 0, y: 0 });
const isPlayingNote = ref(false); // 현재 음표가 재생 중인지

// 활 드래그 관련 상태
const isDragging = ref(false);
const dragStartX = ref(0);
const dragStartY = ref(0);
const bowPosition = ref({ x: 0, y: 0 });
const bowTransform = ref('');
const lastPlayedString = ref<string | null>(null);
const dragCurrentString = ref<string | null>(null);

// 바이올린 현 정의 (낮은 음부터 높은 음까지)
const violinStrings: ViolinString[] = [
  { note: 'G', displayName: 'G현 (솔)', frequency: 196.00, color: 'linear-gradient(135deg, #ffcdd2, #f8bbd9)' }, // G3
  { note: 'D', displayName: 'D현 (레)', frequency: 293.66, color: 'linear-gradient(135deg, #fff176, #ffee58)' }, // D4
  { note: 'A', displayName: 'A현 (라)', frequency: 440.00, color: 'linear-gradient(135deg, #c8e6c9, #a5d6a7)' }, // A4
  { note: 'E', displayName: 'E현 (미)', frequency: 659.25, color: 'linear-gradient(135deg, #bbdefb, #90caf9)' }  // E5
];

// 실제 동요 연습곡들 (1절 전체)
const rhythmSongs: RhythmSong[] = [
  {
    id: 'three-bears',
    name: '곰 세 마리',
    icon: '🐻',
    rhythm: ['G', 'G', 'A', 'A', 'G', 'G', 'E', 'G', 'G', 'A', 'A', 'G', 'G', 'E', 'E', 'E', 'G', 'G', 'E', 'E', 'G', 'G', 'D', 'G', 'G', 'A', 'A', 'G', 'G', 'E'],
    bpm: 100
  },
  {
    id: 'butterfly',
    name: '나비야',
    icon: '🦋',
    rhythm: ['E', 'G', 'G', 'G', 'E', 'G', 'A', 'A', 'G', 'E', 'G', 'G', 'G', 'E', 'D', 'E', 'G', 'G', 'A', 'G', 'E', 'G', 'G', 'G', 'E', 'G', 'A', 'A', 'G'],
    bpm: 90
  },
  {
    id: 'santa',
    name: '산토끼',
    icon: '🐰',
    rhythm: ['D', 'E', 'G', 'G', 'A', 'G', 'E', 'D', 'E', 'G', 'G', 'A', 'G', 'E', 'G', 'A', 'G', 'E', 'D', 'E', 'G', 'A', 'G', 'E', 'D'],
    bpm: 120
  },
  {
    id: 'mom-sister',
    name: '엄마야 누나야',
    icon: '👪',
    rhythm: ['G', 'A', 'G', 'E', 'G', 'A', 'G', 'E', 'G', 'G', 'A', 'G', 'E', 'D', 'E', 'G', 'A', 'G', 'E', 'G', 'A', 'G', 'E', 'G', 'G', 'A', 'G', 'E', 'D'],
    bpm: 80
  }
];

// 연주 통계
const playStats = computed(() => music.getPlayStats.value);

/**
 * 연습 모드 설정
 */
const setPracticeMode = (mode: 'free' | 'rhythm') => {
  practiceMode.value = mode;
  if (mode === 'free') {
    currentSong.value = null;
    resetSongProgress();
  }
};

/**
 * 곡 선택
 */
const selectSong = (song: RhythmSong) => {
  currentSong.value = song;
  resetSongProgress();
};

/**
 * 곡 진행 상태 초기화
 */
const resetSongProgress = () => {
  currentNoteIndex.value = 0;
  currentNote.value = null;
};

/**
 * 현재 연주해야 할 음표 가져오기
 */
const getCurrentNote = () => {
  if (!currentSong.value || currentNoteIndex.value >= currentSong.value.rhythm.length) {
    return '완료!';
  }
  return currentSong.value.rhythm[currentNoteIndex.value];
};

/**
 * 다음 음표로 진행 (1초 지속)
 */
const playNextNote = async () => {
  if (!currentSong.value || isPlayingNote.value) return;
  
  const currentNoteValue = getCurrentNote();
  if (currentNoteValue === '완료!') return;
  
  isPlayingNote.value = true;
  
  // 이전 현 비활성화
  activeStrings.value.clear();
  
  // 현재 음표에 해당하는 현 활성화
  activeStrings.value.add(currentNoteValue);
  
  // 현재 음표 연주 (동요의 음을 바이올린 현 음으로, 1초 지속)
  await music.playViolinNote(currentNoteValue, 1.0);
  
  // 진동 효과
  if (navigator.vibrate) {
    navigator.vibrate(40);
  }
  
  console.log(`🎵 Playing song note: ${currentNoteValue} (${currentNoteIndex.value + 1}/${currentSong.value.rhythm.length})`);
  
  // 다음 음표로 진행
  currentNoteIndex.value++;
  
  // 1초 후에 현 비활성화 및 다음 음 준비
  setTimeout(() => {
    activeStrings.value.clear();
    isPlayingNote.value = false;
    
    // 곡이 완료되었는지 확인
    if (currentSong.value && currentNoteIndex.value >= currentSong.value.rhythm.length) {
      console.log(`🎉 "${currentSong.value?.name}" 연주 완료!`);
      resetSongProgress();
    }
  }, 1000);
};

/**
 * 현 직접 클릭 연주 (자유 연주 모드에서만)
 */
const playStringDirect = (string: ViolinString) => {
  if (isDragging.value) return; // 드래그 중일 때는 무시
  
  // 리듬 연습 모드에서는 사용자 입력 차단
  if (practiceMode.value === 'rhythm') {
    return;
  }
  
  activeStrings.value.add(string.note);
  isPlaying.value = true;
  
  // 바이올린 소리 재생
  music.playViolinNote(string.note, 1.5);
  
  // 진동 효과
  if (navigator.vibrate) {
    navigator.vibrate(80);
  }
  
  // 자동으로 활성화 해제
  setTimeout(() => {
    activeStrings.value.delete(string.note);
    if (activeStrings.value.size === 0) {
      isPlaying.value = false;
    }
  }, 1000);
  
  console.log('🎻 Direct playing violin string:', string.displayName);
};

/**
 * 활 드래그/터치 시작
 */
const startBowDrag = (event: MouseEvent | TouchEvent) => {
  event.preventDefault();
  
  // 리듬 연습 모드에서는 터치/클릭으로 다음 음 재생
  if (practiceMode.value === 'rhythm' && currentSong.value) {
    playNextNote();
    return; // 드래그 로직은 실행하지 않음
  }
  
  // 자유 연주 모드에서만 드래그 로직 실행
  isDragging.value = true;
  isPlaying.value = true;
  
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
  dragStartX.value = clientX;
  dragStartY.value = clientY;
  bowPosition.value = { x: clientX, y: clientY };
  lastDragPosition.value = { x: clientX, y: clientY };
  
  // 이벤트 리스너 추가
  document.addEventListener('mousemove', handleBowDrag);
  document.addEventListener('mouseup', stopBowDrag);
  document.addEventListener('touchmove', handleBowDrag);
  document.addEventListener('touchend', stopBowDrag);
  
  console.log('🎻 Started bow dragging');
};

/**
 * 활 드래그 중
 */
const handleBowDrag = (event: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  
  event.preventDefault();
  
  const clientX = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
  const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
  
  // 활 위치 업데이트
  const deltaX = clientX - dragStartX.value;
  const deltaY = clientY - dragStartY.value;
  
  bowPosition.value = { x: clientX, y: clientY };
  bowTransform.value = `translate(${deltaX}px, ${deltaY}px) rotate(${deltaX * 0.1}deg)`;
  
  // 자유 연주 모드에서만 드래그 감지 처리
  if (practiceMode.value === 'free') {
    // 드래그 거리 계산 (움직임 감지)
    const dragDistance = Math.sqrt(
      Math.pow(clientX - lastDragPosition.value.x, 2) + 
      Math.pow(clientY - lastDragPosition.value.y, 2)
    );
    
    // 충분한 움직임이 있을 때만 처리 (너무 민감하지 않게)
    if (dragDistance > 15) {
      lastDragPosition.value = { x: clientX, y: clientY };
      
      // 자유 연주 모드: 현재 활이 지나가는 현 감지
      const stringElement = document.elementFromPoint(clientX, clientY);
      if (stringElement && stringElement.closest('.violin-string')) {
        const stringContainer = stringElement.closest('.violin-string') as HTMLElement;
        const stringIndex = Array.from(stringContainer.parentElement!.children).indexOf(stringContainer);
        
        if (stringIndex >= 0 && stringIndex < violinStrings.length) {
          const currentString = violinStrings[stringIndex];
          
          // 새로운 현에 진입했을 때만 소리 재생
          if (dragCurrentString.value !== currentString.note) {
            dragCurrentString.value = currentString.note;
            
            // 이전 현 비활성화
            if (lastPlayedString.value) {
              activeStrings.value.delete(lastPlayedString.value);
            }
            
            // 새 현 활성화 및 소리 재생
            activeStrings.value.add(currentString.note);
            music.playViolinNote(currentString.note, 0.8);
            
            // 진동 효과
            if (navigator.vibrate) {
              navigator.vibrate(60);
            }
            
            lastPlayedString.value = currentString.note;
            
            console.log('🎻 Bow crossing string:', currentString.displayName);
          }
        }
      }
    }
  }
};

/**
 * 활 드래그 종료
 */
const stopBowDrag = () => {
  if (!isDragging.value) return;
  
  isDragging.value = false;
  isPlaying.value = false;
  dragCurrentString.value = null;
  lastPlayedString.value = null;
  
  // 모든 현 비활성화
  activeStrings.value.clear();
  
  // 활 위치 리셋
  bowTransform.value = '';
  
  // 이벤트 리스너 제거
  document.removeEventListener('mousemove', handleBowDrag);
  document.removeEventListener('mouseup', stopBowDrag);
  document.removeEventListener('touchmove', handleBowDrag);
  document.removeEventListener('touchend', stopBowDrag);
  
  console.log('🎻 Stopped bow dragging');
};

/**
 * 활 시작 (키보드용)
 */
const startBowing = (string: ViolinString, _event: any) => {
  if (activeStrings.value.has(string.note)) return;
  
  activeStrings.value.add(string.note);
  // playNote 함수 호출 제거 (현재 미구현)
  
  console.log('🎻 Started bowing:', string.note);
};

/**
 * 활 정지 (키보드용)
 */
const stopBowing = (string: ViolinString) => {
  activeStrings.value.delete(string.note);
  console.log('🎻 Stopped bowing:', string.note);
};

/**
 * 키보드 이벤트 처리
 */
const handleKeyboard = (event: KeyboardEvent) => {
  const keyMap: { [key: string]: ViolinString } = {
    'g': violinStrings[0], // G현
    'd': violinStrings[1], // D현
    'a': violinStrings[2], // A현
    'e': violinStrings[3]  // E현
  };
  
  const string = keyMap[event.key.toLowerCase()];
  if (string && !activeStrings.value.has(string.note)) {
    startBowing(string, event as any);
  }
};

const handleKeyboardUp = (event: KeyboardEvent) => {
  const keyMap: { [key: string]: ViolinString } = {
    'g': violinStrings[0],
    'd': violinStrings[1],
    'a': violinStrings[2],
    'e': violinStrings[3]
  };
  
  const string = keyMap[event.key.toLowerCase()];
  if (string) {
    stopBowing(string);
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyboard);
  window.addEventListener('keyup', handleKeyboardUp);
  
  // 기본으로 첫 번째 곡 선택
  if (rhythmSongs.length > 0) {
    selectSong(rhythmSongs[0]);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard);
  window.removeEventListener('keyup', handleKeyboardUp);
});
</script>

<style scoped>
/* 다크 모드 호환 CSS 변수 정의 */
:root {
  /* 라이트 모드 */
  --color-bg-card: linear-gradient(135deg, #faf9f7, #f8f6f2);
  --color-bg-button: linear-gradient(135deg, #fff8e1, #ffecb3);
  --color-bg-accent: linear-gradient(135deg, #a1887f, #8d6e63);
  --color-bg-elevated: rgba(255, 255, 255, 0.8);
  --color-text-primary: #5d4037;
  --color-text-secondary: #6d4c41;
  --color-text-accent: #ffffff;
  --color-text-shadow-soft: rgba(255, 255, 255, 0.8);
  --color-border-soft: rgba(255, 255, 255, 0.6);
  --color-border-accent: rgba(255, 255, 255, 0.8);
  --color-border-hover: #8d6e63;
  --color-shadow-soft: rgba(0, 0, 0, 0.08);
  --color-shadow-medium: rgba(0, 0, 0, 0.15);
  --color-violin-wood: linear-gradient(135deg, #d7ccc8, #bcaaa4, #a1887f);
  --color-violin-accent: #5d4037;
  --color-violin-fingerboard: linear-gradient(180deg, #424242, #2e2e2e);
  --color-violin-bridge: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  --color-string-g: linear-gradient(135deg, #ffcdd2, #f8bbd9);
  --color-string-d: linear-gradient(135deg, #fff176, #ffee58);
  --color-string-a: linear-gradient(135deg, #c8e6c9, #a5d6a7);
  --color-string-e: linear-gradient(135deg, #bbdefb, #90caf9);
}

@media (prefers-color-scheme: dark) {
  :root {
    /* 다크 모드 */
    --color-bg-card: linear-gradient(135deg, #2d2d2d, #1e1e1e);
    --color-bg-button: linear-gradient(135deg, #3d3d3d, #2d2d2d);
    --color-bg-accent: linear-gradient(135deg, #6d4c41, #5d4037);
    --color-bg-elevated: rgba(255, 255, 255, 0.1);
    --color-text-primary: #e8e8e8;
    --color-text-secondary: #b8b8b8;
    --color-text-accent: #ffffff;
    --color-text-shadow-soft: rgba(0, 0, 0, 0.8);
    --color-border-soft: rgba(255, 255, 255, 0.2);
    --color-border-accent: rgba(255, 255, 255, 0.3);
    --color-border-hover: #8d6e63;
    --color-shadow-soft: rgba(0, 0, 0, 0.25);
    --color-shadow-medium: rgba(0, 0, 0, 0.35);
    --color-violin-wood: linear-gradient(135deg, #8d6e63, #6d4c41, #5d4037);
    --color-violin-accent: #a1887f;
    --color-violin-fingerboard: linear-gradient(180deg, #1a1a1a, #000000);
    --color-violin-bridge: linear-gradient(135deg, #e0e0e0, #d0d0d0);
    --color-string-g: linear-gradient(135deg, #f48fb1, #ec407a);
    --color-string-d: linear-gradient(135deg, #ffeb3b, #ffc107);
    --color-string-a: linear-gradient(135deg, #81c784, #66bb6a);
    --color-string-e: linear-gradient(135deg, #64b5f6, #42a5f5);
  }
}

.violin-instrument {
  display: flex;
  flex-direction: column;
  gap: 24px;
  user-select: none;
  font-family: 'Comic Sans MS', cursive, sans-serif;
}

/* 바이올린 통계 */
.violin-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  background: white;
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #ddd;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.stat-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #333;
  text-shadow: none;
}

/* 연습 모드 선택 */
.practice-mode-selector {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.mode-btn {
  padding: 12px 24px;
  border: 2px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #333;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.mode-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.mode-btn:hover:not(.active) {
  transform: translateY(-1px);
  border-color: #007bff;
  background: #f8f9fa;
}

/* 리듬 연습곡 */
.rhythm-songs {
  background: white;
  border-radius: 25px;
  padding: 24px;
  border: 2px solid #ddd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.rhythm-songs h4 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
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
  border: 2px solid #ddd;
  border-radius: 16px;
  background: white;
  color: #333;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.song-btn.active {
  background: #007bff;
  color: white;
  border-color: #007bff;
  transform: translateY(-2px);
}

.song-btn:hover:not(.active) {
  transform: translateY(-1px);
  border-color: #007bff;
  background: #f8f9fa;
}

.song-icon {
  font-size: 2rem;
  min-width: 40px;
}

.song-info {
  flex: 1;
}

.song-name {
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 4px;
}

.song-rhythm {
  font-size: 0.85rem;
  opacity: 0.8;
  font-family: monospace;
}

/* 바이올린 본체 */
.violin-body {
  background: 
    radial-gradient(ellipse 400px 200px at 50% 30%, rgba(255, 182, 193, 0.3), transparent 60%),
    linear-gradient(135deg, rgba(250, 248, 246, 0.95), rgba(248, 243, 237, 0.95));
  border-radius: 30px;
  padding: 40px;
  border: 3px solid rgba(255, 255, 255, 0.7);
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.08),
    inset 0 2px 4px rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: visible;
}

.violin-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 60px;
  min-height: 600px;
  position: relative;
  padding: 40px;
}

.violin-shape {
  position: relative;
  width: 280px;
  height: 600px;
  filter: drop-shadow(0 12px 30px rgba(0, 0, 0, 0.15));
  z-index: 10;
}

/* 바이올린 스크롤 (확대) */
.violin-scroll {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 45px;
  height: 60px;
  background: linear-gradient(135deg, #d7ccc8, #bcaaa4, #a1887f);
  border-radius: 22px 22px 12px 12px;
  box-shadow: 
    inset 0 3px 6px rgba(255, 255, 255, 0.4),
    0 6px 12px rgba(0, 0, 0, 0.1);
}

.scroll-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #5d4037;
  border-radius: 50%;
}

/* 펙박스 (확대) */
.violin-pegbox {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 38px;
  height: 75px;
  background: linear-gradient(135deg, #bcaaa4, #a1887f, #8d6e63);
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  padding: 6px;
  box-shadow: 
    inset 0 3px 6px rgba(0, 0, 0, 0.1),
    0 3px 9px rgba(0, 0, 0, 0.1);
}

.peg {
  width: 12px;
  height: 30px;
  background: linear-gradient(135deg, #6d4c41, #5d4037);
  border-radius: 3px;
  box-shadow: inset 0 2px 3px rgba(255, 255, 255, 0.2);
}

/* 넥 (확대) */
.violin-neck {
  position: absolute;
  top: 135px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 180px;
  background: linear-gradient(180deg, #bcaaa4, #a1887f);
  border-radius: 15px;
  box-shadow: 
    inset 0 3px 6px rgba(255, 255, 255, 0.3),
    0 6px 12px rgba(0, 0, 0, 0.1);
}

.fingerboard {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 180px;
  background: linear-gradient(180deg, #424242, #2e2e2e);
  border-radius: 12px;
  box-shadow: inset 0 3px 6px rgba(0, 0, 0, 0.3);
}

/* 바이올린 메인 바디 (대폭 확대) */
.violin-main-body {
  position: absolute;
  top: 315px;
  left: 50%;
  transform: translateX(-50%);
  width: 200px;
  height: 280px;
  background: 
    radial-gradient(ellipse 60px 45px at 30% 25%, rgba(255, 255, 255, 0.6), transparent 60%),
    linear-gradient(135deg, #d7ccc8, #bcaaa4, #a1887f, #8d6e63);
  border-radius: 100px 100px 60px 60px;
  box-shadow: 
    inset 0 6px 12px rgba(255, 255, 255, 0.3),
    inset 0 -3px 6px rgba(0, 0, 0, 0.1),
    0 12px 24px rgba(0, 0, 0, 0.15);
  position: relative;
}

/* f홀 (확대) */
.f-holes {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 90px;
}

.f-hole {
  position: absolute;
  width: 5px;
  height: 45px;
  background: #2e2e2e;
  border-radius: 3px;
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.5);
}

.f-hole.left {
  left: 25%;
  transform: rotate(-10deg);
}

.f-hole.right {
  right: 25%;
  transform: rotate(10deg);
}

/* 브릿지 (확대) */
.violin-bridge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 50px;
  height: 12px;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  border-radius: 6px;
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.2),
    inset 0 2px 3px rgba(255, 255, 255, 0.6);
  z-index: 10;
}

/* 바이올린 현들 - 실제 바이올린처럼 나란히 배치 */
.violin-strings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 400px;
  display: flex;
  justify-content: space-between;
  align-items: stretch;
}

.violin-string {
  position: relative;
  width: 8px;
  height: 100%;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 
    0 4px 12px var(--color-shadow-soft),
    inset 0 2px 4px var(--color-bg-elevated);
  border: 2px solid var(--color-border-soft);
  z-index: 15;
  flex-shrink: 0;
}

.violin-string {
  /* 3세 아이 터치 영역 확대 */
  position: relative;
}

.string-touch-area {
  position: absolute;
  top: -10px;
  left: -15px;
  right: -15px;
  bottom: -10px;
  background: transparent;
  border-radius: 15px;
  z-index: 20;
}

.violin-string:hover {
  transform: scale(1.15);
  filter: brightness(1.3);
  box-shadow: 
    0 6px 18px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.5);
}

.violin-string.active {
  transform: scale(1.25);
  filter: brightness(1.4) saturate(1.3);
  z-index: 25;
  box-shadow: 
    0 8px 24px rgba(0, 0, 0, 0.4),
    inset 0 3px 6px rgba(255, 255, 255, 0.6);
}

.violin-string.highlighted {
  animation: stringPulse 1s ease-in-out infinite;
  z-index: 22;
}

@keyframes stringPulse {
  0%, 100% { 
    filter: brightness(1) saturate(1);
    transform: scale(1);
  }
  50% { 
    filter: brightness(1.5) saturate(1.5);
    transform: scale(1.2);
  }
}

.string-label {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text-primary);
  text-shadow: 2px 2px 4px var(--color-text-shadow-soft);
  white-space: nowrap;
  background: var(--color-bg-elevated);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--color-border-soft);
}

.string-glow {
  position: absolute;
  top: -10px;
  left: -5px;
  right: -5px;
  bottom: -10px;
  background: radial-gradient(ellipse, rgba(255, 255, 255, 0.6), transparent 70%);
  border-radius: 50%;
  animation: stringGlow 0.5s ease;
  pointer-events: none;
  z-index: 6;
}

@keyframes stringGlow {
  0% { 
    transform: scale(0.8);
    opacity: 0;
  }
  50% { 
    transform: scale(1.3);
    opacity: 1;
  }
  100% { 
    transform: scale(1.5);
    opacity: 0;
  }
}

/* 현 라벨 */
.string-labels {
  position: absolute;
  bottom: -40px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  display: flex;
  justify-content: space-between;
}

.string-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-shadow: 1px 1px 2px var(--color-text-shadow-soft);
  white-space: nowrap;
  background: var(--color-bg-elevated);
  padding: 4px 8px;
  border-radius: 8px;
  border: 1px solid var(--color-border-soft);
  text-align: center;
  flex-shrink: 0;
}

/* 테일피스 */
.violin-tailpiece {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 15px;
  background: linear-gradient(135deg, #424242, #2e2e2e);
  border-radius: 8px 8px 4px 4px;
  box-shadow: 
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.2);
}

/* 바이올린 활 (대폭 확대 및 인터랙티브) */
.violin-bow {
  position: relative;
  width: 380px;
  height: 30px;
  transform: rotate(45deg);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 6px 15px rgba(0, 0, 0, 0.2));
  cursor: grab;
  z-index: 30;
  padding: 15px;
  border-radius: 15px;
}

.violin-bow.playing {
  transform: rotate(45deg) translateX(15px);
  animation: bowMovement 0.6s ease-in-out;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.3));
}

.violin-bow.dragging {
  cursor: grabbing;
  transform-origin: center;
  z-index: 35;
  filter: drop-shadow(0 10px 25px rgba(0, 0, 0, 0.4));
  transition: none;
}

.violin-bow.bow-ready {
  animation: bowPulse 2s ease-in-out infinite;
}

@keyframes bowPulse {
  0%, 100% { 
    transform: rotate(45deg) scale(1);
    filter: drop-shadow(0 6px 15px rgba(0, 0, 0, 0.2));
  }
  50% { 
    transform: rotate(45deg) scale(1.05);
    filter: drop-shadow(0 8px 20px rgba(255, 215, 0, 0.4));
  }
}

@keyframes bowMovement {
  0%, 100% { transform: rotate(45deg) translateX(0px); }
  50% { transform: rotate(45deg) translateX(15px); }
}

.bow-stick {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 10px;
  background: 
    repeating-linear-gradient(90deg, #d7ccc8 0px, #bcaaa4 3px, #a1887f 6px),
    linear-gradient(180deg, #d7ccc8, #a1887f);
  border-radius: 5px;
  transform: translateY(-50%);
  box-shadow: 
    0 3px 6px rgba(0, 0, 0, 0.15),
    inset 0 2px 3px rgba(255, 255, 255, 0.4),
    inset 0 -1px 2px rgba(0, 0, 0, 0.1);
}

.bow-hair {
  position: absolute;
  top: 50%;
  left: 35px;
  right: 35px;
  height: 2px;
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-50%);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.2),
    inset 0 0.5px 1px rgba(255, 255, 255, 0.6);
  border-radius: 1px;
}

.bow-frog {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 30px;
  height: 18px;
  background: linear-gradient(135deg, #424242, #2e2e2e);
  border-radius: 9px;
  box-shadow: 
    inset 0 2px 3px rgba(255, 255, 255, 0.2),
    0 3px 6px rgba(0, 0, 0, 0.2);
}

.bow-tip {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 22px;
  height: 12px;
  background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
  border-radius: 6px;
  box-shadow: 
    inset 0 2px 3px rgba(255, 255, 255, 0.4),
    0 3px 6px rgba(0, 0, 0, 0.1);
}

/* 드래그 가이드 */
.drag-guide {
  margin-top: 24px;
  background: var(--color-bg-card);
  border-radius: 20px;
  padding: 24px;
  border: 2px solid var(--color-border-soft);
  box-shadow: 
    0 8px 20px var(--color-shadow-soft),
    inset 0 2px 4px var(--color-bg-elevated);
  text-align: center;
}

.rhythm-guide h4 {
  text-align: center;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  font-size: 1.1rem;
  font-weight: 600;
}

.rhythm-pattern {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.rhythm-note {
  padding: 12px 16px;
  border: 2px solid var(--color-border-soft);
  border-radius: 12px;
  background: var(--color-bg-button);
  color: var(--color-text-primary);
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  min-width: 40px;
  text-align: center;
}

.rhythm-note.active {
  background: var(--color-bg-accent);
  color: var(--color-text-accent);
  transform: scale(1.1);
  animation: noteHighlight 0.5s ease;
}

.rhythm-note.completed {
  background: var(--color-string-a);
  border-color: var(--color-border-hover);
}

@keyframes noteHighlight {
  0%, 100% { transform: scale(1.1); }
  50% { transform: scale(1.2); }
}

.rhythm-controls {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 16px;
}

.rhythm-btn {
  padding: 12px 20px;
  border: 2px solid #ddd;
  border-radius: 12px;
  background: white;
  color: #333;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.rhythm-btn:hover {
  transform: translateY(-2px);
  border-color: #007bff;
  background: #f8f9fa;
}

.rhythm-btn.start {
  background: #28a745;
  color: white;
  border-color: #28a745;
}

.rhythm-progress {
  text-align: center;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-border-soft);
  border-radius: 4px;
  margin-bottom: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px var(--color-shadow-soft);
}

.progress-fill {
  height: 100%;
  background: var(--color-bg-accent);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.9rem;
  color: var(--color-text-primary);
  font-weight: 600;
}


/* 반응형 디자인 */
@media (max-width: 768px) {
  .violin-stats {
    flex-direction: column;
    gap: 16px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    max-width: 200px;
    margin: 0 auto;
  }
  
  .violin-container {
    flex-direction: column;
    gap: 20px;
    min-height: 300px;
  }
  
  .violin-shape {
    width: 140px;
    height: 320px;
  }
  
  .violin-bow {
    width: 180px;
    height: 16px;
  }
  
  .song-buttons {
    grid-template-columns: 1fr;
  }
  
  .rhythm-pattern {
    gap: 6px;
  }
  
  .rhythm-note {
    padding: 8px 12px;
    font-size: 1rem;
    min-width: 35px;
  }
  
}

@media (max-width: 480px) {
  .violin-shape {
    width: 120px;
    height: 280px;
  }
  
  .violin-bow {
    width: 150px;
    height: 14px;
  }
  
  .practice-mode-selector {
    flex-direction: column;
    align-items: center;
  }
  
  .mode-btn {
    width: 200px;
  }
  
  .rhythm-controls {
    flex-direction: column;
    align-items: center;
  }
  
  .rhythm-btn {
    width: 150px;
  }
}

/* 활 사용 가이드 */
.bow-guide {
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 40;
}

.guide-text {
  background: var(--color-bg-button);
  color: var(--color-text-primary);
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  border: 2px solid var(--color-border-soft);
  box-shadow: 
    0 4px 12px var(--color-shadow-soft),
    inset 0 2px 4px var(--color-bg-elevated);
  animation: guideFloat 2s ease-in-out infinite;
  white-space: nowrap;
}

.guide-arrow {
  font-size: 1.5rem;
  margin-top: 5px;
  animation: arrowBounce 1s ease-in-out infinite;
}

@keyframes guideFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
}

@keyframes arrowBounce {
  0%, 100% { transform: translateY(0px) scale(1); }
  50% { transform: translateY(-3px) scale(1.1); }
}

/* 드래그 영역 표시 */
.bow-drag-area {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 25;
}

.drag-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 3px dashed rgba(255, 215, 0, 0.6);
  border-radius: 50%;
  animation: dragPulse 1s ease-in-out infinite;
}

@keyframes dragPulse {
  0%, 100% { 
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.6;
  }
  50% { 
    transform: translate(-50%, -50%) scale(1.1);
    opacity: 0.9;
  }
}

/* 터치 최적화 (3세 아이용으로 대폭 확대) */
@media (hover: none) and (pointer: coarse) {
  .violin-string {
    width: 12px;
    min-height: 520px;
  }
  
  .string-touch-area {
    top: -20px;
    left: -25px;
    right: -25px;
    bottom: -20px;
  }
  
  .violin-bow {
    padding: 25px;
    width: 420px;
    height: 40px;
  }
  
  .mode-btn,
  .song-btn,
  .rhythm-btn {
    min-height: 54px;
    padding: 16px 20px;
    font-size: 1.1rem;
  }
  
  .violin-string:hover {
    transform: scale(1);
  }
  
  .violin-string:active {
    transform: scale(1.2);
  }
}

.drag-guide h4 {
  margin-bottom: 12px;
  color: var(--color-text-primary);
  font-size: 1.2rem;
  font-weight: 600;
}

.drag-instruction {
  margin-bottom: 16px;
  color: var(--color-text-secondary);
  font-size: 0.95rem;
  line-height: 1.4;
  background: var(--color-bg-elevated);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border-soft);
}

.song-progress {
  margin-bottom: 16px;
}

.current-note {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  background: var(--color-string-a);
  border: 2px solid var(--color-border-soft);
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 8px var(--color-shadow-soft);
}

.note-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.note-display {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  background: var(--color-bg-button);
  padding: 8px 16px;
  border-radius: 12px;
  border: 2px solid var(--color-border-soft);
  box-shadow: 0 2px 6px var(--color-shadow-soft);
  min-width: 60px;
  text-align: center;
}
</style>