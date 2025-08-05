<template>
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
              @click="handleStringPlay(string)"
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
        @mousedown="handleBowStart($event)"
        @touchstart="handleBowStart($event)"
      >
        <div class="bow-stick"></div>
        <div class="bow-hair"></div>
        <div class="bow-frog"></div>
        <div class="bow-tip"></div>
        
        <!-- 활 사용 가이드 -->
        <div v-if="!isDragging" class="bow-guide">
          <div class="guide-text">드래그하여 연주하세요</div>
          <div class="guide-arrow">↕</div>
        </div>
      </div>

      <!-- 드래그 영역 표시 -->
      <div v-if="isDragging" class="drag-zone">
        <div class="zone-indicator"></div>
      </div>
    </div>

    <!-- 드래그 연주 안내 -->
    <div class="play-instructions">
      <p>🎻 현을 클릭하거나 활을 드래그하여 바이올린을 연주해보세요!</p>
      <div class="instruction-details">
        <span>• 각 현을 직접 클릭</span>
        <span>• 활을 상하로 드래그</span>
        <span>• 리듬 모드에서 하이라이트된 현 연주</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ViolinString {
  note: string;
  displayName: string;
  frequency: number;
  color: string;
}

interface Props {
  violinStrings: ViolinString[];
  activeStrings: Set<string>;
  practiceMode: 'free' | 'rhythm';
  currentNote?: string;
  isPlaying: boolean;
  isDragging: boolean;
  bowTransform: string;
}

defineProps<Props>();
const emit = defineEmits<{
  stringPlay: [string: ViolinString];
  bowStart: [event: MouseEvent | TouchEvent];
}>();

const handleStringPlay = (string: ViolinString) => {
  emit('stringPlay', string);
};

const handleBowStart = (event: MouseEvent | TouchEvent) => {
  emit('bowStart', event);
};
</script>

<style scoped>
.violin-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  background: linear-gradient(135deg, #FFF8DC, #F5DEB3, #DEB887);
  border-radius: 25px;
  padding: 40px;
  box-shadow: 0 12px 30px rgba(139, 69, 19, 0.3);
  margin-bottom: 32px;
}

.violin-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 800px;
}

.violin-shape {
  position: relative;
  width: 300px;
  height: 600px;
  margin-right: 60px;
}

/* 스크롤 (상단 장식) */
.violin-scroll {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 40px;
  background: linear-gradient(145deg, #8B4513, #A0522D);
  border-radius: 50% 50% 40% 40%;
  box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
}

.scroll-decoration {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  background: #CD853F;
  border-radius: 50%;
}

/* 펙박스 */
.violin-pegbox {
  position: absolute;
  top: 35px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 80px;
  background: linear-gradient(145deg, #8B4513, #A0522D);
  border-radius: 8px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: center;
  padding: 8px;
}

.peg {
  width: 6px;
  height: 15px;
  background: #654321;
  border-radius: 3px;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.2);
}

/* 넥 */
.violin-neck {
  position: absolute;
  top: 110px;
  left: 50%;
  transform: translateX(-50%);
  width: 35px;
  height: 200px;
  background: linear-gradient(145deg, #8B4513, #A0522D);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
}

.fingerboard {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 25px;
  height: 100%;
  background: linear-gradient(145deg, #654321, #8B4513);
  border-radius: 6px;
}

/* 메인 바디 */
.violin-main-body {
  position: absolute;
  top: 300px;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 240px;
  background: linear-gradient(145deg, #DEB887, #D2B48C, #BC9A6A);
  border-radius: 50px 50px 40px 40px;
  box-shadow: 0 8px 20px rgba(139, 69, 19, 0.4);
  position: relative;
}

/* F홀 */
.f-holes {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 80px;
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
}

.f-hole {
  width: 3px;
  height: 60px;
  background: #654321;
  border-radius: 50px;
  position: relative;
}

.f-hole::before,
.f-hole::after {
  content: '';
  position: absolute;
  width: 8px;
  height: 3px;
  background: #654321;
  border-radius: 2px;
}

.f-hole::before {
  top: 15px;
  left: -2px;
}

.f-hole::after {
  bottom: 15px;
  right: -2px;
}

.f-hole.left::before {
  right: -2px;
  left: auto;
}

.f-hole.left::after {
  left: -2px;
  right: auto;
}

/* 브릿지 */
.violin-bridge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 8px;
  background: linear-gradient(145deg, #8B4513, #A0522D);
  border-radius: 4px;
  box-shadow: 0 2px 6px rgba(139, 69, 19, 0.3);
  z-index: 2;
}

/* 현들 */
.violin-strings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120px;
  height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  z-index: 3;
}

.violin-string {
  width: 100%;
  height: 2px;
  border-radius: 1px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  opacity: 0.8;
}

.violin-string:hover {
  opacity: 1;
  transform: scaleY(1.5);
  box-shadow: 0 0 10px currentColor;
}

.violin-string.active {
  opacity: 1;
  transform: scaleY(2);
  box-shadow: 0 0 15px currentColor;
  animation: stringVibration 0.5s ease-out;
}

.violin-string.highlighted {
  animation: highlight 1s ease-in-out infinite;
}

@keyframes stringVibration {
  0%, 100% { transform: scaleY(2); }
  25% { transform: scaleY(2.5) translateY(-1px); }
  75% { transform: scaleY(2.5) translateY(1px); }
}

@keyframes highlight {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; box-shadow: 0 0 20px currentColor; }
}

.string-glow {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8), transparent 70%);
  border-radius: 50%;
  animation: glow 0.5s ease-out;
  pointer-events: none;
}

