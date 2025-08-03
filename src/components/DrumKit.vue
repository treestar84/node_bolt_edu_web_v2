<template>
  <div class="drum-kit">
    <!-- 드럼 통계 -->
    <div class="drum-stats">
      <div class="stat-item">
        <span class="stat-label">두드린 횟수</span>
        <span class="stat-value">{{ playStats.totalNotes }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">다양한 소리</span>
        <span class="stat-value">{{ playStats.uniqueNotes }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">연주 시간</span>
        <span class="stat-value">{{ playStats.playDuration }}초</span>
      </div>
    </div>

    <!-- 실제 드럼세트 레이아웃 -->
    <div class="drum-set-container">
      <!-- 실제 드럼세트 -->
      <div class="real-drum-set">
        <h3 class="section-title">🥁 드럼세트</h3>
        
        <!-- 드럼세트 전체 배경 -->
        <div class="drum-stage">
          <!-- 뒷줄: 심벌, 라이드, 하이햇 -->
          <div class="drum-row back-row">
            <!-- 심벌 (좌측 상단) -->
            <div class="drum-item cymbal-container">
              <button
                @mousedown="handleDrumPress(basicDrums[3])"
                @mouseup="handleDrumRelease(basicDrums[3])"
                @mouseleave="handleDrumRelease(basicDrums[3])"
                @touchstart="handleDrumPress(basicDrums[3])"
                @touchend="handleDrumRelease(basicDrums[3])"
                class="drum-element cymbal"
                :class="{ active: pressedPads.has('cymbal') }"
              >
                <div class="cymbal-surface">
                  <div class="cymbal-center"></div>
                  <div class="cymbal-rings"></div>
                  <span class="drum-label">크래시</span>
                </div>
                <div class="cymbal-stand"></div>
                <div class="drum-glow" v-if="pressedPads.has('cymbal')"></div>
              </button>
            </div>

            <!-- 라이드 (중앙 상단) -->
            <div class="drum-item ride-container">
              <button
                @mousedown="handleDrumPress(basicDrums[7])"
                @mouseup="handleDrumRelease(basicDrums[7])"
                @mouseleave="handleDrumRelease(basicDrums[7])"
                @touchstart="handleDrumPress(basicDrums[7])"
                @touchend="handleDrumRelease(basicDrums[7])"
                class="drum-element ride"
                :class="{ active: pressedPads.has('ride') }"
              >
                <div class="ride-surface">
                  <div class="ride-center"></div>
                  <div class="ride-rings"></div>
                  <span class="drum-label">라이드</span>
                </div>
                <div class="ride-stand"></div>
                <div class="drum-glow" v-if="pressedPads.has('ride')"></div>
              </button>
            </div>

            <!-- 하이햇 (우측 상단) -->
            <div class="drum-item hihat-container">
              <button
                @mousedown="handleDrumPress(basicDrums[2])"
                @mouseup="handleDrumRelease(basicDrums[2])"
                @mouseleave="handleDrumRelease(basicDrums[2])"
                @touchstart="handleDrumPress(basicDrums[2])"
                @touchend="handleDrumRelease(basicDrums[2])"
                class="drum-element hihat"
                :class="{ active: pressedPads.has('hihat') }"
              >
                <div class="hihat-top"></div>
                <div class="hihat-bottom"></div>
                <div class="hihat-stand"></div>
                <span class="drum-label">하이햇</span>
                <div class="drum-glow" v-if="pressedPads.has('hihat')"></div>
              </button>
            </div>
          </div>

          <!-- 중간줄: 하이톰, 스네어, 미드톰 -->
          <div class="drum-row middle-row">
            <!-- 하이톰 (좌측) -->
            <div class="drum-item tom-container">
              <button
                @mousedown="handleDrumPress(basicDrums[4])"
                @mouseup="handleDrumRelease(basicDrums[4])"
                @mouseleave="handleDrumRelease(basicDrums[4])"
                @touchstart="handleDrumPress(basicDrums[4])"
                @touchend="handleDrumRelease(basicDrums[4])"
                class="drum-element tom tom1"
                :class="{ active: pressedPads.has('tom1') }"
              >
                <div class="tom-surface high-tom">
                  <div class="tom-rim"></div>
                  <div class="tom-head"></div>
                  <span class="drum-label">하이톰</span>
                </div>
                <div class="tom-mount"></div>
                <div class="drum-glow" v-if="pressedPads.has('tom1')"></div>
              </button>
            </div>

            <!-- 스네어 (중앙) -->
            <div class="drum-item snare-container">
              <button
                @mousedown="handleDrumPress(basicDrums[1])"
                @mouseup="handleDrumRelease(basicDrums[1])"
                @mouseleave="handleDrumRelease(basicDrums[1])"
                @touchstart="handleDrumPress(basicDrums[1])"
                @touchend="handleDrumRelease(basicDrums[1])"
                class="drum-element snare"
                :class="{ active: pressedPads.has('snare') }"
              >
                <div class="snare-surface">
                  <div class="snare-rim"></div>
                  <div class="snare-head"></div>
                  <span class="drum-label">스네어</span>
                </div>
                <div class="snare-stand"></div>
                <div class="drum-glow" v-if="pressedPads.has('snare')"></div>
              </button>
            </div>

            <!-- 미드톰 (우측) -->
            <div class="drum-item tom-container">
              <button
                @mousedown="handleDrumPress(basicDrums[5])"
                @mouseup="handleDrumRelease(basicDrums[5])"
                @mouseleave="handleDrumRelease(basicDrums[5])"
                @touchstart="handleDrumPress(basicDrums[5])"
                @touchend="handleDrumRelease(basicDrums[5])"
                class="drum-element tom tom2"
                :class="{ active: pressedPads.has('tom2') }"
              >
                <div class="tom-surface mid-tom">
                  <div class="tom-rim"></div>
                  <div class="tom-head"></div>
                  <span class="drum-label">미드톰</span>
                </div>
                <div class="tom-mount"></div>
                <div class="drum-glow" v-if="pressedPads.has('tom2')"></div>
              </button>
            </div>
          </div>

          <!-- 앞줄: 킥드럼과 플로어톰 -->
          <div class="drum-row front-row">
            <!-- 킥드럼 (중앙) -->
            <div class="drum-item kick-container">
              <button
                @mousedown="handleDrumPress(basicDrums[0])"
                @mouseup="handleDrumRelease(basicDrums[0])"
                @mouseleave="handleDrumRelease(basicDrums[0])"
                @touchstart="handleDrumPress(basicDrums[0])"
                @touchend="handleDrumRelease(basicDrums[0])"
                class="drum-element kick"
                :class="{ active: pressedPads.has('kick') }"
              >
                <div class="kick-drum">
                  <div class="kick-surface">
                    <div class="kick-hole"></div>
                    <span class="drum-label">킥드럼</span>
                  </div>
                  <div class="kick-legs"></div>
                </div>
                <div class="drum-glow" v-if="pressedPads.has('kick')"></div>
              </button>
            </div>

            <!-- 플로어톰 (우측) -->
            <div class="drum-item floor-tom-container">
              <button
                @mousedown="handleDrumPress(basicDrums[6])"
                @mouseup="handleDrumRelease(basicDrums[6])"
                @mouseleave="handleDrumRelease(basicDrums[6])"
                @touchstart="handleDrumPress(basicDrums[6])"
                @touchend="handleDrumRelease(basicDrums[6])"
                class="drum-element floor-tom"
                :class="{ active: pressedPads.has('floor-tom') }"
              >
                <div class="floor-tom-surface">
                  <div class="floor-tom-rim"></div>
                  <div class="floor-tom-head"></div>
                  <span class="drum-label">플로어톰</span>
                </div>
                <div class="floor-tom-legs"></div>
                <div class="drum-glow" v-if="pressedPads.has('floor-tom')"></div>
              </button>
            </div>
          </div>

          <!-- 귀여운 드럼스틱 -->
          <div class="drumsticks">
            <div class="drumstick left" :class="{ animate: pressedPads.size > 0 }">
              <div class="stick-body"></div>
              <div class="stick-tip"></div>
            </div>
            <div class="drumstick right" :class="{ animate: pressedPads.size > 0 }">
              <div class="stick-body"></div>
              <div class="stick-tip"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 재미있는 효과음 패널 -->
      <div class="fun-sounds-panel">
        <h3 class="section-title">🎪 재미있는 소리</h3>
        <div class="fun-sound-board">
          <button
            v-for="sound in funSounds"
            :key="sound.id"
            @mousedown="handleFunSoundPress(sound)"
            @mouseup="handleFunSoundRelease(sound)"
            @mouseleave="handleFunSoundRelease(sound)"
            @touchstart="handleFunSoundPress(sound)"
            @touchend="handleFunSoundRelease(sound)"
            class="fun-button"
            :class="{
              active: pressedPads.has(sound.id),
              [`btn-${sound.id}`]: true
            }"
          >
            <div class="fun-button-face" :style="{ backgroundColor: sound.color }">
              <span class="fun-icon">{{ sound.icon }}</span>
              <span class="fun-name">{{ sound.name }}</span>
              <div class="fun-sparkles" v-if="pressedPads.has(sound.id)">
                <span class="sparkle" v-for="i in 6" :key="i">✨</span>
              </div>
            </div>
            <div class="fun-button-shadow"></div>
          </button>
        </div>
      </div>
    </div>

    <!-- 키보드 가이드 -->
    <div class="keyboard-guide">
      <h4>⌨️ 키보드로도 연주할 수 있어요!</h4>
      <div class="key-mappings">
        <div class="key-group">
          <span class="key-title">드럼:</span>
          <span class="key-item">Space (킥)</span>
          <span class="key-item">S (스네어)</span>
          <span class="key-item">H (하이햇)</span>
          <span class="key-item">C (심벌)</span>
        </div>
        <div class="key-group">
          <span class="key-title">톰/라이드:</span>
          <span class="key-item">T (하이톰)</span>
          <span class="key-item">Y (미드톰)</span>
          <span class="key-item">F (플로어톰)</span>
          <span class="key-item">R (라이드)</span>
        </div>
        <div class="key-group">
          <span class="key-title">재미소리:</span>
          <span class="key-item">1~8 (효과음)</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMusic } from '@/composables/useMusic';
