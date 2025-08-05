<template>
  <div class="drum-item" :class="containerClass">
    <button
      @mousedown="handlePress"
      @mouseup="handleRelease"
      @mouseleave="handleRelease"
      @touchstart="handlePress"
      @touchend="handleRelease"
      class="drum-element"
      :class="[drumType, { active: isPressed }]"
    >
      <!-- Cymbal-specific design -->
      <template v-if="drumType === 'cymbal'">
        <div class="cymbal-surface">
          <div class="cymbal-center"></div>
          <div class="cymbal-rings"></div>
          <span class="drum-label">{{ label }}</span>
        </div>
        <div class="cymbal-stand"></div>
      </template>

      <!-- Ride cymbal-specific design -->
      <template v-else-if="drumType === 'ride'">
        <div class="ride-surface">
          <div class="ride-center"></div>
          <div class="ride-rings"></div>
          <span class="drum-label">{{ label }}</span>
        </div>
        <div class="ride-stand"></div>
      </template>

      <!-- Hi-hat-specific design -->
      <template v-else-if="drumType === 'hihat'">
        <div class="hihat-top"></div>
        <div class="hihat-bottom"></div>
        <div class="hihat-stand"></div>
        <span class="drum-label">{{ label }}</span>
      </template>

      <!-- Tom drums -->
      <template v-else-if="['tom', 'hitom', 'midtom', 'floortom'].includes(drumType)">
        <div class="tom-surface">
          <div class="tom-rim"></div>
          <div class="tom-head"></div>
          <span class="drum-label">{{ label }}</span>
        </div>
        <div class="tom-body"></div>
      </template>

      <!-- Snare drum -->
      <template v-else-if="drumType === 'snare'">
        <div class="snare-surface">
          <div class="snare-rim"></div>
          <div class="snare-head">
            <div class="snare-lines"></div>
          </div>
          <span class="drum-label">{{ label }}</span>
        </div>
        <div class="snare-body"></div>
      </template>

      <!-- Kick drum -->
      <template v-else-if="drumType === 'kick'">
        <div class="kick-surface">
          <div class="kick-rim"></div>
          <div class="kick-head"></div>
          <span class="drum-label">{{ label }}</span>
        </div>
      </template>

      <!-- Fun sound pads -->
      <template v-else>
        <div class="fun-pad-surface">
          <span class="fun-icon">{{ icon || '🔊' }}</span>
          <span class="drum-label">{{ label }}</span>
        </div>
      </template>

      <!-- Glow effect when pressed -->
      <div class="drum-glow" v-if="isPressed"></div>
    </button>
  </div>
</template>

<script setup lang="ts">
interface DrumSound {
  id: string;
  name: string;
  sound: string;
  type?: string;
}

interface Props {
  drum: DrumSound;
  drumType: string;
  label: string;
  icon?: string;
  containerClass?: string;
  isPressed: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  press: [drum: DrumSound];
  release: [drum: DrumSound];
}>();

const handlePress = (event: Event) => {
  event.preventDefault();
  emit('press', props.drum);
};

const handleRelease = (event: Event) => {
  event.preventDefault();
  emit('release', props.drum);
};
</script>

<style scoped>
.drum-item {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drum-element {
  position: relative;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.drum-element:active {
  transform: scale(0.95);
}

.drum-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 120%;
  height: 120%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
  border-radius: 50%;
  animation: pulse 0.3s ease-out;
  pointer-events: none;
}

@keyframes pulse {
  0% {
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0.8;
  }
  100% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0;
  }
}

.drum-label {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  white-space: nowrap;
  background: var(--color-bg-primary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}

/* Cymbal Styles */
.cymbal .cymbal-surface {
  width: 80px;
  height: 80px;
  background: linear-gradient(145deg, #ffd700, #daa520);
  border-radius: 50%;
  position: relative;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3), 0 4px 15px rgba(0, 0, 0, 0.2);
}

.cymbal-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #8b7355;
  border-radius: 50%;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.cymbal-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border: 1px solid rgba(139, 115, 85, 0.3);
  border-radius: 50%;
}

.cymbal-rings::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 40px;
  height: 40px;
  border: 1px solid rgba(139, 115, 85, 0.2);
  border-radius: 50%;
}

