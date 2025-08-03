<template>
  <div class="coloring-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <!-- 색칠공부 선택 화면 -->
        <div v-if="coloring.gameState.value === 'selection'" class="coloring-selection">
          <div class="page-header">
            <h1 class="page-title">{{$t('coloring.title')}}</h1>
            <p class="page-description">
              {{$t('coloring.description')}}
            </p>
            
            <!-- 갤러리 버튼 -->
            <div v-if="authStore.isAuthenticated" class="header-actions">
              <a href="/coloring/gallery" class="btn btn-secondary gallery-btn">
            🖼️ {{$t('coloring.gallery')}}
          </a>
            </div>
          </div>

          <!-- 색칠할 이미지 선택 -->
          <div class="coloring-options">
            <div 
              v-for="word in coloringWords" 
              :key="word.id"
              @click="coloring.selectImageForColoring(word)"
              class="coloring-option-card"
            >
              <div class="option-image">
                <img :src="getImageUrl(word.imageUrl)" :alt="getCurrentName(word)" />
                <div class="coloring-overlay">
                  <span class="coloring-icon">🎨</span>
                  <span class="coloring-text">{{$t('coloring.start')}}</span>
                </div>
              </div>
              <div class="option-info">
                <h3 class="option-name">{{ getCurrentName(word) }}</h3>
                <div class="difficulty-badge">
                  {{$t('coloring.easy')}}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 색칠하기 화면 -->
        <div v-else-if="coloring.gameState.value === 'coloring'" class="coloring-game">
          <div class="game-header">
            <button @click="coloring.goHome" class="btn btn-secondary back-btn">
              ← {{$t('coloring.back')}}
            </button>
            <div class="header-center">
              <h2 class="coloring-title">{{ coloring.getCurrentName(coloring.selectedWord.value!) }} {{$t('coloring.title')}}</h2>
              <div class="progress-container">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: coloring.coloringProgress.value + '%' }"></div>
                </div>
                <span class="progress-text">{{ coloring.coloringProgress.value }}% 완성</span>
              </div>
              <div class="completion-controls">
                <button 
                  @click="coloring.completeColoringManually" 
                  class="btn btn-success complete-btn"
                  :disabled="coloring.coloringProgress.value < 5"
                >
                  ✅ 색칠 완료!
                </button>
              </div>
            </div>
            <button @click="coloring.canvas.clearCanvas" class="btn btn-secondary clear-btn">
              🗑️ {{$t('coloring.clear')}}
            </button>
          </div>

          <div class="coloring-container">
            <!-- 색상 팔레트 -->
            <div class="color-palette">
              <h3 class="palette-title">{{$t('coloring.colors')}}</h3>
              <div class="color-grid">
                <div 
                  v-for="color in coloring.colorPalette" 
                  :key="color.name"
                  @click="coloring.selectColor(color)"
                  class="color-item"
                  :class="{ active: coloring.selectedColor.value?.name === color.name }"
                  :style="{ backgroundColor: color.value }"
                  :title="color.displayName"
                >
                  <span v-if="coloring.selectedColor.value?.name === color.name" class="selected-check">✓</span>
                </div>
              </div>
              
              <!-- 브러쉬 크기 조절 -->
              <div class="brush-size">
                <h4>{{$t('coloring.brushSize')}}</h4>
                <div class="brush-options">
                  <button 
                    v-for="size in coloring.brushSizes" 
                    :key="size.name"
                    @click="coloring.selectBrushSize(size)"
                    class="brush-btn"
                    :class="{ active: coloring.selectedBrushSize.value?.name === size.name }"
                  >
                    <div class="brush-preview" :style="{ width: size.preview + 'px', height: size.preview + 'px' }"></div>
                    <span>{{size.displayName}}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 캔버스 영역 -->
            <div class="canvas-area">
              <div class="canvas-container" ref="canvasContainer" 
                   :style="{ 
                     width: coloring.canvas.canvasSize.value.width + 'px', 
                     height: coloring.canvas.canvasSize.value.height + 'px',
                     background: 'lightgray',
                     border: '3px solid green',
                     position: 'relative',
                     overflow: 'visible',
                     margin: '0 auto'
                   }">
                <!-- 디버깅 정보 임시 제거 -->
                
                <!-- 배경 이미지 (윤곽선) -->
                <canvas 
                  ref="backgroundCanvas"
                  class="background-canvas"
                  :width="coloring.canvas.canvasSize.value.width"
                  :height="coloring.canvas.canvasSize.value.height"
                  :style="{
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    zIndex: 1,
                    pointerEvents: 'none',
                    border: '3px solid red',
                    width: coloring.canvas.canvasSize.value.width + 'px',
                    height: coloring.canvas.canvasSize.value.height + 'px'
                  }"
                ></canvas>
                
                <!-- 색칠 캔버스 -->
                <canvas 
                  ref="drawingCanvas"
                  class="drawing-canvas"
                  :width="coloring.canvas.canvasSize.value.width"
                  :height="coloring.canvas.canvasSize.value.height"
                  :style="{
                    position: 'absolute',
                    top: '0px',
                    left: '0px',
                    zIndex: 2,
                    cursor: 'crosshair',
                    border: '2px solid blue',
                    background: 'transparent',
                    width: coloring.canvas.canvasSize.value.width + 'px',
                    height: coloring.canvas.canvasSize.value.height + 'px'
                  }"
                  @mousedown="coloring.handleMouseDown"
                  @mousemove="coloring.handleMouseMove"
                  @mouseup="coloring.handleMouseUp"
                  @mouseleave="coloring.handleMouseUp"
                  @touchstart="coloring.handleTouchStart"
                  @touchmove="coloring.handleTouchMove"
                  @touchend="coloring.handleTouchEnd"
                ></canvas>
                
                <!-- 노란색 테두리 제거됨 -->
              </div>
              
              <!-- 컨트롤 버튼 -->
              <div class="canvas-controls">
                <button @click="coloring.canvas.undo" class="btn btn-secondary" :disabled="!coloring.canvas.canUndo()">
                  ↶ {{$t('coloring.undo')}}
                </button>
                <button @click="handleSaveArtwork" class="btn btn-primary" :disabled="isSaving">
                  <span v-if="isSaving">💾 저장 중...</span>
                  <span v-else>💾 {{$t('coloring.save')}}</span>
                </button>
                <button @click="coloring.shareArtwork" class="btn btn-secondary">
                  📤 {{$t('coloring.share')}}
                </button>
                <router-link v-if="authStore.isAuthenticated" to="/coloring/gallery" class="btn btn-info">
                  🖼️ 갤러리
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- 완성 축하 화면 -->
        <div v-else-if="coloring.gameState.value === 'completed'" class="coloring-completed">
          <div class="completion-animation">
            <!-- 폭죽 애니메이션 -->
            <div class="fireworks-container">
              <div class="firework" v-for="i in 8" :key="i" :style="getFireworkStyle(i)"></div>
            </div>
            
            <!-- 떨어지는 컨페티 -->
            <div class="confetti-rain">
              <div class="confetti" v-for="i in 30" :key="i" :style="getConfettiStyle(i)"></div>
            </div>
            
            <div class="celebration-container">
              <div class="completion-badge">
                <div class="badge-circle">
                  <div class="badge-text">완성!</div>
                  <div class="badge-progress">{{ coloring.coloringProgress.value }}%</div>
                </div>
              </div>
            </div>
            
            <h2 class="completion-title animate-in">🌟 훌륭해요! 🌟</h2>
            <h3 class="completion-subtitle animate-in delay-1">{{ coloring.getCurrentName(coloring.selectedWord.value!) }} 색칠을 완성했어요!</h3>
            
            <div class="completed-artwork animate-in delay-2">
              <div class="artwork-frame">
                <canvas ref="completedCanvas" class="completed-canvas" @click="copyCompletedArtwork"></canvas>
                <div class="artwork-shine"></div>
              </div>
              <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                작품이 보이지 않으면 위 프레임을 클릭해보세요
              </p>
            </div>

            <div class="completion-actions animate-in delay-3">
              <button @click="handleSaveArtwork" class="btn btn-success btn-lg pulse" :disabled="isSaving">
                <span v-if="isSaving">💾 저장 중...</span>
                <span v-else>💾 작품 저장하기</span>
              </button>
              <router-link v-if="authStore.isAuthenticated" to="/coloring/gallery" class="btn btn-info btn-lg">
                🖼️ 갤러리 보기
              </router-link>
              <button @click="coloring.startNewColoring" class="btn btn-primary btn-lg">
                🎨 다른 그림 색칠하기
              </button>
              <button @click="coloring.goHome" class="btn btn-secondary btn-lg">
                🏠 홈으로 가기
              </button>
            </div>
          </div>
        </div>

        <!-- 빈 상태 -->
        <div v-if="coloringWords.length === 0" class="empty-state">
          <div class="empty-icon">🎨</div>
          <h3>색칠할 수 있는 이미지가 없습니다</h3>
          <p>직접 업로드한 이미지가 있는 단어만 색칠하기가 가능합니다.</p>
          <div class="debug-info" style="margin: 20px 0; padding: 15px; background: #f0f0f0; border-radius: 8px; font-size: 0.9rem; text-align: left;">
            <div><strong>전체 단어 수:</strong> {{ store.currentWords.length }}</div>
            <div><strong>업로드된 이미지가 있는 단어:</strong> {{ store.currentWords.filter(w => w.imageUrl?.startsWith('/uploads/')).length }}</div>
            <div v-if="store.currentWords.length > 0"><strong>단어들의 이미지 URL 샘플:</strong></div>
            <div v-for="(word, index) in store.currentWords.slice(0, 5)" :key="word.id" style="margin-left: 10px; font-size: 0.8rem;">
              {{ index + 1 }}. {{ word.name }}: {{ word.imageUrl || '없음' }}
            </div>
            <div v-if="store.currentWords.length > 5" style="margin-left: 10px; font-size: 0.8rem;">
              ... 그리고 {{ store.currentWords.length - 5 }}개 더
            </div>
          </div>
          <router-link to="/admin/words" class="btn btn-primary">
            관리자에서 이미지 추가하기
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick, watch, ref } from 'vue';
import Navigation from '@/components/Navigation.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useColoring } from '@/composables/useColoring';