import { useCarSounds, type FunSound } from '@/composables/useCarSounds';

interface DrumPad {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'kick' | 'snare' | 'hihat' | 'cymbal' | 'tom1' | 'tom2' | 'floor-tom' | 'ride';
}

const music = useMusic();
const { funSounds, playFunSound } = useCarSounds();
const pressedPads = ref<Set<string>>(new Set());

// 확장된 드럼세트 패드들
const basicDrums: DrumPad[] = [
  { id: 'kick', name: '킥드럼', icon: '🥁', color: '#e74c3c', type: 'kick' },
  { id: 'snare', name: '스네어', icon: '🎯', color: '#f39c12', type: 'snare' },
  { id: 'hihat', name: '하이햇', icon: '🎵', color: '#3498db', type: 'hihat' },
  { id: 'cymbal', name: '크래시', icon: '🎪', color: '#9b59b6', type: 'cymbal' },
  { id: 'tom1', name: '하이톰', icon: '🟠', color: '#e67e22', type: 'tom1' },
  { id: 'tom2', name: '미드톰', icon: '🟡', color: '#f1c40f', type: 'tom2' },
  { id: 'floor-tom', name: '플로어톰', icon: '🟢', color: '#27ae60', type: 'floor-tom' },
  { id: 'ride', name: '라이드', icon: '🥈', color: '#95a5a6', type: 'ride' }
];

