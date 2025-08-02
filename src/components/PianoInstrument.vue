<template>
  <div class="piano-instrument">
    <!-- 가이드 모드 표시 -->
    <div v-if="playMode === 'guide'" class="guide-display">
      <div class="guide-info">
        <h3 class="guide-title">{{ selectedSong?.title }}</h3>
        <p class="guide-instruction">
          <span v-if="!isAutoPlaying">{{ guideStep + 1 }}/{{ selectedSong?.notes.length }} 번째 음을 눌러보세요!</span>
          <span v-else>자동 연주 중...</span>
        </p>
        <div class="guide-progress">
          <div 
            class="progress-bar"
          >
            <div 
              class="progress-fill" 
              :style="{ width: (guideStep / (selectedSong?.notes.length || 1) * 100) + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ guideStep }}/{{ selectedSong?.notes.length }}</span>
        </div>
      </div>
      <div class="guide-controls">
        <select v-model="selectedSong" class="song-select">
          <option v-for="song in songs" :key="song.id" :value="song">{{ song.title }}</option>
        </select>
        <button @click="startAutoPlay" :disabled="isAutoPlaying" class="guide-btn auto-play-btn">
          자동 연주
        </button>
        <button @click="stopAutoPlay" :disabled="!isAutoPlaying" class="guide-btn stop-auto-play-btn">
          정지
        </button>
        <button @click="resetGuide" class="guide-btn reset-btn">
          처음부터
        </button>
      </div>
    </div>

    <!-- 피아노 키보드 -->
    <div class="piano-keyboard" ref="pianoKeyboard">
      <!-- 흰 건반들 -->
      <div class="white-keys">
        <button
          v-for="key in whiteKeys"
          :key="key.note"
          @mousedown="handleKeyPress(key)"
          @mouseup="handleKeyRelease(key)"
          @mouseleave="handleKeyRelease(key)"
          @touchstart="handleKeyPress(key)"
          @touchend="handleKeyRelease(key)"
          class="piano-key white-key"
          :class="{
            active: pressedKeys.has(key.note),
            highlight: shouldHighlightKey(key.note),
            guide: isGuideKey(key.note)
          }"
          :style="{ left: key.position + '%', width: WHITE_KEY_WIDTH_PERCENT + '%' }"
        >
          <span class="key-label">{{ key.label }}</span>
          <div v-if="isGuideKey(key.note)" class="guide-glow"></div>
        </button>
      </div>

      <!-- 검은 건반들 -->
      <div class="black-keys">
        <button
          v-for="key in blackKeys"
          :key="key.note"
          @mousedown="handleKeyPress(key)"
          @mouseup="handleKeyRelease(key)"
          @mouseleave="handleKeyRelease(key)"
          @touchstart="handleKeyPress(key)"
          @touchend="handleKeyRelease(key)"
          class="piano-key black-key"
          :class="{
            active: pressedKeys.has(key.note),
            highlight: shouldHighlightKey(key.note),
            guide: isGuideKey(key.note)
          }"
          :style="{ left: key.position + '%', width: BLACK_KEY_WIDTH_PERCENT + '%' }"
        >
          <span class="key-label">{{ key.label }}</span>
          <div v-if="isGuideKey(key.note)" class="guide-glow"></div>
        </button>
      </div>
    </div>

    <!-- 연주 통계 -->
    <div class="piano-stats">
      <div class="stat-item">
        <span class="stat-label">연주한 음</span>
        <span class="stat-value">{{ playStats.totalNotes }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">다양한 음</span>
        <span class="stat-value">{{ playStats.uniqueNotes }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">연주 시간</span>
        <span class="stat-value">{{ playStats.playDuration }}초</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useMusic } from '@/composables/useMusic';

interface PianoKey {
  note: string;
  label: string;
  position: number;
  isBlack: boolean;
  octave: number;
}

const props = defineProps<{
  playMode: 'free' | 'guide';
}>();

const music = useMusic();
const pressedKeys = ref<Set<string>>(new Set());
const pianoKeyboard = ref<HTMLElement>();

const guideStep = ref(0);
const isPlaying = ref(false);
const autoPlayIndex = ref(0);
const autoPlayTimer = ref<NodeJS.Timeout | null>(null);
const isAutoPlaying = ref(false);

const WHITE_KEY_WIDTH_PERCENT = 100 / 12;
const BLACK_KEY_WIDTH_PERCENT = WHITE_KEY_WIDTH_PERCENT * 0.6; // 검은 건반 너비 조정
const BLACK_KEY_OFFSET_PERCENT = WHITE_KEY_WIDTH_PERCENT * 0.65; // 검은 건반 위치 조정

// 흰 건반 정의 (C3~G4, 총 12개)
const whiteKeys: PianoKey[] = [
  { note: 'C3', label: '도', position: 0 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 3 },
  { note: 'D3', label: '레', position: 1 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 3 },
  { note: 'E3', label: '미', position: 2 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 3 },
  { note: 'F3', label: '파', position: 3 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 3 },
  { note: 'G3', label: '솔', position: 4 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 3 },
  { note: 'A3', label: '라', position: 5 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 3 },
  { note: 'B3', label: '시', position: 6 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 3 },
  { note: 'C4', label: '도', position: 7 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 4 },
  { note: 'D4', label: '레', position: 8 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 4 },
  { note: 'E4', label: '미', position: 9 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 4 },
  { note: 'F4', label: '파', position: 10 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 4 },
  { note: 'G4', label: '솔', position: 11 * WHITE_KEY_WIDTH_PERCENT, isBlack: false, octave: 4 },
];

// 검은 건반 정의 (총 9개)
const blackKeys: PianoKey[] = [
  { note: 'C#3', label: '도#', position: 0 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 3 },
  { note: 'D#3', label: '레#', position: 1 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 3 },
  { note: 'F#3', label: '파#', position: 3 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 3 },
  { note: 'G#3', label: '솔#', position: 4 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 3 },
  { note: 'A#3', label: '라#', position: 5 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 3 },

  { note: 'C#4', label: '도#', position: 7 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 4 },
  { note: 'D#4', label: '레#', position: 8 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 4 },
  { note: 'F#4', label: '파#', position: 10 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 4 },
  { note: 'G#4', label: '솔#', position: 11 * WHITE_KEY_WIDTH_PERCENT + BLACK_KEY_OFFSET_PERCENT, isBlack: true, octave: 4 },
];

interface Song {
  id: string;
  title: string;
  notes: string[];
  bpm: number; // Beats per minute for auto-play speed
}

const songs: Song[] = [
  {
    id: 'twinkle',
    title: '반짝반짝 작은별',
    notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
    bpm: 120
  },
  {
    id: 'mary',
    title: '메리에게 작은 양이 있었네',
    notes: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'D4', 'D4', 'D4', 'E4', 'G4', 'G4', 'E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'C4'],
    bpm: 100
  },
  {
    id: 'oldmacdonald',
    title: '올드 맥도날드',
    notes: ['C4', 'C4', 'C4', 'G3', 'A3', 'A3', 'G3', 'E4', 'E4', 'D4', 'D4', 'C4'],
    bpm: 110
  },
  {
    id: 'alphabet',
    title: '알파벳 노래',
    notes: ['C4', 'G3', 'G3', 'A3', 'A3', 'G3', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
    bpm: 100
  },
  {
    id: 'rowrow',
    title: 'Row, Row, Row Your Boat',
    notes: ['C4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'E4', 'F4', 'G4', 'C4', 'G3', 'E3', 'C3'],
    bpm: 130
  },
  {
    id: 'happpybirthday',
    title: '생일 축하합니다',
    notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'C4', 'C4', 'D4', 'C4', 'G4', 'F4', 'C4', 'C4', 'C5', 'A4', 'F4', 'E4', 'D4', 'A#4', 'A#4', 'A4', 'F4', 'G4', 'F4'],
    bpm: 90
  },
  {
    id: 'jinglebells',
    title: '징글벨',
    notes: ['E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'E4', 'G4', 'C4', 'D4', 'E4', 'F4', 'F4', 'F4', 'F4', 'F4', 'E4', 'E4', 'E4', 'E4', 'D4', 'D4', 'E4', 'D4', 'G4'],
    bpm: 120
  },
  {
    id: 'londonbridge',
    title: '런던 다리',
    notes: ['G4', 'A4', 'G4', 'F4', 'E4', 'F4', 'G4', 'D4', 'E4', 'F4', 'E4', 'F4', 'G4', 'G4', 'D4', 'E4', 'F4', 'E4', 'F4', 'G4'],
    bpm: 110
  }
];

const selectedSong = ref<Song | null>(songs[0]); // Default to the first song

// 연주 통계
const playStats = computed(() => music.getPlayStats.value);

/**
 * 건반 눌림 처리
 */
const handleKeyPress = async (key: PianoKey) => {
  if (pressedKeys.value.has(key.note)) return;
  
  pressedKeys.value.add(key.note);
  
  try {
    // 오디오 활성화 및 음 재생
    await music.ensureAudioActive();
    await music.playPianoNote(key.note); // key.note는 이미 'C3', 'D4' 형태
    console.log('🎹 Successfully played note:', key.note, key.label);
  } catch (error) {
    console.error('❌ Failed to play piano note:', error);
  }
  
  // 가이드 모드 처리
  if (props.playMode === 'guide' && !isAutoPlaying.value) {
    handleGuideMode(key.note);
  }
  
  // 시각적 피드백
  animateKeyPress(key.note);
  
  console.log('🎹 Key pressed:', key.note, key.label);
};

/**
 * 건반 뗌 처리
 */
const handleKeyRelease = (key: PianoKey) => {
  pressedKeys.value.delete(key.note);
};

/**
 * 가이드 모드 처리 (수동 연주)
 */
const handleGuideMode = (pressedNote: string) => {
  if (!selectedSong.value) return;

  const expectedNote = selectedSong.value.notes[guideStep.value];
  
  if (pressedNote === expectedNote) {
    isPlaying.value = true;
    guideStep.value++;
    
    if (guideStep.value >= selectedSong.value.notes.length) {
      setTimeout(() => {
        alert('🌟 축하합니다! 곡을 완주했어요!');
        resetGuide();
      }, 500);
    }
    
    setTimeout(() => {
      isPlaying.value = false;
    }, 800);
  } else {
    console.log('❌ Wrong note! Expected:', expectedNote, 'Got:', pressedNote);
  }
};

/**
 * 가이드 초기화
 */
const resetGuide = () => {
  guideStep.value = 0;
  isPlaying.value = false;
  stopAutoPlay();
};

/**
 * 현재 가이드에서 눌러야 할 키인지 확인
 */
const isGuideKey = (note: string): boolean => {
  if (props.playMode !== 'guide' || !selectedSong.value || isAutoPlaying.value) return false;
  return selectedSong.value.notes[guideStep.value] === note;
};

/**
 * 키 하이라이트 여부
 */
const shouldHighlightKey = (note: string): boolean => {
  return pressedKeys.value.has(note) || isGuideKey(note);
};

/**
 * 키 눌림 애니메이션
 */
const animateKeyPress = (note: string) => {
  // 파티클 효과나 추가 애니메이션을 여기에 추가할 수 있음
  // console.log('✨ Animating key:', note);
};

/**
 * 자동 연주 시작
 */
const startAutoPlay = () => {
  if (!selectedSong.value || isAutoPlaying.value) return;
  
  isAutoPlaying.value = true;
  autoPlayIndex.value = 0;
  guideStep.value = 0; // Reset guide step for auto-play
  
  const noteDuration = 60000 / selectedSong.value.bpm; // Milliseconds per beat
  
  autoPlayTimer.value = setInterval(async () => {
    if (autoPlayIndex.value < selectedSong.value!.notes.length) {
      const noteToPlay = selectedSong.value!.notes[autoPlayIndex.value];
      const key = [...whiteKeys, ...blackKeys].find(k => k.note === noteToPlay);
      if (key) {
        // Simulate key press
        pressedKeys.value.add(key.note);
        try {
          await music.ensureAudioActive();
          await music.playPianoNote(key.note); // key.note는 이미 'C3', 'D4' 형태
        } catch (error) {
          console.error('❌ Auto-play failed:', error);
        }
        animateKeyPress(key.note);
        
        // Simulate key release after a short delay
        setTimeout(() => {
          pressedKeys.value.delete(key.note);
        }, noteDuration * 0.8); // Key held for 80% of duration
      }
      autoPlayIndex.value++;
    } else {
      stopAutoPlay();
      alert('🎶 자동 연주가 완료되었습니다!');
    }
  }, noteDuration);
};

/**
 * 자동 연주 중지
 */
const stopAutoPlay = () => {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
  isAutoPlaying.value = false;
  pressedKeys.value.clear(); // Clear any lingering pressed states
};

/**
 * 키보드 이벤트 처리 (물리 키보드)
 */
const handleKeyboardEvent = (event: KeyboardEvent) => {
  if (isAutoPlaying.value) return; // Disable manual input during auto-play

  const keyMap: { [key: string]: string } = {
    'a': 'C3', 's': 'D3', 'd': 'E3', 'f': 'F3', 'g': 'G3', 'h': 'A3', 'j': 'B3',
    'k': 'C4', 'l': 'D4', ';': 'E4', '\'': 'F4', 'z': 'G4',
    'w': 'C#3', 'e': 'D#3', 't': 'F#3', 'y': 'G#3', 'u': 'A#3',
    'o': 'C#4', 'p': 'D#4', '[': 'F#4', ']': 'G#4',
  };
  
  const note = keyMap[event.key.toLowerCase()];
  if (note && !pressedKeys.value.has(note)) {
    const key = [...whiteKeys, ...blackKeys].find(k => k.note === note);
    if (key) {
      handleKeyPress(key);
    }
  }
};

const handleKeyboardUp = (event: KeyboardEvent) => {
  if (isAutoPlaying.value) return; // Disable manual input during auto-play

  const keyMap: { [key: string]: string } = {
    'a': 'C3', 's': 'D3', 'd': 'E3', 'f': 'F3', 'g': 'G3', 'h': 'A3', 'j': 'B3',
    'k': 'C4', 'l': 'D4', ';': 'E4', '\'': 'F4', 'z': 'G4',
    'w': 'C#3', 'e': 'D#3', 't': 'F#3', 'y': 'G#3', 'u': 'A#3',
    'o': 'C#4', 'p': 'D#4', '[': 'F#4', ']': 'G#4',
  };
  
  const note = keyMap[event.key.toLowerCase()];
  if (note) {
    const key = [...whiteKeys, ...blackKeys].find(k => k.note === note);
    if (key) {
      handleKeyRelease(key);
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyboardEvent);
  window.addEventListener('keyup', handleKeyboardUp);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboardEvent);
  window.removeEventListener('keyup', handleKeyboardUp);
  stopAutoPlay(); // Ensure auto-play stops when component is unmounted
});

watch(selectedSong, () => {
  resetGuide(); // Reset guide when song changes
});

</script>

<style scoped>
.piano-instrument {
  display: flex;
  flex-direction: column;
  gap: 24px;
  user-select: none;
}

/* 가이드 표시 */
.guide-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--color-bg-card);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.guide-info {
  flex: 1;
}

.guide-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.guide-instruction {
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.guide-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 40px;
}

.guide-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 20px;
}