const store = useAppStore();
const authStore = useAuthStore();
const coloring = useColoring();

// 저장 상태 관리
const isSaving = ref(false);

// 작품 저장 핸들러
const handleSaveArtwork = async () => {
  if (isSaving.value) return;
  
  isSaving.value = true;
  
  try {
    if (!authStore.isAuthenticated) {
      alert('작품을 저장하려면 로그인이 필요합니다.');
      return;
    }
    
    const success = await coloring.saveArtwork();
    
    if (success) {
      console.log('✅ Artwork saved successfully with UI feedback');
    }
  } catch (error) {
    console.error('Error saving artwork:', error);
    alert('작품 저장 중 오류가 발생했습니다.');
  } finally {
    isSaving.value = false;
  }
};

// 색칠 가능한 단어들 (직접 업로드된 이미지만)
const coloringWords = computed(() => {
  console.log('🎨 [ColoringView] 전체 단어 수:', store.currentWords.length);
  console.log('🎨 [ColoringView] 전체 단어들:', store.currentWords.map(w => ({
    id: w.id,
    name: w.name,
    imageUrl: w.imageUrl,
    hasImage: !!w.imageUrl,
    isUploadedImage: w.imageUrl?.startsWith('/uploads/')
  })));
  
  const filtered = store.currentWords.filter(word => {
    // imageUrl이 있고, /uploads/로 시작하는 것만 (직접 업로드된 파일)
    const hasUploadedImage = word.imageUrl && word.imageUrl.startsWith('/uploads/');
    if (hasUploadedImage) {
      console.log('✅ [ColoringView] 색칠 가능한 단어 발견:', {
        id: word.id,
        name: word.name,
        imageUrl: word.imageUrl
      });
    }
    return hasUploadedImage;
  });
  
  console.log('🎨 [ColoringView] 필터링된 색칠 가능한 단어 수:', filtered.length);
  return filtered;
});

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

