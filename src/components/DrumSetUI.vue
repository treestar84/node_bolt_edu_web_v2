<template>
  <div class="drum-set-container">
    <div class="drum-set">
      <!-- Hi-Hat Cymbal -->
      <div 
        class="cymbal hi-hat"
        :class="{ active: activeElements.has('hihat') }"
        @click="playDrum('hihat')"
        @mousedown="startHit('hihat')"
        @mouseup="endHit('hihat')"
        @mouseleave="endHit('hihat')"
      >
        <div class="cymbal-surface"></div>
        <div class="cymbal-stand"></div>
      </div>

      <!-- Crash Cymbal Left -->
      <div 
        class="cymbal crash-left"
        :class="{ active: activeElements.has('crash1') }"
        @click="playDrum('crash1')"
        @mousedown="startHit('crash1')"
        @mouseup="endHit('crash1')"
        @mouseleave="endHit('crash1')"
      >
        <div class="cymbal-surface"></div>
        <div class="cymbal-stand"></div>
      </div>

      <!-- Crash Cymbal Right -->
      <div 
        class="cymbal crash-right"
        :class="{ active: activeElements.has('crash2') }"
        @click="playDrum('crash2')"
        @mousedown="startHit('crash2')"
        @mouseup="endHit('crash2')"
        @mouseleave="endHit('crash2')"
      >
        <div class="cymbal-surface"></div>
        <div class="cymbal-stand"></div>
      </div>

      <!-- Ride Cymbal -->
      <div 
        class="cymbal ride"
        :class="{ active: activeElements.has('ride') }"
        @click="playDrum('ride')"
        @mousedown="startHit('ride')"
        @mouseup="endHit('ride')"
        @mouseleave="endHit('ride')"
      >
        <div class="cymbal-surface"></div>
        <div class="cymbal-stand"></div>
      </div>

      <!-- Tom 1 -->
      <div 
        class="drum tom tom1"
        :class="{ active: activeElements.has('tom1') }"
        @click="playDrum('tom1')"
        @mousedown="startHit('tom1')"
        @mouseup="endHit('tom1')"
        @mouseleave="endHit('tom1')"
      >
        <div class="drum-head"></div>
        <div class="drum-shell"></div>
        <div class="drum-hardware"></div>
      </div>

      <!-- Tom 2 -->
      <div 
        class="drum tom tom2"
        :class="{ active: activeElements.has('tom2') }"
        @click="playDrum('tom2')"
        @mousedown="startHit('tom2')"
        @mouseup="endHit('tom2')"
        @mouseleave="endHit('tom2')"
      >
        <div class="drum-head"></div>
        <div class="drum-shell"></div>
        <div class="drum-hardware"></div>
      </div>

      <!-- Snare Drum -->
      <div 
        class="drum snare"
        :class="{ active: activeElements.has('snare') }"
        @click="playDrum('snare')"
        @mousedown="startHit('snare')"
        @mouseup="endHit('snare')"
        @mouseleave="endHit('snare')"
      >
        <div class="drum-head"></div>
        <div class="drum-shell snare-shell"></div>
        <div class="drum-hardware"></div>
        <div class="snare-wires"></div>
      </div>

      <!-- Floor Tom -->
      <div 
        class="drum floor-tom"
        :class="{ active: activeElements.has('floortom') }"
        @click="playDrum('floortom')"
        @mousedown="startHit('floortom')"
        @mouseup="endHit('floortom')"
        @mouseleave="endHit('floortom')"
      >
        <div class="drum-head"></div>
        <div class="drum-shell"></div>
        <div class="drum-hardware"></div>
        <div class="drum-legs"></div>
      </div>

      <!-- Kick Drum -->
      <div 
        class="drum kick"
        :class="{ active: activeElements.has('kick') }"
        @click="playDrum('kick')"
        @mousedown="startHit('kick')"
        @mouseup="endHit('kick')"
        @mouseleave="endHit('kick')"
      >
        <div class="drum-head kick-head"></div>
        <div class="drum-shell kick-shell"></div>
        <div class="drum-hardware"></div>
        <div class="kick-pedal"></div>
      </div>

      <!-- Drum Sticks (Visual) -->
      <div class="drum-sticks" :class="{ playing: isPlaying }">
        <div class="stick left-stick"></div>
        <div class="stick right-stick"></div>
      </div>
    </div>

    <!-- Control Panel -->
    <div class="control-panel">
      <div class="volume-control">
        <label>{{ t('drumSet.volume') }}</label>
        <input 
          type="range" 
          v-model="volume" 
          min="0" 
          max="100" 
          class="volume-slider"
        />
      </div>
      <div class="tempo-control">
        <label>{{ t('drumSet.tempo') }}</label>
        <input 
          type="range" 
          v-model="tempo" 
          min="60" 
          max="180" 
          class="tempo-slider"
        />
        <span>{{ tempo }} BPM</span>
      </div>
      <button 
        class="metronome-btn"
        :class="{ active: metronomeActive }"
        @click="toggleMetronome"
      >
        {{ t('drumSet.metronome') }}
      </button>
      
      <!-- Drum Pattern Buttons -->
      <div class="pattern-controls">
        <h3>{{ t('drumSet.patterns') || '드럼 패턴' }}</h3>
        <div class="pattern-buttons">
          <button 
            class="pattern-btn"
            @click="playPattern('rock')"
            :disabled="isPatternPlaying"
          >
            🎸 록
          </button>
          <button 
            class="pattern-btn"
            @click="playPattern('jazz')"
            :disabled="isPatternPlaying"
          >
            🎷 재즈
          </button>
          <button 
            class="pattern-btn"
            @click="playPattern('funk')"
            :disabled="isPatternPlaying"
          >
            🕺 펑크
          </button>
          <button 
            class="pattern-btn"
            @click="playPattern('latin')"
            :disabled="isPatternPlaying"
          >
            💃 라틴
          </button>
          <button 
            class="pattern-btn stop-btn"
            @click="stopPattern"
            :disabled="!isPatternPlaying"
          >
            ⏹️ 정지
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// Reactive state
const activeElements = ref<Set<string>>(new Set())
const isPlaying = ref(false)
const volume = ref(75)
const tempo = ref(120)
const metronomeActive = ref(false)
const isPatternPlaying = ref(false)
const patternInterval = ref<NodeJS.Timeout | null>(null)