// 연주 통계
const playStats = computed(() => music.getPlayStats.value);

/**
 * 기본 드럼 패드 눌림 처리
 */
const handleDrumPress = async (drum: DrumPad) => {
  if (pressedPads.value.has(drum.id)) return;
  
  pressedPads.value.add(drum.id);
  
  try {
    // 오디오 활성화 및 드럼 소리 재생
    await music.ensureAudioActive();
    await music.playDrumSound(drum.type);
    console.log('🥁 Successfully played drum:', drum.name);
  } catch (error) {
    console.error('❌ Failed to play drum sound:', error);
  }
  
  // 진동 효과 (지원하는 기기에서)
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }
  
  // 패드 애니메이션
  animatePad(drum.id);
};

/**
 * 기본 드럼 패드 뗌 처리
 */
const handleDrumRelease = (drum: DrumPad) => {
  pressedPads.value.delete(drum.id);
};

/**
 * 재미있는 효과음 패드 눌림 처리
 */
const handleFunSoundPress = async (sound: FunSound) => {
  if (pressedPads.value.has(sound.id)) return;
  
  pressedPads.value.add(sound.id);
  
  try {
    // 오디오 활성화 및 효과음 재생
    await music.ensureAudioActive();
    const audioContext = await music.initializeAudio();
    if (audioContext) {
      playFunSound(sound.id, audioContext);
      console.log('🎪 Successfully played fun sound:', sound.name);
    }
  } catch (error) {
    console.error('❌ Failed to play fun sound:', error);
  }
  
  // 진동 효과 (더 길게)
  if (navigator.vibrate) {
    navigator.vibrate(100);
  }
  
  // 패드 애니메이션
  animatePad(sound.id);
};

/**
 * 재미있는 효과음 패드 뗌 처리
 */
const handleFunSoundRelease = (sound: FunSound) => {
  pressedPads.value.delete(sound.id);
};

/**
 * 패드 애니메이션
 */
const animatePad = (padId: string) => {
  // 리플 효과나 추가 애니메이션을 여기에 추가할 수 있음
  setTimeout(() => {
    // 추가 시각적 효과
  }, 50);
};

/**
 * 키보드 이벤트 처리
 */
const handleKeyboardEvent = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  
  // 기본 드럼 키 매핑
  const drumKeyMap: { [key: string]: DrumPad } = {
    ' ': basicDrums[0], // Space = 킥드럼
    's': basicDrums[1], // S = 스네어
    'h': basicDrums[2], // H = 하이햇
    'c': basicDrums[3], // C = 심벌
    't': basicDrums[4], // T = 하이톰
    'y': basicDrums[5], // Y = 미드톰
    'f': basicDrums[6], // F = 플로어톰
    'r': basicDrums[7]  // R = 라이드
  };
  
  // 재미있는 효과음 키 매핑 (1~8)
  const funKeyMap: { [key: string]: FunSound } = {
    '1': funSounds[0], '2': funSounds[1], '3': funSounds[2], '4': funSounds[3],
    '5': funSounds[4], '6': funSounds[5], '7': funSounds[6], '8': funSounds[7]
  };
  
  // 드럼 처리
  const drum = drumKeyMap[key];
  if (drum && !pressedPads.value.has(drum.id)) {
    handleDrumPress(drum);
    return;
  }
  
  // 효과음 처리
  const funSound = funKeyMap[key];
  if (funSound && !pressedPads.value.has(funSound.id)) {
    handleFunSoundPress(funSound);
    return;
  }
};