// 현재 언어에 따른 단어명 가져오기
const getCurrentName = (word: any): string => {
  return coloring.getCurrentName(word);
};

// 캔버스 레퍼런스
const backgroundCanvas = ref<HTMLCanvasElement>();
const drawingCanvas = ref<HTMLCanvasElement>();
const completedCanvas = ref<HTMLCanvasElement>();

// 캔버스 초기화
const initializeCanvasElements = () => {
  console.log('🔍 Checking canvas elements:', {
    backgroundCanvas: backgroundCanvas.value,
    drawingCanvas: drawingCanvas.value,
    gameState: coloring.gameState.value
  });
  
  // 게임 상태가 'coloring'이 아니면 초기화하지 않음
  if (coloring.gameState.value !== 'coloring') {
    console.log('⏭️ Skipping canvas initialization - not in coloring state');
    return;
  }
  
  if (backgroundCanvas.value && drawingCanvas.value) {
    console.log('✅ Canvas elements found, initializing...');
    
    // useColoring에 캔버스 레퍼런스 직접 설정
    coloring.setCanvasRefs(backgroundCanvas.value, drawingCanvas.value);
    console.log('🎨 Canvas initialized successfully');
  } else {
    console.error('❌ Canvas elements not found:', {
      backgroundCanvas: backgroundCanvas.value,
      drawingCanvas: drawingCanvas.value,
      queryBackground: document.querySelector('.background-canvas'),
      queryDrawing: document.querySelector('.drawing-canvas')
    });
    
    // 다시 시도
    setTimeout(() => {
      console.log('🔄 Retrying canvas initialization...');
      initializeCanvasElements();
    }, 1000);
  }
};

