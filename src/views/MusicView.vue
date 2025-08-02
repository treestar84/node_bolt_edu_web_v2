<template>
  <div class="music-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <!-- 악기 선택 화면 -->
        <div v-if="music.gameState.value === 'selection'" class="music-selection">
          <div class="page-header">
            <h1 class="page-title">{{$t('music.title')}}</h1>
            <p class="page-description">
              {{$t('music.description')}}
            </p>
          </div>

          <!-- 악기 선택 카드들 -->
          <div class="instrument-options">
            <div 
              v-for="instrument in instruments" 
              :key="instrument.id"
              @click="music.selectInstrument(instrument)"
              class="instrument-card"
            >
              <div class="instrument-icon">
                <span class="icon">{{ instrument.icon }}</span>
              </div>
              <div class="instrument-info">
                <h3 class="instrument-name">{{ instrument.name }}</h3>
                <p class="instrument-description">{{ instrument.description }}</p>
              </div>
              <div class="play-overlay">
                <span class="play-icon">🎵</span>
                <span class="play-text">{{$t('music.play')}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 피아노 연주 화면 -->
        <div v-else-if="music.gameState.value === 'piano'" class="piano-game">
          <div class="game-header">
            <button @click="music.goBack" class="btn btn-secondary back-btn">
              ← {{$t('music.back')}}
            </button>
            <div class="header-center">
              <h2 class="instrument-title">🎹 피아노</h2>
              <div class="mode-toggle">
                <button 
                  @click="music.setMode('free')"
                  class="mode-btn"
                  :class="{ active: music.playMode.value === 'free' }"
                >
                  자유 연주
                </button>
                <button 
                  @click="music.setMode('guide')"
                  class="mode-btn"
                  :class="{ active: music.playMode.value === 'guide' }"
                >
                  가이드 모드
                </button>
              </div>
            </div>
            <button @click="music.stopAllSounds" class="btn btn-secondary stop-btn">
              🔇 정지
            </button>
          </div>

          <!-- 피아노 컴포넌트 영역 -->
          <div class="piano-container">
            <PianoInstrument :playMode="music.playMode.value" />
          </div>
        </div>

        <!-- 드럼킷 화면 -->
        <div v-else-if="music.gameState.value === 'car-sounds'" class="drum-game">
          <div class="game-header">
            <button @click="music.goBack" class="btn btn-secondary back-btn">
              ← {{$t('music.back')}}
            </button>
            <div class="header-center">
              <h2 class="instrument-title">🥁 드럼킷 & 재미있는 소리</h2>
            </div>
            <button @click="music.stopAllSounds" class="btn btn-secondary stop-btn">
              🔇 정지
            </button>
          </div>

          <!-- 드럼킷 컴포넌트 영역 -->
          <div class="drum-container">
            <DrumKit />
          </div>
        </div>

        <!-- 바이올린 연주 화면 -->
        <div v-else-if="music.gameState.value === 'violin'" class="violin-game">
          <div class="game-header">
            <button @click="music.goBack" class="btn btn-secondary back-btn">
              ← {{$t('music.back')}}
            </button>
            <div class="header-center">
              <h2 class="instrument-title">🎻 바이올린</h2>
            </div>
            <button @click="music.stopAllSounds" class="btn btn-secondary stop-btn">
              🔇 정지
            </button>
          </div>

          <!-- 바이올린 컴포넌트 영역 -->
          <div class="violin-container">
            <ViolinInstrument />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import Navigation from '@/components/Navigation.vue';
import PianoInstrument from '@/components/PianoInstrument.vue';
import DrumKit from '@/components/DrumKit.vue';
import ViolinInstrument from '@/components/ViolinInstrument.vue';
import { useMusic } from '@/composables/useMusic';

const music = useMusic();

// 악기 목록
const instruments = computed(() => [
  {
    id: 'piano',
    name: 'music.piano.name',
    description: 'music.piano.description',
    icon: '🎹'
  },
  {
    id: 'car-sounds',
    name: 'music.drums.name',
    description: 'music.drums.description',
    icon: '🥁'
  },
  {
    id: 'violin',
    name: 'music.violin.name',
    description: 'music.violin.description',
    icon: '🎻'
  }
]);
</script>

<style scoped>
.music-view {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.main-content {
  padding: 40px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: white;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.page-description {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 악기 선택 화면 */
.instrument-options {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 32px;
  margin-bottom: 40px;
}

.instrument-card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
}

.instrument-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.instrument-icon {
  text-align: center;
  margin-bottom: 24px;
}

.instrument-icon .icon {
  font-size: 4rem;
  display: block;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.instrument-info {
  text-align: center;
  margin-bottom: 20px;
}

.instrument-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 12px;
}

.instrument-description {
  font-size: 1rem;
  color: #636e72;
  line-height: 1.5;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #00b894, #00cec9);
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: 0 8px 25px rgba(0, 184, 148, 0.4);
}

.instrument-card:hover .play-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.05);
}

.play-icon {
  font-size: 1.5rem;
}

.play-text {
  color: white;
  font-weight: 600;
  font-size: 1rem;
}

/* 게임 헤더 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.header-center {
  flex: 1;
  text-align: center;
  margin: 0 20px;
}

.instrument-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 16px;
}

.mode-toggle {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.mode-btn {
  padding: 8px 16px;
  border: 2px solid #ddd;
  border-radius: 20px;
  background: white;
  color: #636e72;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-color: transparent;
}

.mode-btn:hover:not(.active) {
  border-color: #667eea;
  color: #667eea;
}

/* 악기 컨테이너들 */
.piano-container,
.drum-container,
.violin-container {
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 40px;
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

.piano-placeholder,
.car-sounds-placeholder,
.violin-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: #636e72;
  font-size: 1.2rem;
  border: 2px dashed #ddd;
  border-radius: 12px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 20px 0;
  }
  
  .page-title {
    font-size: 2rem;
  }
  
  .instrument-options {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .instrument-card {
    padding: 24px;
  }
  
  .game-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .header-center {
    margin: 0;
  }
}

@media (max-width: 480px) {
  .instrument-card {
    padding: 20px;
  }
  
  .instrument-icon .icon {
    font-size: 3rem;
  }
  
  .instrument-name {
    font-size: 1.3rem;
  }
}
</style>