const handleKeyboardUp = (event: KeyboardEvent) => {
  const key = event.key.toLowerCase();
  
  // 기본 드럼 키 매핑
  const drumKeyMap: { [key: string]: DrumPad } = {
    ' ': basicDrums[0], 's': basicDrums[1], 'h': basicDrums[2], 'c': basicDrums[3],
    't': basicDrums[4], 'y': basicDrums[5], 'f': basicDrums[6], 'r': basicDrums[7]
  };
  
  // 재미있는 효과음 키 매핑
  const funKeyMap: { [key: string]: FunSound } = {
    '1': funSounds[0], '2': funSounds[1], '3': funSounds[2], '4': funSounds[3],
    '5': funSounds[4], '6': funSounds[5], '7': funSounds[6], '8': funSounds[7]
  };
  
  const drum = drumKeyMap[key];
  if (drum) {
    handleDrumRelease(drum);
    return;
  }
  
  const funSound = funKeyMap[key];
  if (funSound) {
    handleFunSoundRelease(funSound);
    return;
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
.drum-kit {
  display: flex;
  flex-direction: column;
  gap: 32px;
  user-select: none;
}

/* 드럼 통계 */
.drum-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  background: #000000;
  border-radius: 16px;
  padding: 20px;
  color: white;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

/* 드럼 패드 컨테이너 */
.drum-pads-container {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 24px;
  color: white;
  background: #000000;
  padding: 12px 20px;
  border-radius: 12px;
  text-shadow: 
    1px 1px 3px rgba(0, 0, 0, 0.8),
    0 0 6px rgba(0, 0, 0, 0.5);
  font-family: 'Comic Sans MS', cursive, sans-serif;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 실제 드럼세트 컨테이너 */
.drum-set-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  align-items: start;
}

/* 사실적인 드럼 스테이지 */
.drum-stage {
  position: relative;
  background: 
    /* 나무 바닥 질감 */
    repeating-linear-gradient(
      90deg,
      #8d6e63 0px,
      #795548 2px,
      #6d4c41 4px,
      #5d4037 6px,
      #6d4c41 8px,
      #795548 10px
    ),
    /* 기본 나무 색상 */
    linear-gradient(135deg, 
      #d7ccc8, 
      #bcaaa4, 
      #a1887f, 
      #8d6e63
    );
  border-radius: 20px;
  padding: 50px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.2),
    0 10px 25px rgba(0, 0, 0, 0.1),
    inset 0 3px 6px rgba(255, 255, 255, 0.3);
  overflow: visible;
  min-height: 480px;
  border: 4px solid #8d6e63;
  position: relative;
}

/* 나무 질감 오버레이 */
.drum-stage::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    /* 나무 결 패턴 */
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 8px,
      rgba(0, 0, 0, 0.03) 8px,
      rgba(0, 0, 0, 0.03) 9px
    ),
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 120px,
      rgba(0, 0, 0, 0.02) 120px,
      rgba(0, 0, 0, 0.02) 122px
    );
  border-radius: 20px;
  opacity: 0.8;
  pointer-events: none;
}

/* 부드러운 그림자 */
.drum-stage::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 20px;
  background: radial-gradient(ellipse, rgba(0, 0, 0, 0.1), transparent);
  border-radius: 50%;
  filter: blur(10px);
  z-index: -1;
}

.drum-row {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  position: relative;
}

.back-row {
  justify-content: space-around;
  margin-bottom: 25px;
  gap: 20px;
}

.middle-row {
  justify-content: space-around;
  margin-bottom: 30px;
  gap: 25px;
}

.front-row {
  justify-content: space-around;
  gap: 35px;
  align-items: flex-end;
}

/* 드럼 요소들 */
.drum-element {
  background: none;
  border: none;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
}

.drum-element:hover {
  transform: scale(1.05);
}

.drum-element.active {
  transform: scale(0.95);
  filter: brightness(1.2);
}

.drum-label {
  position: absolute;
  bottom: -28px;
  left: 50%;
  transform: translateX(-50%);
  color: #5d4037;
  font-size: 0.85rem;
  font-weight: 600;
  text-shadow: 
    1px 1px 2px rgba(255, 255, 255, 0.8),
    0 0 4px rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  letter-spacing: 0.5px;
}

/* 사실적인 크래시 심벌 */
.cymbal {
  width: 100px;
  height: 100px;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.25));
}

.cymbal-surface {
  position: relative;
  width: 100px;
  height: 100px;
  background: 
    /* 금속 반사광 */
    radial-gradient(ellipse 35px 20px at 25% 20%, rgba(255, 255, 255, 0.9), transparent 50%),
    radial-gradient(ellipse 20px 12px at 70% 30%, rgba(255, 255, 255, 0.6), transparent 40%),
    /* 심벌 금속 색상 (더 사실적인 브론즈) */
    linear-gradient(135deg, 
      #cd853f, 
      #daa520, 
      #b8860b, 
      #8b7355,
      #cd853f
    );
  border-radius: 50%;
  box-shadow: 
    inset 0 4px 12px rgba(0, 0, 0, 0.2),
    inset 0 -3px 6px rgba(255, 255, 255, 0.4),
    0 8px 25px rgba(205, 133, 63, 0.4);
  border: 3px solid rgba(139, 115, 85, 0.8);
}

