<template>
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
</template>

<script setup lang="ts">
interface DrumPad {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'kick' | 'snare' | 'hihat' | 'cymbal' | 'tom1' | 'tom2' | 'floor-tom' | 'ride';
}

interface Props {
  basicDrums: DrumPad[];
  pressedPads: Set<string>;
}

defineProps<Props>();
const emit = defineEmits<{
  drumPress: [drum: DrumPad];
  drumRelease: [drum: DrumPad];
}>();

const handleDrumPress = (drum: DrumPad) => {
  emit('drumPress', drum);
};

const handleDrumRelease = (drum: DrumPad) => {
  emit('drumRelease', drum);
};
</script>

<style scoped>
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

/* 반응형 디자인 */
@media (max-width: 768px) {
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
  
  .section-title {
    font-size: 1.3rem;
  }
}
</style>