onMounted(async () => {
  console.log('🏗️ ColoringView mounted');
  
  // 단어 데이터가 로드되지 않았다면 먼저 로드
  if (store.currentWords.length === 0) {
    console.log('📚 Loading words for coloring...');
    await store.loadWords();
  }
  
  setTimeout(() => {
    console.log('🕐 Delayed canvas initialization attempt');
    initializeCanvasElements();
  }, 500);
});

// 게임 상태가 'coloring'으로 변경될 때 캔버스 재초기화
watch(() => coloring.gameState.value, (newState) => {
  console.log('🎮 Game state changed to:', newState);
  if (newState === 'coloring') {
    setTimeout(() => {
      console.log('🕐 Delayed canvas initialization for coloring state');
      initializeCanvasElements();
    }, 200);
  } else if (newState === 'completed') {
    // 완성 화면으로 전환될 때 완성된 작품을 completedCanvas에 복사
    nextTick(() => {
      setTimeout(() => {
        copyCompletedArtwork();
        // 혹시 실패했다면 다시 시도
        setTimeout(() => {
          if (completedCanvas.value && completedCanvas.value.width === 0) {
            console.log('🔄 Retrying artwork copy...');
            copyCompletedArtwork();
          }
        }, 500);
      }, 200);
    });
  }
});