// Audio contexts and buffers
const audioContext = ref<AudioContext | null>(null)
const drumSounds = ref<{ [key: string]: AudioBuffer | null }>({})
const metronomeInterval = ref<NodeJS.Timeout | null>(null)

// Drum sound URLs (using Web Audio API compatible sounds)
const drumSoundUrls = {
  kick: '/drum-sounds/kick.wav',
  snare: '/drum-sounds/snare.wav',
  hihat: '/drum-sounds/hihat.wav',
  crash1: '/drum-sounds/crash.wav',
  crash2: '/drum-sounds/crash2.wav',
  ride: '/drum-sounds/ride.wav',
  tom1: '/drum-sounds/tom1.wav',
  tom2: '/drum-sounds/tom2.wav',
  floortom: '/drum-sounds/floortom.wav'
}

// Initialize audio
onMounted(async () => {
  try {
    audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)()
    await loadDrumSounds()
  } catch (error) {
    console.warn('Audio context initialization failed:', error)
  }
})

onUnmounted(() => {
  if (metronomeInterval.value) {
    clearInterval(metronomeInterval.value)
  }
  if (audioContext.value) {
    audioContext.value.close()
  }
})

// Load drum sounds
async function loadDrumSounds() {
  if (!audioContext.value) return

  for (const [drumType, url] of Object.entries(drumSoundUrls)) {
    try {
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await audioContext.value.decodeAudioData(arrayBuffer)
      drumSounds.value[drumType] = audioBuffer
    } catch (error) {
      console.warn(`Failed to load sound for ${drumType}:`, error)
      drumSounds.value[drumType] = null
    }
  }
}

