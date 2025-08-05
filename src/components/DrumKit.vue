<template>
  <div class="drum-kit">
    <!-- 드럼 통계 -->
    <DrumStats :stats="playStats" />

    <!-- 실제 드럼세트 레이아웃 -->
    <div class="drum-set-container">
      <!-- 실제 드럼세트 -->
      <DrumStage
        :basic-drums="basicDrums"
        :pressed-pads="pressedPads"
        @drum-press="handleDrumPress"
        @drum-release="handleDrumRelease"
      />

      <!-- 재미있는 효과음 패널 -->
      <FunSoundsPanel
        :fun-sounds="funSounds"
        :pressed-pads="pressedPads"
        @fun-sound-press="handleFunSoundPress"
        @fun-sound-release="handleFunSoundRelease"
      />
    </div>

    <!-- 키보드 가이드 -->
    <KeyboardGuide />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useMusic } from '@/composables/useMusic';
import { useCarSounds, type FunSound } from '@/composables/useCarSounds';
import DrumStats from '@/components/music/DrumStats.vue';
import DrumStage from '@/components/music/DrumStage.vue';
import FunSoundsPanel from '@/components/music/FunSoundsPanel.vue';
import KeyboardGuide from '@/components/music/KeyboardGuide.vue';

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
const animatePad = (_padId: string) => {
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

/* 실제 드럼세트 컨테이너 */
.drum-set-container {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 40px;
  align-items: start;
}











/* 반응형 디자인 */
@media (max-width: 1024px) {
  .drum-set-container {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .drum-set-container {
    gap: 20px;
  }
}
</style>