// 완성된 작품을 completedCanvas에 복사하는 함수
const copyCompletedArtwork = async () => {
  console.log('🖼️ Copying completed artwork to display canvas');
  
  if (!completedCanvas.value) {
    console.error('❌ Completed canvas element not found');
    return;
  }

  try {
    // useCanvas의 getArtworkAsImage 메서드를 사용하여 완성된 작품 가져오기
    const artworkDataUrl = coloring.canvas.getArtworkAsImage();
    
    if (artworkDataUrl) {
      console.log('✅ Got artwork data URL, loading as image...');
      
      // 데이터 URL을 이미지로 로드
      const img = new Image();
      
      img.onload = () => {
        console.log('🖼️ Image loaded, drawing to completed canvas');
        
        const ctx = completedCanvas.value!.getContext('2d');
        if (ctx) {
          // 캔버스 크기를 이미지 크기에 맞게 설정
          completedCanvas.value!.width = img.width;
          completedCanvas.value!.height = img.height;
          
          console.log('🎨 Setting completed canvas size:', {
            width: img.width,
            height: img.height
          });
          
          // 이미지 그리기
          ctx.drawImage(img, 0, 0);
          console.log('✅ Completed artwork copied successfully from data URL');
        }
      };
      
      img.onerror = (error) => {
        console.error('❌ Error loading artwork image:', error);
        fallbackCopyMethod();
      };
      
      img.src = artworkDataUrl;
    } else {
      console.warn('⚠️ No artwork data URL, trying fallback method');
      fallbackCopyMethod();
    }
  } catch (error) {
    console.error('❌ Error getting artwork as image:', error);
    fallbackCopyMethod();
  }
};

// 폴백 복사 방법 (직접 캔버스에서 복사)
const fallbackCopyMethod = () => {
  console.log('🔄 Using fallback copy method');
  
  const bgCanvas = coloring.canvas.backgroundCanvas.value;
  const drawCanvas = coloring.canvas.drawingCanvas.value;
  
  if (bgCanvas && drawCanvas && completedCanvas.value) {
    const ctx = completedCanvas.value.getContext('2d');
    if (ctx) {
      // 캔버스 크기 설정
      completedCanvas.value.width = bgCanvas.width || 600;
      completedCanvas.value.height = bgCanvas.height || 400;
      
      // 흰색 배경 먼저 설정
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, completedCanvas.value.width, completedCanvas.value.height);
      
      // 배경 이미지 먼저 그리기
      try {
        ctx.drawImage(bgCanvas, 0, 0);
        console.log('✅ Background image drawn (fallback)');
      } catch (error) {
        console.error('❌ Error drawing background (fallback):', error);
      }
      
      // 그 위에 사용자가 그린 내용 그리기
      try {
        ctx.drawImage(drawCanvas, 0, 0);
        console.log('✅ Drawing canvas drawn (fallback)');
      } catch (error) {
        console.error('❌ Error drawing user artwork (fallback):', error);
      }
      
      console.log('✅ Completed artwork copied successfully (fallback method)');
    }
  } else {
    console.error('❌ Fallback method also failed - canvas elements not available');
  }
};

// 축하 애니메이션용 컨페티
const getConfettiStyle = (index: number) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#ff8fa3', '#6c5ce7'];
  const randomColor = colors[index % colors.length];
  const randomDelay = Math.random() * 3;
  const randomDuration = 3 + Math.random() * 3;
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  
  return {
    backgroundColor: randomColor,
    animationDelay: `${randomDelay}s`,
    animationDuration: `${randomDuration}s`,
    left: `${randomX}%`,
    transform: `rotate(${randomRotation}deg)`
  };
};

// 폭죽 애니메이션용 스타일
const getFireworkStyle = (index: number) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
  const randomColor = colors[index % colors.length];
  const randomDelay = Math.random() * 2;
  const randomX = 20 + Math.random() * 60; // 20%-80% 사이
  const randomY = 20 + Math.random() * 40; // 20%-60% 사이
  
  return {
    '--firework-color': randomColor,
    animationDelay: `${randomDelay}s`,
    left: `${randomX}%`,
    top: `${randomY}%`
  };
};
</script>

<style scoped>
.coloring-view {
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
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.page-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 색칠 이미지 선택 화면 */
.coloring-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.coloring-option-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-card);
}

.coloring-option-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.option-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
}

.option-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.coloring-option-card:hover .option-image img {
  transform: scale(1.05);
}

.coloring-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--color-primary);
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-md);
}

.coloring-option-card:hover .coloring-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.05);
}

.coloring-icon {
  font-size: 2rem;
}