// Play drum sound
function playDrum(drumType: string) {
  if (!audioContext.value || !drumSounds.value[drumType]) {
    // Fallback: create a simple tone
    createTone(drumType)
    return
  }

  try {
    const source = audioContext.value.createBufferSource()
    const gainNode = audioContext.value.createGain()
    
    source.buffer = drumSounds.value[drumType]
    gainNode.gain.value = volume.value / 100
    
    source.connect(gainNode)
    gainNode.connect(audioContext.value.destination)
    
    source.start()
  } catch (error) {
    console.warn('Error playing drum sound:', error)
    createTone(drumType)
  }
}

// Fallback tone creation
function createTone(drumType: string) {
  if (!audioContext.value) return

  const oscillator = audioContext.value.createOscillator()
  const gainNode = audioContext.value.createGain()

  // Different frequencies for different drums
  const frequencies: { [key: string]: number } = {
    kick: 60,
    snare: 200,
    hihat: 8000,
    crash1: 5000,
    crash2: 4500,
    ride: 3000,
    tom1: 150,
    tom2: 120,
    floortom: 80
  }

  oscillator.frequency.value = frequencies[drumType] || 200
  oscillator.type = drumType === 'hihat' || drumType.includes('crash') ? 'sawtooth' : 'sine'
  
  gainNode.gain.setValueAtTime(volume.value / 100, audioContext.value.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.value.currentTime + 0.3)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.value.destination)

  oscillator.start()
  oscillator.stop(audioContext.value.currentTime + 0.3)
}

// Visual feedback
function startHit(drumType: string) {
  if (activeElements.value.has(drumType)) return; // 이미 눌려있으면 무시
  activeElements.value.add(drumType)
  isPlaying.value = true
}

function endHit(drumType: string) {
  activeElements.value.delete(drumType)
  // 모든 드럼이 해제되면 isPlaying을 false로
  setTimeout(() => {
    if (activeElements.value.size === 0) {
      isPlaying.value = false
    }
  }, 200)
}

// Metronome functionality
function toggleMetronome() {
  metronomeActive.value = !metronomeActive.value
  
  if (metronomeActive.value) {
    const interval = 60000 / tempo.value
    metronomeInterval.value = setInterval(() => {
      createMetronomeTick()
    }, interval)
  } else {
    if (metronomeInterval.value) {
      clearInterval(metronomeInterval.value)
      metronomeInterval.value = null
    }
  }
}

function createMetronomeTick() {
  if (!audioContext.value) return

  const oscillator = audioContext.value.createOscillator()
  const gainNode = audioContext.value.createGain()

  oscillator.frequency.value = 1000
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.3, audioContext.value.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.value.currentTime + 0.1)

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.value.destination)

  oscillator.start()
  oscillator.stop(audioContext.value.currentTime + 0.1)
}

// Keyboard controls
onMounted(() => {
  const keyMap: { [key: string]: string } = {
    'Space': 'kick',
    'KeyA': 'snare',
    'KeyS': 'hihat',
    'KeyD': 'crash1',
    'KeyF': 'crash2',
    'KeyG': 'ride',
    'KeyH': 'tom1',
    'KeyJ': 'tom2',
    'KeyK': 'floortom'
  }

  function handleKeyDown(event: KeyboardEvent) {
    const drumType = keyMap[event.code]
    if (drumType && !activeElements.value.has(drumType)) {
      event.preventDefault()
      startHit(drumType)
      playDrum(drumType)
    }
  }

  function handleKeyUp(event: KeyboardEvent) {
    const drumType = keyMap[event.code]
    if (drumType) {
      endHit(drumType)
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
    stopPattern() // 패턴 정지
  })
})