@keyframes glow {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.string-touch-area {
  position: absolute;
  top: -10px;
  left: -10px;
  right: -10px;
  bottom: -10px;
}

.string-label {
  position: absolute;
  right: -25px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: #8B4513;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 10px;
  pointer-events: none;
}

/* 현 라벨 */
.string-labels {
  position: absolute;
  right: -60px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.string-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #8B4513;
  text-align: center;
  background: linear-gradient(135deg, #FFF8DC, #F5DEB3);
  padding: 8px 12px;
  border-radius: 15px;
  box-shadow: 0 2px 6px rgba(139, 69, 19, 0.2);
  border: 2px solid #DEB887;
}

/* 테일피스 */
.violin-tailpiece {
  position: absolute;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: linear-gradient(145deg, #8B4513, #A0522D);
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(139, 69, 19, 0.3);
}

/* 활 */
.violin-bow {
  position: absolute;
  right: -120px;
  top: 50%;
  transform: translateY(-50%);
  width: 15px;
  height: 300px;
  cursor: grab;
  transition: all 0.3s ease;
}

.violin-bow:active {
  cursor: grabbing;
}

.violin-bow.dragging {
  transform: translateY(-50%) scale(1.1);
  filter: drop-shadow(0 0 15px rgba(139, 69, 19, 0.6));
}

.violin-bow.playing {
  animation: bowPlaying 0.3s ease-out;
}

@keyframes bowPlaying {
  0% { transform: translateY(-50%) rotate(0deg); }
  50% { transform: translateY(-50%) rotate(2deg); }
  100% { transform: translateY(-50%) rotate(0deg); }
}

.bow-stick {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 90%;
  background: linear-gradient(180deg, #8B4513, #A0522D, #654321);
  border-radius: 3px;
  box-shadow: 0 2px 6px rgba(139, 69, 19, 0.3);
}

.bow-hair {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 85%;
  top: 7%;
  background: #F5F5DC;
  opacity: 0.8;
}

.bow-frog {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 15px;
  background: linear-gradient(145deg, #654321, #8B4513);
  border-radius: 3px;
}

.bow-tip {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 8px;
  height: 8px;
  background: #654321;
  border-radius: 50%;
}

.bow-guide {
  position: absolute;
  left: -60px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(139, 69, 19, 0.9);
  color: white;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  white-space: nowrap;
  animation: bounceGuide 2s ease-in-out infinite;
}

@keyframes bounceGuide {
  0%, 100% { transform: translateY(-50%); }
  50% { transform: translateY(-60%); }
}

.guide-arrow {
  text-align: center;
  font-size: 1.2rem;
  animation: arrowBounce 1s ease-in-out infinite;
}

@keyframes arrowBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

/* 드래그 영역 */
.drag-zone {
  position: absolute;
  right: -150px;
  top: 0;
  width: 100px;
  height: 100%;
  pointer-events: none;
}

.zone-indicator {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(139, 69, 19, 0.1) 50%,
    transparent 100%
  );
  border-radius: 10px;
  animation: dragZonePulse 1s ease-in-out infinite;
}

@keyframes dragZonePulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

/* 연주 안내 */
.play-instructions {
  text-align: center;
  background: rgba(255, 255, 255, 0.8);
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.2);
  max-width: 600px;
}

.play-instructions p {
  font-size: 1.1rem;
  font-weight: 600;
  color: #8B4513;
  margin-bottom: 12px;
}

.instruction-details {
  display: flex;
  justify-content: space-around;
  gap: 16px;
  flex-wrap: wrap;
}

.instruction-details span {
  font-size: 0.9rem;
  color: #A0522D;
  background: #F5DEB3;
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid #DEB887;
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .violin-shape {
    width: 250px;
    height: 500px;
    margin-right: 40px;
  }
  
  .violin-bow {
    right: -100px;
    height: 250px;
  }
}

@media (max-width: 768px) {
  .violin-body {
    padding: 20px;
  }
  
  .violin-container {
    flex-direction: column;
    gap: 40px;
  }
  
  .violin-shape {
    width: 200px;
    height: 400px;
    margin-right: 0;
  }
  
  .violin-bow {
    position: relative;
    right: auto;
    top: auto;
    transform: rotate(90deg);
    height: 200px;
  }
  
  .string-labels {
    right: -50px;
  }
  
  .instruction-details {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .violin-shape {
    width: 150px;
    height: 300px;
  }
  
  .violin-bow {
    height: 150px;
  }
  
  .play-instructions {
    padding: 15px;
  }
  
  .play-instructions p {
    font-size: 1rem;
  }
  
  .instruction-details span {
    font-size: 0.8rem;
    padding: 4px 8px;
  }
}
</style>