.coloring-text {
  color: var(--color-bg-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.option-info {
  padding: 20px 16px 16px;
  text-align: center;
}

.option-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.difficulty-badge {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* 색칠하기 화면 */
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
}

.coloring-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  flex: 1;
  margin: 0 16px;
}

.coloring-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 24px;
  align-items: start;
}

/* 색상 팔레트 - 3-4세 유아 친화적 디자인 */
.color-palette {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  border: 3px solid #fdcb6e;
  border-radius: 20px;
  padding: 24px;
  position: sticky;
  top: 20px;
  box-shadow: 0 8px 25px rgba(253, 203, 110, 0.3);
}

.palette-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 20px;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 24px;
}

.color-item {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  cursor: pointer;
  border: 4px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: scale(1);
}

.color-item:hover {
  transform: scale(1.15);
  border-color: #fdcb6e;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
}

.color-item.active {
  transform: scale(1.1);
  border-color: #e17055;
  box-shadow: 0 0 0 4px rgba(225, 112, 85, 0.4);
  animation: colorPulse 1.5s ease-in-out infinite;
}

@keyframes colorPulse {
  0%, 100% { 
    box-shadow: 0 0 0 4px rgba(225, 112, 85, 0.4);
  }
  50% { 
    box-shadow: 0 0 0 8px rgba(225, 112, 85, 0.2);
  }
}

.selected-check {
  color: white;
  font-weight: 900;
  font-size: 1.4rem;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  animation: checkBounce 0.6s ease-out;
}

@keyframes checkBounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

/* 브러쉬 크기 - 유아 친화적 디자인 */
.brush-size h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3436;
  margin-bottom: 16px;
  text-align: center;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.8);
}

.brush-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.brush-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border: 3px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
}

.brush-btn:hover {
  border-color: #fdcb6e;
  background: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(253, 203, 110, 0.3);
}

.brush-btn.active {
  border-color: #e17055;
  background: rgba(225, 112, 85, 0.2);
  transform: scale(1.05);
  box-shadow: 0 4px 16px rgba(225, 112, 85, 0.4);
}

.brush-preview {
  background: linear-gradient(135deg, #2d3436, #636e72);
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/* 캔버스 영역 - 밝고 친근한 디자인 */
.canvas-area {
  background: linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%);
  border: 3px solid #74b9ff;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 8px 25px rgba(116, 185, 255, 0.2);
}

.canvas-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
  border: 4px solid #00b894;
  border-radius: 16px;
  overflow: hidden;
  background: white;
  box-shadow: 0 6px 20px rgba(0, 184, 148, 0.25);
}

.background-canvas,
.drawing-canvas {
  position: absolute;
  top: 0;
  left: 0;
  cursor: crosshair;
  display: block;
}

.background-canvas {
  z-index: 1;
  background: white;
}

.drawing-canvas {
  z-index: 2;
  background: transparent;
}