.cymbal-stand {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 20px;
  background: linear-gradient(to bottom, #666, #333);
  border-radius: 2px;
}

/* Ride Cymbal Styles */
.ride .ride-surface {
  width: 90px;
  height: 90px;
  background: linear-gradient(145deg, #b8860b, #9a7209);
  border-radius: 50%;
  position: relative;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.3), 0 4px 15px rgba(0, 0, 0, 0.2);
}

.ride-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 14px;
  height: 14px;
  background: #654321;
  border-radius: 50%;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
}

.ride-rings {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70px;
  height: 70px;
  border: 1px solid rgba(101, 67, 33, 0.3);
  border-radius: 50%;
}

.ride-stand {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 25px;
  background: linear-gradient(to bottom, #666, #333);
  border-radius: 2px;
}

/* Hi-hat Styles */
.hihat .hihat-top {
  width: 70px;
  height: 70px;
  background: linear-gradient(145deg, #c0c0c0, #a0a0a0);
  border-radius: 50%;
  position: relative;
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 2;
}

.hihat-bottom {
  position: absolute;
  top: 6px;
  left: 50%;
  transform: translateX(-50%);
  width: 72px;
  height: 72px;
  background: linear-gradient(145deg, #999, #777);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  z-index: 1;
}

.hihat-stand {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 25px;
  background: linear-gradient(to bottom, #666, #333);
  border-radius: 3px;
}

/* Tom Styles */
.tom .tom-surface,
.hitom .tom-surface,
.midtom .tom-surface,
.floortom .tom-surface {
  width: 70px;
  height: 70px;
  position: relative;
}

.tom-rim {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #333, #555);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.tom-head {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  background: linear-gradient(145deg, #f5f5f5, #ddd);
  border-radius: 50%;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
}

.tom-body {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 20px;
  background: linear-gradient(to bottom, #444, #222);
  border-radius: 0 0 30px 30px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

/* Snare Styles */
.snare .snare-surface {
  width: 75px;
  height: 75px;
  position: relative;
}

.snare-rim {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #444, #666);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.snare-head {
  position: absolute;
  top: 4px;
  left: 4px;
  width: calc(100% - 8px);
  height: calc(100% - 8px);
  background: linear-gradient(145deg, #f8f8f8, #e0e0e0);
  border-radius: 50%;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.snare-lines {
  position: absolute;
  top: 50%;
  left: 10%;
  transform: translateY(-50%);
  width: 80%;
  height: 2px;
  background: repeating-linear-gradient(
    to right,
    #ccc 0px,
    #ccc 2px,
    transparent 2px,
    transparent 4px
  );
}

.snare-body {
  position: absolute;
  bottom: -15px;
  left: 50%;
  transform: translateX(-50%);
  width: 65px;
  height: 20px;
  background: linear-gradient(to bottom, #555, #333);
  border-radius: 0 0 32px 32px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

/* Kick Drum Styles */
.kick .kick-surface {
  width: 100px;
  height: 100px;
  position: relative;
}

.kick-rim {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(145deg, #222, #444);
  border-radius: 50%;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.kick-head {
  position: absolute;
  top: 6px;
  left: 6px;
  width: calc(100% - 12px);
  height: calc(100% - 12px);
  background: linear-gradient(145deg, #111, #333);
  border-radius: 50%;
  box-shadow: inset 0 3px 15px rgba(0, 0, 0, 0.5);
}

/* Fun Sound Pad Styles */
.fun-pad-surface {
  width: 60px;
  height: 60px;
  background: linear-gradient(145deg, #ff6b6b, #ee5a52);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
}

.drum-element:hover .fun-pad-surface {
  background: linear-gradient(145deg, #ff5252, #e53935);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.fun-icon {
  font-size: 1.5rem;
  line-height: 1;
}

/* Container-specific positioning */
.cymbal-container {
  grid-area: cymbal;
}

.ride-container {
  grid-area: ride;
}

.hihat-container {
  grid-area: hihat;
}

.tom-container {
  grid-area: hitom;
}

.snare-container {
  grid-area: snare;
}

.midtom-container {
  grid-area: midtom;
}

.floortom-container {
  grid-area: floortom;
}

.kick-container {
  grid-area: kick;
}

@media (max-width: 768px) {
  .drum-element {
    transform: scale(0.8);
  }
  
  .drum-label {
    font-size: 0.625rem;
    bottom: -20px;
  }
}
</style>