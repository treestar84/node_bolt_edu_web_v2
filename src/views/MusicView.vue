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
                <h3 class="instrument-name">{{ $t(instrument.name) }}</h3>
                <p class="instrument-description">{{ $t(instrument.description) }}</p>
              </div>
              <div class="play-overlay">
                <span class="play-icon"></span>
                <span class="play-text">{{$t('music.play')}}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 피아노 연주 화면 -->
        <div v-else-if="music.gameState.value === 'piano'" class="piano-game">
          <div class="game-header">
            <button @click="music.goBack" class="btn btn-secondary back-btn">
              ← {{$t('common.back')}}
            </button>
            <div class="header-center">
              <h2 class="instrument-title">{{$t('music.piano.name')}}</h2>
              <div class="mode-toggle">
                <button 
                  @click="music.setMode('free')"
                  class="mode-btn"
                  :class="{ active: music.playMode.value === 'free' }"
                >
                  {{$t('music.freePlay')}}
                </button>
                <button 
                  @click="music.setMode('guide')"
                  class="mode-btn"
                  :class="{ active: music.playMode.value === 'guide' }"
                >
                  {{$t('music.guideMode')}}
                </button>
              </div>
            </div>
            <button @click="music.stopAllSounds" class="btn btn-secondary stop-btn">
              {{$t('music.stop')}}
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
              ← {{$t('common.back')}}
            </button>
            <div class="header-center">
              <h2 class="instrument-title">{{$t('music.drums.name')}}</h2>
            </div>
            <button @click="music.stopAllSounds" class="btn btn-secondary stop-btn">
              {{$t('music.stop')}}
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
              ← {{$t('common.back')}}
            </button>
            <div class="header-center">
              <h2 class="instrument-title">{{$t('music.violin.name')}}</h2>
            </div>
            <button @click="music.stopAllSounds" class="btn btn-secondary stop-btn">
              {{$t('music.stop')}}
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
  background: var(--color-bg-primary);
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
  color: var(--color-text-primary);
}

.page-description {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
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
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 32px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

.instrument-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
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
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

.instrument-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: #007bff;
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
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
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  padding: 20px;
  box-shadow: var(--shadow-card);
}

.header-center {
  flex: 1;
  text-align: center;
  margin: 0 20px;
}

.instrument-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--color-text-primary);
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
  color: #333;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.mode-btn.active {
  background: #007bff;
  color: white;
  border-color: transparent;
}

.mode-btn:hover:not(.active) {
  border-color: #007bff;
  color: #007bff;
  background: #f8f9fa;
}

/* 악기 컨테이너들 */
.piano-container,
.drum-container,
.violin-container {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-card);
}

.piano-placeholder,
.car-sounds-placeholder,
.violin-placeholder {
  text-align: center;
  padding: 60px 20px;
  color: var(--color-text-secondary);
  font-size: 1.2rem;
  border: 2px dashed var(--color-border);
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