.cymbal-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: 
    radial-gradient(circle at 30% 30%, #8d6e63, #6d4c41, #5d4037);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 2px 6px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.cymbal-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cymbal-rings::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.cymbal-stand {
  position: absolute;
  bottom: -20px;
  left: 50%;
  width: 5px;
  height: 20px;
  background: linear-gradient(180deg, #a1887f, #8d6e63, #6d4c41);
  transform: translateX(-50%);
  border-radius: 3px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

/* 사실적인 하이햇 */
.hihat {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 5px 12px rgba(0, 0, 0, 0.2));
}

.hihat-top {
  width: 80px;
  height: 80px;
  background: 
    /* 금속 반사광 */
    radial-gradient(ellipse 25px 15px at 30% 25%, rgba(255, 255, 255, 0.95), transparent 60%),
    /* 사실적인 실버/크롬 */
    linear-gradient(135deg, #c0c0c0, #a8a8a8, #909090, #808080, #696969);
  border-radius: 50%;
  box-shadow: 
    inset 0 3px 8px rgba(0, 0, 0, 0.1),
    inset 0 -2px 4px rgba(255, 255, 255, 0.6),
    0 6px 16px rgba(128, 128, 128, 0.3);
  position: relative;
  z-index: 2;
  border: 3px solid rgba(105, 105, 105, 0.8);
}

.hihat-bottom {
  position: absolute;
  top: 6px;
  left: 4px;
  width: 72px;
  height: 72px;
  background: 
    linear-gradient(135deg, #696969, #505050, #404040, #303030);
  border-radius: 50%;
  box-shadow: 
    inset 0 3px 6px rgba(0, 0, 0, 0.3),
    0 3px 8px rgba(0, 0, 0, 0.15);
  border: 2px solid rgba(48, 48, 48, 0.8);
}

.hihat-stand {
  position: absolute;
  bottom: -20px;
  left: 50%;
  width: 4px;
  height: 20px;
  background: #7f8c8d;
  transform: translateX(-50%);
  border-radius: 2px;
}

/* 사실적인 스네어 드럼 */
.snare {
  width: 120px;
  height: 120px;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.2));
}

.snare-surface {
  position: relative;
  width: 120px;
  height: 120px;
  background: 
    /* 드럼헤드 반사광 */
    radial-gradient(ellipse 40px 25px at 30% 25%, rgba(255, 255, 255, 0.95), transparent 60%),
    radial-gradient(ellipse 25px 15px at 70% 35%, rgba(255, 255, 255, 0.7), transparent 50%),
    /* 사실적인 화이트 드럼헤드 색상 */
    linear-gradient(135deg, 
      #f8f8f8, 
      #f0f0f0, 
      #e8e8e8, 
      #e0e0e0
    );
  border-radius: 50%;
  box-shadow: 
    inset 0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 -3px 6px rgba(255, 255, 255, 0.6),
    0 8px 25px rgba(32, 32, 32, 0.3);
  border: 4px solid rgba(224, 224, 224, 0.9);
}

.snare-rim {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 132px;
  height: 132px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c2c2c, #1a1a1a, #0d0d0d, #000000);
  z-index: -1;
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.2),
    inset 0 3px 6px rgba(68, 68, 68, 0.4);
}

.snare-head {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  background: 
    /* 드럼 헤드 문양 */
    repeating-conic-gradient(
      from 0deg at 50% 50%,
      transparent 0deg,
      rgba(255, 255, 255, 0.1) 5deg,
      transparent 10deg
    ),
    radial-gradient(circle, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.2) 60%, transparent 80%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.snare-stand {
  position: absolute;
  bottom: -15px;
  left: 20%;
  width: 7px;
  height: 15px;
  background: linear-gradient(180deg, #a1887f, #8d6e63);
  border-radius: 4px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

.snare-stand::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -25px;
  width: 7px;
  height: 15px;
  background: linear-gradient(180deg, #a1887f, #8d6e63);
  border-radius: 4px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.2);
}

/* 사실적인 톰들 */
.tom {
  width: 95px;
  height: 95px;
  filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.18));
}

.tom-surface {
  position: relative;
  width: 95px;
  height: 95px;
  border-radius: 50%;
  box-shadow: 
    inset 0 4px 10px rgba(0, 0, 0, 0.12),
    inset 0 -3px 6px rgba(255, 255, 255, 0.5),
    0 8px 20px rgba(0, 0, 0, 0.15);
  border: 3px solid rgba(255, 255, 255, 0.6);
}