// Drum patterns (beats in 16th notes)
const drumPatterns = {
  rock: [
    { beat: 0, drums: ['kick', 'hihat'] },
    { beat: 4, drums: ['hihat'] },
    { beat: 8, drums: ['snare', 'hihat'] },
    { beat: 12, drums: ['hihat'] }
  ],
  jazz: [
    { beat: 0, drums: ['kick', 'ride'] },
    { beat: 6, drums: ['ride'] },
    { beat: 8, drums: ['snare'] },
    { beat: 10, drums: ['ride'] },
    { beat: 14, drums: ['kick'] }
  ],
  funk: [
    { beat: 0, drums: ['kick', 'hihat'] },
    { beat: 2, drums: ['hihat'] },
    { beat: 6, drums: ['snare'] },
    { beat: 8, drums: ['hihat'] },
    { beat: 10, drums: ['kick'] },
    { beat: 14, drums: ['snare', 'hihat'] }
  ],
  latin: [
    { beat: 0, drums: ['kick', 'ride'] },
    { beat: 4, drums: ['tom1'] },
    { beat: 8, drums: ['snare', 'ride'] },
    { beat: 12, drums: ['tom2', 'kick'] }
  ]
}

// Pattern playback functions
function playPattern(patternName: keyof typeof drumPatterns) {
  if (isPatternPlaying.value) return
  
  isPatternPlaying.value = true
  let currentBeat = 0
  const pattern = drumPatterns[patternName]
  const beatLength = 60000 / (tempo.value * 4) // 16th note in ms
  
  console.log(`🥁 Starting ${patternName} pattern at ${tempo.value} BPM`)
  
  patternInterval.value = setInterval(() => {
    // Check if any drums should play at this beat
    const currentPatternBeat = pattern.find(p => p.beat === currentBeat % 16)
    
    if (currentPatternBeat) {
      // Play all drums for this beat simultaneously
      currentPatternBeat.drums.forEach(drum => {
        playDrum(drum)
        startHit(drum)
        setTimeout(() => endHit(drum), 100)
      })
    }
    
    currentBeat++
  }, beatLength)
}

function stopPattern() {
  if (patternInterval.value) {
    clearInterval(patternInterval.value)
    patternInterval.value = null
  }
  isPatternPlaying.value = false
  
  // Clear any active visual elements
  activeElements.value.clear()
  isPlaying.value = false
  
  console.log('🛑 Pattern stopped')
}
</script>

<style scoped>
.drum-set-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  min-height: 100vh;
  overflow: hidden;
}

.drum-set {
  position: relative;
  width: 800px;
  height: 600px;
  perspective: 1200px;
  margin-bottom: 2rem;
}

/* Cymbals */
.cymbal {
  position: absolute;
  cursor: pointer;
  transition: all 0.1s ease;
  transform-style: preserve-3d;
}

.cymbal.active {
  transform: rotateX(-10deg) scale(1.05);
}

.cymbal-surface {
  width: 80px;
  height: 80px;
  background: radial-gradient(ellipse at 30% 30%, #ffd700, #b8860b, #8b7355);
  border-radius: 50%;
  position: relative;
  box-shadow: 
    0 0 20px rgba(255, 215, 0, 0.3),
    inset 0 0 20px rgba(0, 0, 0, 0.2);
  border: 2px solid #daa520;
}

.cymbal-surface::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  background: #8b7355;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.5);
}

.cymbal-surface::after {
  content: 'IMPACT';
  position: absolute;
  top: 20%;
  left: 50%;
  transform: translate(-50%, -50%) rotate(-15deg);
  font-size: 8px;
  font-weight: bold;
  color: #8b7355;
  text-shadow: 0 0 2px rgba(0, 0, 0, 0.5);
}

