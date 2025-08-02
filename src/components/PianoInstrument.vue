<template>
  <div class="piano-instrument">
    <!-- 가이드 모드 표시 -->
    <div v-if="playMode === 'guide'" class="guide-display">
      <div class="guide-info">
        <h3 class="guide-title">🌟 반짝반짝 작은별</h3>
        <p class="guide-instruction">
          <span v-if="!isPlaying">{{ guideStep + 1 }}/{{ guideSequence.length }} 번째 음을 눌러보세요!</span>
          <span v-else>잘했어요! 다음 음을 눌러보세요.</span>
        </p>
        <div class="guide-progress">
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: (guideStep / guideSequence.length * 100) + '%' }"
            ></div>
          </div>
          <span class="progress-text">{{ guideStep }}/{{ guideSequence.length }}</span>
        </div>
      </div>
      <button @click="resetGuide" class="guide-reset-btn">
        🔄 처음부터
      </button>
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
          :style="{ left: key.position + '%' }"
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
          :style="{ left: key.position + '%' }"
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMusic } from '@/composables/useMusic';

interface PianoKey {
  note: string;
  label: string;
  position: number;
  isBlack: boolean;
}

const props = defineProps<{
  playMode: 'free' | 'guide';
}>();

const music = useMusic();
const pressedKeys = ref<Set<string>>(new Set());
const pianoKeyboard = ref<HTMLElement>();

// 반짝반짝 작은별 가이드 시퀀스 (C4 기준)
const guideSequence = ref(['C', 'C', 'G', 'G', 'A', 'A', 'G', 'F', 'F', 'E', 'E', 'D', 'D', 'C']);
const guideStep = ref(0);
const isPlaying = ref(false);

// 흰 건반 정의 (C4~B4)
const whiteKeys: PianoKey[] = [
  { note: 'C', label: '도', position: 0, isBlack: false },
  { note: 'D', label: '레', position: 14.3, isBlack: false },
  { note: 'E', label: '미', position: 28.6, isBlack: false },
  { note: 'F', label: '파', position: 42.9, isBlack: false },
  { note: 'G', label: '솔', position: 57.1, isBlack: false },
  { note: 'A', label: '라', position: 71.4, isBlack: false },
  { note: 'B', label: '시', position: 85.7, isBlack: false }
];

// 검은 건반 정의
const blackKeys: PianoKey[] = [
  { note: 'C#', label: '도#', position: 10.2, isBlack: true },
  { note: 'D#', label: '레#', position: 21.4, isBlack: true },
  { note: 'F#', label: '파#', position: 50, isBlack: true },
  { note: 'G#', label: '솔#', position: 64.3, isBlack: true },
  { note: 'A#', label: '라#', position: 78.6, isBlack: true }
];

// 연주 통계
const playStats = computed(() => music.getPlayStats.value);

/**
 * 건반 눌림 처리
 */