.high-tom {
  background: 
    /* 드럼헤드 반사광 */
    radial-gradient(ellipse 30px 20px at 30% 25%, rgba(255, 255, 255, 0.9), transparent 60%),
    /* 사실적인 레드 톰 */
    linear-gradient(135deg, #c62828, #d32f2f, #f44336, #ef5350);
}

.mid-tom {
  background: 
    /* 드럼헤드 반사광 */
    radial-gradient(ellipse 30px 20px at 30% 25%, rgba(255, 255, 255, 0.9), transparent 60%),
    /* 사실적인 블루 톰 */
    linear-gradient(135deg, #1565c0, #1976d2, #2196f3, #42a5f5);
}

.tom-rim {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 107px;
  height: 107px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2c2c2c, #1a1a1a, #0d0d0d);
  z-index: -1;
}

.tom-head {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.tom-mount {
  position: absolute;
  bottom: -12px;
  left: 50%;
  width: 6px;
  height: 12px;
  background: #7f8c8d;
  transform: translateX(-50%);
  border-radius: 3px;
}

/* 사실적인 플로어톰 */
.floor-tom {
  width: 110px;
  height: 110px;
  filter: drop-shadow(0 6px 18px rgba(0, 0, 0, 0.2));
}

.floor-tom-surface {
  position: relative;
  width: 110px;
  height: 110px;
  background: 
    /* 드럼헤드 반사광 */
    radial-gradient(ellipse 35px 22px at 30% 25%, rgba(255, 255, 255, 0.9), transparent 60%),
    /* 사실적인 블랙 플로어톰 */
    linear-gradient(135deg, #424242, #616161, #757575, #9e9e9e);
  border-radius: 50%;
  box-shadow: 
    inset 0 5px 12px rgba(0, 0, 0, 0.15),
    inset 0 -4px 8px rgba(255, 255, 255, 0.5),
    0 10px 25px rgba(66, 66, 66, 0.3);
  border: 4px solid rgba(255, 255, 255, 0.6);
}

.floor-tom-rim {
  position: absolute;
  top: -7px;
  left: -7px;
  width: 124px;
  height: 124px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1a1a1a, #0d0d0d, #000000);
  z-index: -1;
}

.floor-tom-head {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 75px;
  height: 75px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.6), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.floor-tom-legs {
  position: absolute;
  bottom: -20px;
  left: 15%;
  width: 6px;
  height: 20px;
  background: #34495e;
  border-radius: 3px;
}

.floor-tom-legs::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -50px;
  width: 6px;
  height: 20px;
  background: #34495e;
  border-radius: 3px;
}

.floor-tom-legs::before {
  content: '';
  position: absolute;
  bottom: 0;
  right: -25px;
  width: 6px;
  height: 20px;
  background: #34495e;
  border-radius: 3px;
}

/* 사실적인 라이드 심벌 */
.ride {
  width: 105px;
  height: 105px;
  filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.2));
}

.ride-surface {
  position: relative;
  width: 105px;
  height: 105px;
  background: 
    /* 금속 반사광 */
    radial-gradient(ellipse 35px 20px at 30% 25%, rgba(255, 255, 255, 0.95), transparent 60%),
    /* 사실적인 브론즈 라이드 */
    linear-gradient(135deg, #a0522d, #cd853f, #daa520, #b8860b, #8b7355);
  border-radius: 50%;
  box-shadow: 
    inset 0 4px 10px rgba(0, 0, 0, 0.12),
    inset 0 -3px 6px rgba(255, 255, 255, 0.6),
    0 8px 20px rgba(160, 82, 45, 0.3);
  border: 3px solid rgba(139, 115, 85, 0.8);
}

.ride-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 14px;
  height: 14px;
  background: #34495e;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ride-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 70px;
  height: 70px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ride-rings::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ride-rings::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.ride-stand {
  position: absolute;
  bottom: -20px;
  left: 50%;
  width: 4px;
  height: 20px;
  background: #7f8c8d;
  transform: translateX(-50%);
  border-radius: 2px;
}

/* 사실적인 킥드럼 */
.kick {
  width: 160px;
  height: 160px;
  filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.25));
}

.kick-drum {
  position: relative;
}

.kick-surface {
  width: 160px;
  height: 160px;
  background: 
    /* 드럼헤드 반사광 */
    radial-gradient(ellipse 50px 30px at 25% 25%, rgba(255, 255, 255, 0.9), transparent 60%),
    radial-gradient(ellipse 30px 18px at 75% 35%, rgba(255, 255, 255, 0.6), transparent 50%),
    /* 사실적인 킥드럼 색상 (블랙/화이트) */
    linear-gradient(135deg, 
      #f5f5f5, 
      #e8e8e8, 
      #d0d0d0, 
      #b8b8b8
    );
  border-radius: 50%;
  box-shadow: 
    inset 0 6px 16px rgba(0, 0, 0, 0.15),
    inset 0 -4px 8px rgba(255, 255, 255, 0.5),
    0 12px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  border: 5px solid rgba(184, 184, 184, 0.8);
}

.kick-hole {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 50px;
  height: 50px;
  background: 
    radial-gradient(circle at 30% 30%, #1a1a1a, #0d0d0d, #000000);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 
    inset 0 6px 12px rgba(0, 0, 0, 0.6),
    0 0 0 3px rgba(26, 26, 26, 0.8);
  border: 3px solid rgba(0, 0, 0, 0.9);
}

.kick-legs {
  position: absolute;
  bottom: -25px;
  left: 10%;
  width: 8px;
  height: 25px;
  background: #34495e;
  border-radius: 4px;
}

.kick-legs::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -100px;
  width: 8px;
  height: 25px;
  background: #34495e;
  border-radius: 4px;
}