.song-select {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  cursor: pointer;
}

.guide-btn {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.guide-btn:hover:not(:disabled) {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.guide-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.auto-play-btn {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.auto-play-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  border-color: var(--color-primary-dark);
}

.stop-auto-play-btn {
  background: var(--color-danger);
  color: white;
  border-color: var(--color-danger);
}

.stop-auto-play-btn:hover:not(:disabled) {
  background: var(--color-danger-dark);
  border-color: var(--color-danger-dark);
}

.reset-btn {
  background: var(--color-info);
  color: white;
  border-color: var(--color-info);
}

.reset-btn:hover:not(:disabled) {
  background: var(--color-info-dark);
  border-color: var(--color-info-dark);
}

/* 피아노 키보드 */
.piano-keyboard {
  position: relative;
  width: 100%;
  height: 200px;
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 12px;
  box-shadow: var(--shadow-lg);
}

/* 흰 건반 */
.white-keys {
  position: relative;
  width: 100%;
  height: 100%;
}

.white-key {
  position: absolute;
  height: 100%;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 0 0 8px 8px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 16px;
  box-shadow: var(--shadow-md);
}

.white-key:hover {
  background: var(--color-bg-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.white-key.active {
  background: var(--color-primary);
  color: white;
  transform: translateY(4px);
  box-shadow: var(--shadow-active);
}

.white-key.guide {
  animation: guidePulse 1.5s ease-in-out infinite;
}

@keyframes guidePulse {
  0%, 100% { 
    box-shadow: var(--shadow-md);
  }
  50% { 
    box-shadow: 0 0 0 4px var(--color-primary-light), var(--shadow-md);
  }
}

/* 검은 건반 */
.black-keys {
  position: absolute;
  top: 12px;
  left: 12px;
  width: calc(100% - 24px);
  height: 60%;
  pointer-events: none;
}

.black-key {
  position: absolute;
  height: 100%;
  background: var(--color-text-primary);
  border: 1px solid var(--color-text-primary);
  border-radius: 0 0 6px 6px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 12px;
  box-shadow: var(--shadow-dark);
  pointer-events: auto;
  z-index: 2;
}

.black-key:hover {
  background: var(--color-text-secondary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-dark-hover);
}

.black-key.active {
  background: var(--color-accent);
  transform: translateY(2px);
  box-shadow: var(--shadow-dark-active);
}

.black-key.guide {
  animation: guideBlackPulse 1.5s ease-in-out infinite;
}

@keyframes guideBlackPulse {
  0%, 100% { 
    box-shadow: var(--shadow-dark);
  }
  50% { 
    box-shadow: 0 0 0 4px var(--color-accent-light), var(--shadow-dark);
  }
}

/* 건반 라벨 */
.key-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.black-key .key-label {
  color: var(--color-bg-card);
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
}

.white-key.active .key-label,
.black-key.active .key-label {
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}

/* 가이드 글로우 효과 */
.guide-glow {
  position: absolute;
  top: -4px;
  left: -4px;
  right: -4px;
  bottom: -4px;
  background: radial-gradient(circle, var(--color-primary-light), transparent);
  border-radius: inherit;
  animation: glowPulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

.black-key .guide-glow {
  background: radial-gradient(circle, var(--color-accent-light), transparent);
}

@keyframes glowPulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

/* 연주 통계 */
.piano-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 16px;
  box-shadow: var(--shadow-card);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .piano-keyboard {
    height: 150px;
  }
  
  .guide-display {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .piano-stats {
    gap: 20px;
  }
  
  .key-label {
    font-size: 0.8rem;
  }
}

@media (max-width: 480px) {
  .piano-keyboard {
    height: 120px;
    padding: 8px;
  }
  
  .white-key {
    padding-bottom: 8px;
  }
  
  .black-key {
    padding-bottom: 6px;
  }
  
  .key-label {
    font-size: 0.7rem;
  }
  
  .piano-stats {
    flex-direction: column;
    justify-content: space-between;
  }
}

/* 터치 최적화 */
@media (hover: none) and (pointer: coarse) {
  .piano-key {
    min-height: 44px;
  }
  
  .white-key {
    border-width: 3px;
  }
  
  .black-key {
    border-width: 2px;
  }
  
  .piano-key:active {
    transition: none;
  }
}
</style>