const handleKeyPress = (key: PianoKey) => {
  if (pressedKeys.value.has(key.note)) return;
  
  pressedKeys.value.add(key.note);
  music.playPianoNote(key.note, 4);
  
  // 가이드 모드 처리
  if (props.playMode === 'guide') {
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
 * 가이드 모드 처리
 */
const handleGuideMode = (pressedNote: string) => {
  const expectedNote = guideSequence.value[guideStep.value];
  
  if (pressedNote === expectedNote) {
    // 올바른 음을 눌렀을 때
    isPlaying.value = true;
    guideStep.value++;
    
    // 완주했을 때
    if (guideStep.value >= guideSequence.value.length) {
      setTimeout(() => {
        alert('🌟 축하합니다! 반짝반짝 작은별을 완주했어요!');
        resetGuide();
      }, 500);
    }
    
    setTimeout(() => {
      isPlaying.value = false;
    }, 800);
  } else {
    // 틀린 음을 눌렀을 때
    console.log('❌ Wrong note! Expected:', expectedNote, 'Got:', pressedNote);
  }
};

/**
 * 가이드 초기화
 */
const resetGuide = () => {
  guideStep.value = 0;
  isPlaying.value = false;
};

/**
 * 현재 가이드에서 눌러야 할 키인지 확인
 */
const isGuideKey = (note: string): boolean => {
  if (props.playMode !== 'guide') return false;
  return guideSequence.value[guideStep.value] === note;
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
  console.log('✨ Animating key:', note);
};

/**
 * 키보드 이벤트 처리 (물리 키보드)
 */
const handleKeyboardEvent = (event: KeyboardEvent) => {
  const keyMap: { [key: string]: string } = {
    'a': 'C', 's': 'D', 'd': 'E', 'f': 'F', 'g': 'G', 'h': 'A', 'j': 'B',
    'w': 'C#', 'e': 'D#', 't': 'F#', 'y': 'G#', 'u': 'A#'
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
  const keyMap: { [key: string]: string } = {
    'a': 'C', 's': 'D', 'd': 'E', 'f': 'F', 'g': 'G', 'h': 'A', 'j': 'B',
    'w': 'C#', 'e': 'D#', 't': 'F#', 'y': 'G#', 'u': 'A#'
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
  // 키보드 이벤트 리스너 추가
  window.addEventListener('keydown', handleKeyboardEvent);
  window.addEventListener('keyup', handleKeyboardUp);
});

onUnmounted(() => {
  // 키보드 이벤트 리스너 제거
  window.removeEventListener('keydown', handleKeyboardEvent);
  window.removeEventListener('keyup', handleKeyboardUp);
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
  background: linear-gradient(135deg, #ffeaa7, #fdcb6e);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 6px 20px rgba(253, 203, 110, 0.3);
}

.guide-info {
  flex: 1;
}

.guide-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 8px;
}

.guide-instruction {
  font-size: 1rem;
  color: #636e72;
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
  background: rgba(255, 255, 255, 0.5);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #00b894, #00cec9);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: #2d3436;
  min-width: 40px;
}

.guide-reset-btn {
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid transparent;
  border-radius: 12px;
  color: #2d3436;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.guide-reset-btn:hover {
  background: white;
  border-color: #fdcb6e;
  transform: translateY(-2px);
}

/* 피아노 키보드 */
.piano-keyboard {
  position: relative;
  width: 100%;
  height: 200px;
  background: linear-gradient(180deg, #2d3436, #636e72);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* 흰 건반 */
.white-keys {
  position: relative;
  width: 100%;
  height: 100%;
}

.white-key {
  position: absolute;
  width: 13.5%;
  height: 100%;
  background: linear-gradient(180deg, #ffffff, #f8f9fa);
  border: 2px solid #dee2e6;
  border-radius: 0 0 8px 8px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 16px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.white-key:hover {
  background: linear-gradient(180deg, #f8f9fa, #e9ecef);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.white-key.active {
  background: linear-gradient(180deg, #74b9ff, #0984e3);
  color: white;
  transform: translateY(4px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.white-key.guide {
  animation: guidePulse 1.5s ease-in-out infinite;
}

@keyframes guidePulse {
  0%, 100% { 
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
  50% { 
    box-shadow: 0 0 0 4px rgba(116, 185, 255, 0.6), 0 4px 8px rgba(0, 0, 0, 0.1);
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
  width: 8%;
  height: 100%;
  background: linear-gradient(180deg, #2d3436, #000000);
  border: 1px solid #000000;
  border-radius: 0 0 6px 6px;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 12px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  pointer-events: auto;
  z-index: 2;
}

.black-key:hover {
  background: linear-gradient(180deg, #636e72, #2d3436);
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.5);
}

.black-key.active {
  background: linear-gradient(180deg, #fd79a8, #e84393);
  transform: translateY(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.black-key.guide {
  animation: guideBlackPulse 1.5s ease-in-out infinite;
}

@keyframes guideBlackPulse {
  0%, 100% { 
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 4px rgba(253, 121, 168, 0.8), 0 4px 8px rgba(0, 0, 0, 0.4);
  }
}

/* 건반 라벨 */
.key-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #636e72;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.black-key .key-label {
  color: #ddd;
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
  background: radial-gradient(circle, rgba(116, 185, 255, 0.4), transparent);
  border-radius: inherit;
  animation: glowPulse 1.5s ease-in-out infinite;
  pointer-events: none;
}

.black-key .guide-glow {
  background: radial-gradient(circle, rgba(253, 121, 168, 0.6), transparent);
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
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  color: #636e72;
  font-weight: 500;
}

.stat-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: #2d3436;
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
    gap: 12px;
  }
  
  .stat-item {
    flex-direction: row;
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