/* 지브리 스타일 드럼스틱 */
.drumsticks {
  position: absolute;
  top: 15px;
  right: 15px;
  display: flex;
  gap: 12px;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.drumstick {
  position: relative;
  transition: all 0.3s ease;
}

.drumstick.animate {
  animation: drumstickHit 0.3s ease;
}

@keyframes drumstickHit {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(-15deg); }
  100% { transform: rotate(0deg); }
}

.drumstick.right.animate {
  animation: drumstickHitRight 0.3s ease;
}

@keyframes drumstickHitRight {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(15deg); }
  100% { transform: rotate(0deg); }
}

.stick-body {
  width: 45px;
  height: 5px;
  background: 
    /* 나무 결 효과 */
    repeating-linear-gradient(
      90deg,
      #d7ccc8 0px,
      #bcaaa4 2px,
      #a1887f 4px,
      #bcaaa4 6px
    ),
    linear-gradient(180deg, #d7ccc8, #bcaaa4, #a1887f);
  border-radius: 3px;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.15),
    inset 0 1px 2px rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.stick-tip {
  position: absolute;
  right: -4px;
  top: -2px;
  width: 8px;
  height: 8px;
  background: 
    radial-gradient(circle at 30% 30%, #fff8e1, #ffecb3, #ffe082);
  border-radius: 50%;
  box-shadow: 
    0 2px 4px rgba(0, 0, 0, 0.1),
    inset 0 1px 2px rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

/* 지브리 감성 드럼 글로우 */
.drum-glow {
  position: absolute;
  top: -20px;
  left: -20px;
  right: -20px;
  bottom: -20px;
  background: 
    /* 따뜻한 파스텔 글로우 */
    radial-gradient(circle, 
      rgba(255, 240, 245, 0.8), 
      rgba(255, 182, 193, 0.6) 30%, 
      rgba(173, 216, 230, 0.4) 50%, 
      transparent 70%
    );
  border-radius: 50%;
  animation: ghibliGlow 0.5s ease;
  pointer-events: none;
  z-index: 5;
}

@keyframes ghibliGlow {
  0% { 
    transform: scale(0.8); 
    opacity: 0; 
    filter: blur(6px);
  }
  40% { 
    transform: scale(1.2); 
    opacity: 0.9; 
    filter: blur(2px);
  }
  70% { 
    transform: scale(1.4); 
    opacity: 0.6; 
    filter: blur(1px);
  }
  100% { 
    transform: scale(1.6); 
    opacity: 0; 
    filter: blur(8px);
  }
}

/* 블랙&화이트 재미있는 소리 패널 */
.fun-sounds-panel {
  background: 
    /* 블랙 그라데이션 */
    linear-gradient(135deg, 
      #1a1a1a, 
      #2d2d2d, 
      #1a1a1a
    );
  border-radius: 25px;
  padding: 28px;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.5),
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  height: fit-content;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.fun-sound-board {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.fun-button {
  position: relative;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.fun-button-face {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #2a2a2a, #1a1a1a, #0d0d0d) !important;
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.4),
    inset 0 2px 4px rgba(255, 255, 255, 0.15),
    inset 0 -2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 2;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.fun-button-shadow {
  position: absolute;
  top: 6px;
  left: 0;
  right: 0;
  height: 80px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  z-index: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  filter: blur(2px);
}

.fun-button:hover .fun-button-face {
  transform: translateY(-2px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.6),
    inset 0 3px 6px rgba(255, 255, 255, 0.2),
    inset 0 -3px 6px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.5);
}

.fun-button:hover .fun-button-shadow {
  transform: translateY(2px);
  opacity: 0.3;
}

.fun-button:active .fun-button-face,
.fun-button.active .fun-button-face {
  transform: translateY(2px);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.4),
    inset 0 2px 6px rgba(0, 0, 0, 0.5),
    inset 0 -1px 3px rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.4);
}

.fun-button:active .fun-button-shadow,
.fun-button.active .fun-button-shadow {
  transform: translateY(0px);
  opacity: 0.1;
}

.fun-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 1px 3px rgba(255, 255, 255, 0.3));
  color: #ffffff;
}

.fun-name {
  font-size: 0.7rem;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 4px rgba(255, 255, 255, 0.3);
  letter-spacing: 0.5px;
}

/* 반짝임 효과 */
.fun-sparkles {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 0.8rem;
  animation: sparkleFloat 0.8s ease-out forwards;
}

.sparkle:nth-child(1) { top: 10%; left: 20%; animation-delay: 0s; }
.sparkle:nth-child(2) { top: 20%; right: 15%; animation-delay: 0.1s; }
.sparkle:nth-child(3) { bottom: 30%; left: 10%; animation-delay: 0.2s; }
.sparkle:nth-child(4) { bottom: 20%; right: 20%; animation-delay: 0.3s; }
.sparkle:nth-child(5) { top: 50%; left: 5%; animation-delay: 0.4s; }
.sparkle:nth-child(6) { top: 40%; right: 5%; animation-delay: 0.5s; }

