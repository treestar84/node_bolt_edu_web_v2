<template>
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
</template>

<script setup lang="ts">
import type { FunSound } from '@/composables/useCarSounds';

interface Props {
  funSounds: FunSound[];
  pressedPads: Set<string>;
}

defineProps<Props>();
const emit = defineEmits<{
  funSoundPress: [sound: FunSound];
  funSoundRelease: [sound: FunSound];
}>();

const handleFunSoundPress = (sound: FunSound) => {
  emit('funSoundPress', sound);
};

const handleFunSoundRelease = (sound: FunSound) => {
  emit('funSoundRelease', sound);
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

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .fun-sound-board {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 768px) {
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
}

@media (max-width: 480px) {
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
  .fun-button-face {
    min-width: 60px;
    min-height: 60px;
  }
  
  .fun-button:hover .fun-button-face {
    transform: translateY(0);
  }
}
</style>