.canvas-controls {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 완성 화면 */
.coloring-completed {
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  position: relative;
}

.completion-animation {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 20px;
  padding: 40px;
  position: relative;
  overflow: hidden;
}

/* 폭죽 효과 */
.fireworks-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.firework {
  position: absolute;
  width: 4px;
  height: 4px;
  background: var(--firework-color);
  border-radius: 50%;
  animation: fireworkExplode 2s ease-out infinite;
}

@keyframes fireworkExplode {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  50% {
    transform: scale(20);
    opacity: 0.8;
  }
  100% {
    transform: scale(40);
    opacity: 0;
  }
}

/* 컨페티 비 */
.confetti-rain {
  position: absolute;
  top: -50px;
  left: 0;
  width: 100%;
  height: 100vh;
  pointer-events: none;
  z-index: 2;
}

.confetti {
  position: absolute;
  width: 12px;
  height: 12px;
  animation: confettiFall 6s linear infinite;
  border-radius: 2px;
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.celebration-container {
  position: relative;
  margin-bottom: 30px;
  z-index: 3;
}


/* 완성 배지 */
.completion-badge {
  margin: 20px 0;
}

.badge-circle {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #ff6b6b, #4ecdc4);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  color: white;
  box-shadow: 0 10px 30px rgba(0,0,0,0.2);
  animation: badgePulse 2s ease infinite;
}

@keyframes badgePulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.badge-text {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 4px;
}

.badge-progress {
  font-size: 1.5rem;
  font-weight: bold;
}

/* 애니메이션 인 효과 */
.animate-in {
  opacity: 0;
  transform: translateY(30px);
  animation: slideInUp 0.8s ease forwards;
}

.animate-in.delay-1 {
  animation-delay: 0.3s;
}

.animate-in.delay-2 {
  animation-delay: 0.6s;
}

.animate-in.delay-3 {
  animation-delay: 0.9s;
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.completion-title {
  font-size: 2.5rem;
  color: var(--color-success);
  margin-bottom: 16px;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.completion-subtitle {
  font-size: 1.3rem;
  color: var(--color-text-primary);
  margin-bottom: 30px;
}

/* 작품 프레임 */
.completed-artwork {
  margin: 30px auto;
  position: relative;
}

.artwork-frame {
  position: relative;
  display: inline-block;
  padding: 15px;
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  border-radius: 15px;
  box-shadow: 0 15px 35px rgba(0,0,0,0.2);
  animation: frameGlow 3s ease infinite;
}

@keyframes frameGlow {
  0%, 100% { box-shadow: 0 15px 35px rgba(0,0,0,0.2); }
  50% { box-shadow: 0 20px 40px rgba(255,215,0,0.4); }
}

.completed-canvas {
  display: block;
  border-radius: 8px;
  max-width: 400px;
  max-height: 300px;
  width: auto;
  height: auto;
  background: white;
}

.artwork-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shine 3s ease infinite;
}

@keyframes shine {
  0% { left: -100%; }
  100% { left: 100%; }
}

.completion-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 30px;
  flex-wrap: wrap;
}

/* 버튼 펄스 효과 */
.btn.pulse {
  animation: buttonPulse 2s ease infinite;
}

@keyframes buttonPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 헤더 액션 버튼 */
.header-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.gallery-btn {
  background: white;
  color: black;
  border: 2px solid black;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
}

.gallery-btn:hover {
  background: black;
  color: white;
  text-decoration: none;
}

/* 헤더 중앙 정렬 */
.header-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

/* 완료 컨트롤 */
.completion-controls {
  margin-top: 12px;
}

.complete-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.complete-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.complete-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

/* 진행률 바 */
.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  width: 200px;
  height: 8px;
  background: var(--color-bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4ecdc4, #44d9e8);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  min-width: 60px;
}

/* 빈 상태 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--color-bg-card);
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

/* 애니메이션 */
@keyframes celebration {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.1) rotate(-5deg); }
  50% { transform: scale(1.2) rotate(5deg); }
  75% { transform: scale(1.1) rotate(-2deg); }
}

@keyframes confettiFall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

/* 반응형 디자인 */
@media (max-width: 1024px) {
  .coloring-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .color-palette {
    position: static;
    order: 2;
  }
  
  .canvas-area {
    order: 1;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 20px 0;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .coloring-options {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .game-header {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }
  
  .coloring-title {
    margin: 0;
  }
  
  .color-grid {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .completion-actions {
    flex-direction: column;
    align-items: center;
  }
}

@media (max-width: 480px) {
  .coloring-options {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .canvas-controls {
    flex-direction: column;
  }
  
  .color-item {
    width: 40px;
    height: 40px;
  }
}

/* 터치 최적화 - 3-4세 유아용 */
@media (hover: none) and (pointer: coarse) {
  .coloring-overlay {
    opacity: 1;
  }
  
  .coloring-option-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
  
  .color-item {
    min-width: 60px;
    min-height: 60px;
    border-width: 5px;
  }
  
  .brush-btn {
    min-height: 50px;
    padding: 16px;
  }
  
  /* 터치 피드백 강화 */
  .color-item:active {
    transform: scale(0.9);
    transition: transform 0.1s ease;
  }
  
  .brush-btn:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}
</style>