@keyframes sparkleFloat {
  0% { 
    transform: scale(0) rotate(0deg);
    opacity: 1;
  }
  50% { 
    transform: scale(1.2) rotate(180deg);
    opacity: 0.8;
  }
  100% { 
    transform: scale(0) rotate(360deg);
    opacity: 0;
  }
}

/* 다크모드 키보드 가이드 */
.keyboard-guide {
  background: 
    linear-gradient(135deg, 
      #1a1a1a, 
      #2d2d2d, 
      #1a1a1a
    );
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.4),
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.keyboard-guide h4 {
  margin-bottom: 18px;
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 4px rgba(255, 255, 255, 0.3);
}

.key-mappings {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.key-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-title {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.85rem;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.7),
    0 0 3px rgba(255, 255, 255, 0.2);
}

.key-item {
  background: 
    linear-gradient(135deg, #2a2a2a, #1a1a1a, #0d0d0d);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 0.75rem;
  color: #ffffff;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  font-weight: 500;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 3px rgba(255, 255, 255, 0.2);
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .drum-set-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }
  
  .drum-stage {
    padding: 30px;
    min-height: 350px;
  }
  
  .fun-sounds-panel {
    order: -1;
  }
  
  .fun-sound-board {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
  .drum-stats {
    gap: 20px;
    flex-direction: column;
    align-items: center;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
    max-width: 200px;
  }
  
  .drum-stage {
    padding: 24px;
    min-height: 300px;
  }
  
  .cymbal {
    width: 60px;
    height: 60px;
  }
  
  .cymbal-surface {
    width: 60px;
    height: 60px;
  }
  
  .tom {
    width: 65px;
    height: 65px;
  }
  
  .tom-surface {
    width: 65px;
    height: 65px;
  }
  
  .ride {
    width: 70px;
    height: 70px;
  }
  
  .ride-surface {
    width: 70px;
    height: 70px;
  }
  
  .floor-tom {
    width: 80px;
    height: 80px;
  }
  
  .floor-tom-surface {
    width: 80px;
    height: 80px;
  }
  
  .hihat {
    width: 50px;
    height: 50px;
  }
  
  .hihat-top {
    width: 50px;
    height: 50px;
  }
  
  .hihat-bottom {
    width: 42px;
    height: 42px;
    top: 6px;
    left: 4px;
  }
  
  .snare {
    width: 80px;
    height: 80px;
  }
  
  .snare-surface {
    width: 80px;
    height: 80px;
  }
  
  .snare-rim {
    width: 90px;
    height: 90px;
  }
  
  .kick {
    width: 110px;
    height: 110px;
  }
  
  .kick-surface {
    width: 110px;
    height: 110px;
  }
  
  .drumsticks {
    top: 10px;
    right: 10px;
    gap: 6px;
  }
  
  .stick-body {
    width: 30px;
    height: 3px;
  }
  
  .fun-sound-board {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .fun-button-face {
    width: 70px;
    height: 70px;
  }
  
  .fun-button-shadow {
    height: 70px;
  }
  
  .key-mappings {
    gap: 20px;
  }
}

@media (max-width: 480px) {
  .drum-stage {
    padding: 16px;
    min-height: 250px;
  }
  
  .cymbal {
    width: 50px;
    height: 50px;
  }
  
  .cymbal-surface {
    width: 50px;
    height: 50px;
  }
  
  .tom {
    width: 55px;
    height: 55px;
  }
  
  .tom-surface {
    width: 55px;
    height: 55px;
  }
  
  .ride {
    width: 60px;
    height: 60px;
  }
  
  .ride-surface {
    width: 60px;
    height: 60px;
  }
  
  .floor-tom {
    width: 70px;
    height: 70px;
  }
  
  .floor-tom-surface {
    width: 70px;
    height: 70px;
  }
  
  .hihat {
    width: 40px;
    height: 40px;
  }
  
  .hihat-top,
  .hihat-bottom {
    width: 40px;
    height: 40px;
  }
  
  .snare {
    width: 70px;
    height: 70px;
  }
  
  .snare-surface {
    width: 70px;
    height: 70px;
  }
  
  .kick {
    width: 90px;
    height: 90px;
  }
  
  .kick-surface {
    width: 90px;
    height: 90px;
  }
  
  .kick-hole {
    width: 25px;
    height: 25px;
  }
  
  .drum-label {
    font-size: 0.8rem;
  }
  
  .fun-sound-board {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .fun-button-face {
    width: 90px;
    height: 90px;
  }
  
  .fun-button-shadow {
    height: 90px;
  }
  
  .section-title {
    font-size: 1.3rem;
  }
}

/* 터치 최적화 */
@media (hover: none) and (pointer: coarse) {
  .drum-element {
    min-width: 60px;
    min-height: 60px;
  }
  
  .kick {
    min-width: 120px;
    min-height: 120px;
  }
  
  .drum-element:active {
    transition: none;
  }
  
  .drum-element:hover {
    /* 터치 디바이스에서는 hover 효과 제거 */
    transform: scale(1);
  }
  
  .fun-button-face {
    min-width: 60px;
    min-height: 60px;
  }
  
  .fun-button:hover .fun-button-face {
    transform: translateY(0);
  }
}
</style>