.cymbal-stand {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 6px;
  height: 60px;
  background: linear-gradient(to bottom, #c0c0c0, #808080);
  transform: translateX(-50%);
}

/* Cymbal positions */
.hi-hat {
  top: 50px;
  left: 150px;
}

.hi-hat .cymbal-surface {
  width: 60px;
  height: 60px;
}

.crash-left {
  top: 20px;
  left: 50px;
}

.crash-right {
  top: 30px;
  right: 50px;
}

.ride {
  top: 80px;
  right: 120px;
}

.ride .cymbal-surface {
  width: 90px;
  height: 90px;
}

/* Drums */
.drum {
  position: absolute;
  cursor: pointer;
  transition: all 0.1s ease;
  transform-style: preserve-3d;
}

.drum.active {
  transform: scale(1.05) translateY(-5px);
}

.drum.active .drum-head {
  background: radial-gradient(ellipse at 30% 30%, #ffaa44, #ff8800, #cc6600);
  box-shadow: 
    0 0 30px rgba(255, 136, 0, 0.6),
    inset 0 0 20px rgba(0, 0, 0, 0.3);
}

.drum-head {
  background: radial-gradient(ellipse at 30% 30%, #ff9933, #ff7700, #dd5500);
  border: 3px solid #cc6600;
  border-radius: 50%;
  position: relative;
  box-shadow: 
    0 0 20px rgba(255, 119, 0, 0.4),
    inset 0 0 15px rgba(0, 0, 0, 0.2);
  transition: all 0.1s ease;
}

.drum-head::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80%;
  height: 80%;
  background: radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.drum-shell {
  position: absolute;
  top: 100%;
  left: 50%;
  background: linear-gradient(to bottom, #ff7700, #cc5500, #aa4400);
  transform: translateX(-50%);
  border-radius: 0 0 10px 10px;
  box-shadow: 
    0 5px 15px rgba(0, 0, 0, 0.3),
    inset 0 0 10px rgba(0, 0, 0, 0.2);
}

.drum-hardware {
  position: absolute;
  top: 50%;
  left: -15px;
  width: 8px;
  height: 30px;
  background: linear-gradient(to bottom, #e0e0e0, #a0a0a0);
  border-radius: 4px;
  transform: translateY(-50%);
}

.drum-hardware::after {
  content: '';
  position: absolute;
  top: 50%;
  right: -100%;
  width: 8px;
  height: 30px;
  background: linear-gradient(to bottom, #e0e0e0, #a0a0a0);
  border-radius: 4px;
  transform: translateY(-50%);
}

/* Specific drum styling */
.snare {
  top: 250px;
  left: 250px;
}

.snare .drum-head,
.snare .drum-shell {
  width: 120px;
  height: 120px;
}

.snare .drum-shell {
  height: 60px;
}

.snare-wires {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 100px;
  height: 2px;
  background: repeating-linear-gradient(
    90deg,
    #c0c0c0 0px,
    #c0c0c0 2px,
    transparent 2px,
    transparent 4px
  );
  transform: translateX(-50%);
}

.tom1 {
  top: 150px;
  left: 320px;
}

.tom1 .drum-head,
.tom1 .drum-shell {
  width: 100px;
  height: 100px;
}

.tom1 .drum-shell {
  height: 50px;
}

.tom2 {
  top: 180px;
  left: 420px;
}

.tom2 .drum-head,
.tom2 .drum-shell {
  width: 110px;
  height: 110px;
}

.tom2 .drum-shell {
  height: 55px;
}

.floor-tom {
  top: 280px;
  right: 150px;
}

.floor-tom .drum-head,
.floor-tom .drum-shell {
  width: 140px;
  height: 140px;
}

.floor-tom .drum-shell {
  height: 70px;
}

.drum-legs {
  position: absolute;
  top: 100%;
  left: 20%;
  width: 6px;
  height: 80px;
  background: linear-gradient(to bottom, #c0c0c0, #808080);
}

.drum-legs::after {
  content: '';
  position: absolute;
  left: 200%;
  width: 6px;
  height: 80px;
  background: linear-gradient(to bottom, #c0c0c0, #808080);
}

.kick {
  top: 350px;
  left: 300px;
}

.kick-head {
  width: 180px;
  height: 180px;
  background: radial-gradient(ellipse at 30% 30%, #ff9933, #ff7700, #dd5500);
}

.kick-shell {
  width: 180px;
  height: 100px;
  background: linear-gradient(to bottom, #ff7700, #cc5500, #aa4400);
}

.kick-pedal {
  position: absolute;
  bottom: -20px;
  left: 50%;
  width: 60px;
  height: 15px;
  background: linear-gradient(to right, #404040, #606060);
  border-radius: 5px;
  transform: translateX(-50%);
}

/* Drum Sticks */
.drum-sticks {
  position: absolute;
  top: 200px;
  left: 200px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.drum-sticks.playing {
  opacity: 1;
}

.stick {
  position: absolute;
  width: 4px;
  height: 80px;
  background: linear-gradient(to bottom, #d2b48c, #8b7355);
  border-radius: 2px 2px 8px 8px;
  transform-origin: bottom center;
}

.left-stick {
  transform: rotate(-30deg);
  animation: stick-hit-left 0.2s ease;
}

.right-stick {
  left: 20px;
  transform: rotate(30deg);
  animation: stick-hit-right 0.2s ease;
}

@keyframes stick-hit-left {
  0% { transform: rotate(-30deg) rotateX(0deg); }
  50% { transform: rotate(-30deg) rotateX(-30deg); }
  100% { transform: rotate(-30deg) rotateX(0deg); }
}

@keyframes stick-hit-right {
  0% { transform: rotate(30deg) rotateX(0deg); }
  50% { transform: rotate(30deg) rotateX(-30deg); }
  100% { transform: rotate(30deg) rotateX(0deg); }
}

/* Control Panel */
.control-panel {
  background: rgba(0, 0, 0, 0.8);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  gap: 2rem;
  align-items: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.volume-control,
.tempo-control {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.volume-control label,
.tempo-control label {
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 500;
}

.volume-slider,
.tempo-slider {
  width: 120px;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  outline: none;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb,
.tempo-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  background: #ff7700;
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(255, 119, 0, 0.3);
}

.metronome-btn {
  padding: 0.75rem 1.5rem;
  background: rgba(255, 119, 0, 0.2);
  border: 2px solid #ff7700;
  border-radius: 8px;
  color: #ff7700;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.metronome-btn:hover {
  background: rgba(255, 119, 0, 0.3);
  transform: translateY(-2px);
}

.metronome-btn.active {
  background: #ff7700;
  color: white;
  box-shadow: 0 0 20px rgba(255, 119, 0, 0.4);
}

/* Pattern Controls */
.pattern-controls {
  margin-top: 1.5rem;
  text-align: center;
}

.pattern-controls h3 {
  color: #ffffff;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
}

.pattern-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.pattern-btn {
  padding: 0.75rem 1.25rem;
  background: linear-gradient(145deg, #4a5568, #2d3748);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  min-width: 80px;
}

.pattern-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #5a6578, #3d4758);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
}

.pattern-btn:active {
  transform: translateY(0);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.pattern-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.pattern-btn.stop-btn {
  background: linear-gradient(145deg, #e53e3e, #c53030);
}

.pattern-btn.stop-btn:hover:not(:disabled) {
  background: linear-gradient(145deg, #f56565, #e53e3e);
}

/* Responsive design */
@media (max-width: 900px) {
  .drum-set {
    width: 600px;
    height: 450px;
    transform: scale(0.8);
  }

  .control-panel {
    flex-direction: column;
    gap: 1rem;
  }
}

@media (max-width: 700px) {
  .drum-set {
    width: 500px;
    height: 375px;
    transform: scale(0.6);
  }
}
</style>