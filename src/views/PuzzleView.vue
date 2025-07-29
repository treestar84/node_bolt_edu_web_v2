<template>
  <div class="puzzle-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <!-- Puzzle Selection Screen -->
        <div v-if="gameState === 'selection'" class="puzzle-selection">
          <div class="page-header">
            <h1 class="page-title">{{$t('puzzle.title')}}</h1>
            <p class="page-description">
              {{$t('puzzle.select')}}
            </p>
          </div>

          <div class="puzzle-options">
            <div 
              v-for="option in puzzleOptions" 
              :key="option.id"
              @click="selectPuzzle(option)"
              class="puzzle-option-card"
            >
              <div class="option-image">
                <img :src="getImageUrl(option.imageUrl)" :alt="option.name" :style="{ aspectRatio: puzzleAspectRatio }" />
                <div class="play-overlay">
                  <span class="play-icon">🧩</span>
                  <span class="play-text">{{$t('puzzle.start')}}</span>
                </div>
              </div>
              <div class="option-info">
                <h3 class="option-name">{{ getCurrentName(option) }}</h3>
                <div class="difficulty-info">
                  <div class="difficulty-badge">
                    {{ getPuzzlePieceCount(option) }}조각
                  </div>
                  <div v-if="option.imageAspectRatio" class="aspect-ratio-info">
                    {{ option.imageWidth }}×{{ option.imageHeight }}
                    ({{ option.imageAspectRatio.toFixed(2) }})
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="difficulty-selector">
            <h3>{{$t('puzzle.chooseLevel')}}</h3>
            <div class="difficulty-buttons">
              <button 
                @click="puzzleDifficulty = '3x2'"
                class="btn"
                :class="puzzleDifficulty === '3x2' ? 'btn-primary' : 'btn-secondary'"
              >
                🟢 {{$t('puzzle.easy')}}
              </button>
              <button 
                @click="puzzleDifficulty = '3x3'"
                class="btn"
                :class="puzzleDifficulty === '3x3' ? 'btn-primary' : 'btn-secondary'"
              >
                🟡 {{$t('puzzle.normal')}}
              </button>
            </div>
          </div>
        </div>

        <!-- Puzzle Game Screen -->
        <div v-else-if="gameState === 'playing'" class="puzzle-game">
          <div class="game-header">
            <button @click="goHome" class="btn btn-secondary home-btn">
              🏠 {{$t('puzzle.goHome')}}
            </button>
            <h2 class="puzzle-title">{{ getCurrentName(selectedPuzzle!) }} {{$t('puzzle.title')}}</h2>
            <button @click="resetPuzzle" class="btn btn-secondary reset-btn">
              🔄 {{$t('puzzle.playAgain')}}
            </button>
          </div>

          <div class="game-container">
            <!-- Puzzle Board - 고정된 크기로 일관성 유지 -->
            <div class="puzzle-board-container">
              <div 
                class="puzzle-board" 
                ref="puzzleBoard"
                :style="{
                  gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
                  gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                  aspectRatio: puzzleAspectRatio
                }"
              >
                <div 
                  v-for="(slot, index) in puzzleSlots" 
                  :key="`slot-${index}`"
                  class="puzzle-slot"
                  :class="{ filled: slot.filled }"
                  @drop="handleDrop($event, index)"
                  @dragover.prevent
                  @dragenter.prevent
                >
                  <div v-if="slot.filled && slot.piecePosition !== undefined" class="placed-piece">
                    <div 
                      class="placed-piece-image"
                      :style="getPieceImageStyle(slot.piecePosition)"
                    ></div>
                  </div>
                  <div v-else class="empty-slot">
                    {{ index + 1 }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Puzzle Pieces - 실제로 잘린 이미지 조각들 -->
            <div class="puzzle-pieces-container">
              <h3 class="pieces-title">{{$t('puzzle.piece')}}</h3>
              <div class="puzzle-pieces">
                <div 
                  v-for="piece in shuffledPieces" 
                  :key="piece.id"
                  v-show="!piece.placed"
                  class="puzzle-piece"
                  :draggable="true"
                  @dragstart="handleDragStart($event, piece)"
                  @touchstart="handleTouchStart($event, piece)"
                  @touchmove="handleTouchMove"
                  @touchend="handleTouchEnd"
                >
                  <div class="piece-image-container">
                    <div 
                      :style="getPieceImageStyle(piece.correctPosition)"
                      class="piece-image"
                      :title="`조각 ${piece.correctPosition + 1}`"
                    ></div>
                  </div>
                  <div class="piece-number">{{ piece.correctPosition + 1 }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Completion Screen -->
        <div v-else-if="gameState === 'completed'" class="puzzle-completed">
          <div class="completion-animation">
            <div class="celebration-container">
              <div class="celebration-icon">🎉</div>
              <div class="confetti" v-for="i in 30" :key="i" :style="getConfettiStyle(i)"></div>
            </div>
            <h2 class="completion-title">{{$t('puzzle.complete')}}</h2>
            <h3 class="completion-subtitle">{{ getCurrentName(selectedPuzzle!) }} 완성!</h3>
            
            <div class="completed-puzzle">
              <img :src="getImageUrl(selectedPuzzle!.imageUrl)" :alt="getCurrentName(selectedPuzzle!)" :style="{ aspectRatio: puzzleAspectRatio }" />
            </div>

            <div v-if="newBadgeUnlocked" class="new-badge-notification">
              <div class="badge-unlock-icon">🏆</div>
              <div class="badge-unlock-text">새로운 퍼즐 뱃지 획득!</div>
              <div class="unlocked-badge">
                <span class="unlocked-badge-icon">{{ newBadgeUnlocked.icon }}</span>
                <span class="unlocked-badge-name">{{ newBadgeUnlocked.name }}</span>
              </div>
            </div>

            <div class="completion-actions">
              <button @click="playAgain" class="btn btn-primary btn-lg">
                🧩 {{$t('puzzle.playAgain')}}
              </button>
              <button @click="goHome" class="btn btn-secondary btn-lg">
                🏠 {{$t('puzzle.goHome')}}
              </button>
            </div>
          </div>
        </div>

        <div v-if="store.currentWords.length === 0" class="empty-state">
          <div class="empty-icon">🧩</div>
          <h3>{{$t('puzzle.noImage')}}</h3>
          <p>{{$t('puzzle.addWord')}}</p>
          <router-link to="/admin/words" class="btn btn-primary">
            {{$t('puzzle.addWord')}}
          </router-link>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import Navigation from '@/components/Navigation.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import type { WordItem, Badge } from '@/types';

interface PuzzlePiece {
  id: string;
  image: string;
  correctPosition: number;
  placed: boolean;
}

interface PuzzleSlot {
  filled: boolean;
  piecePosition?: number; // 어떤 조각이 놓였는지 저장
}

const store = useAppStore();
const authStore = useAuthStore();
const contentStore = useContentStore();

const gameState = ref<'selection' | 'playing' | 'completed'>('selection');
const puzzleDifficulty = ref<'3x2' | '3x3'>('3x2');
const selectedPuzzle = ref<WordItem | null>(null);
const puzzleSlots = ref<PuzzleSlot[]>([]);
const puzzlePieces = ref<PuzzlePiece[]>([]);
const shuffledPieces = ref<PuzzlePiece[]>([]);
const completedPieces = ref(0);
const newBadgeUnlocked = ref<Badge | null>(null);
const puzzleBoard = ref<HTMLElement | null>(null);
const boardWidth = ref(0);
const boardHeight = ref(0);

// Touch handling
const draggedPiece = ref<PuzzlePiece | null>(null);
const touchOffset = ref({ x: 0, y: 0 });

const puzzleOptions = computed(() => {
  const words = store.currentWords.filter(w => {
    if (!w.imageUrl) return false;
    
    // 이미지 크기 정보가 있다면 최소 크기 확인
    if (w.imageWidth && w.imageHeight) {
      const minSize = 300; // 최소 300px
      const minPixels = 90000; // 최소 픽셀 수 (300x300)
      
      // 너무 작은 이미지 제외
      if (w.imageWidth < minSize || w.imageHeight < minSize) {
        console.log(`🚫 Image too small for puzzle: ${w.name} (${w.imageWidth}x${w.imageHeight})`);
        return false;
      }
      
      // 총 픽셀 수가 너무 적은 이미지 제외
      if (w.imageWidth * w.imageHeight < minPixels) {
        console.log(`🚫 Image resolution too low for puzzle: ${w.name} (${w.imageWidth * w.imageHeight} pixels)`);
        return false;
      }
    }
    
    return true;
  });
  
  return words.sort(() => Math.random() - 0.5).slice(0, 3);
});

// 이미지 비율에 따른 최적 퍼즐 레이아웃 계산
const optimalPuzzleLayout = computed(() => {
  if (!selectedPuzzle.value?.imageAspectRatio) {
    // 기본 레이아웃
    return puzzleDifficulty.value === '3x2' ? { cols: 3, rows: 2 } : { cols: 3, rows: 3 };
  }

  const aspectRatio = selectedPuzzle.value.imageAspectRatio;
  
  if (puzzleDifficulty.value === '3x2') {
    // 쉬운 난이도: 6조각
    if (aspectRatio > 1.4) {
      return { cols: 3, rows: 2 }; // 가로형
    } else if (aspectRatio < 0.7) {
      return { cols: 2, rows: 3 }; // 세로형
    } else {
      return { cols: 3, rows: 2 }; // 기본
    }
  } else {
    // 보통 난이도: 9조각
    if (aspectRatio > 1.4) {
      return { cols: 4, rows: 2 }; // 가로형 (8조각)
    } else if (aspectRatio < 0.7) {
      return { cols: 2, rows: 4 }; // 세로형 (8조각)
    } else {
      return { cols: 3, rows: 3 }; // 정사각형
    }
  }
});

const totalPieces = computed(() => {
  const layout = optimalPuzzleLayout.value;
  return layout.cols * layout.rows;
});

const gridCols = computed(() => {
  return optimalPuzzleLayout.value.cols;
});

const gridRows = computed(() => {
  return optimalPuzzleLayout.value.rows;
});

const puzzleAspectRatio = computed(() => {
  // 이미지 크기 정보가 있다면 실제 비율 사용, 없다면 기본값
  if (selectedPuzzle.value?.imageAspectRatio) {
    return selectedPuzzle.value.imageAspectRatio.toString();
  }
  
  // 기본값: 난이도에 따른 비율
  return puzzleDifficulty.value === '3x2' ? '3 / 2' : '1 / 1';
});

const updateBoardDimensions = () => {
  if (puzzleBoard.value) {
    boardWidth.value = puzzleBoard.value.offsetWidth;
    boardHeight.value = puzzleBoard.value.offsetHeight;
    console.log(`[Puzzle] Board dimensions: ${boardWidth.value}x${boardHeight.value}`);
  }
};

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const getCurrentName = (word: WordItem): string => {
  return store.currentLanguage === 'ko' ? word.name : word.nameEn;
};

// 특정 이미지에 대한 퍼즐 조각 수 계산
const getPuzzlePieceCount = (word: WordItem): number => {
  if (!word.imageAspectRatio) {
    return puzzleDifficulty.value === '3x2' ? 6 : 9;
  }

  const aspectRatio = word.imageAspectRatio;
  
  if (puzzleDifficulty.value === '3x2') {
    if (aspectRatio > 1.4) {
      return 6; // 3×2
    } else if (aspectRatio < 0.7) {
      return 6; // 2×3
    } else {
      return 6; // 3×2
    }
  } else {
    if (aspectRatio > 1.4) {
      return 8; // 4×2
    } else if (aspectRatio < 0.7) {
      return 8; // 2×4
    } else {
      return 9; // 3×3
    }
  }
};



// 검증된 CSS background-position 방식으로 퍼즐 조각 계산
const getPieceImageStyle = (pieceIndex: number) => {
  const cols = gridCols.value;
  const rows = gridRows.value;
  
  const col = pieceIndex % cols;
  const row = Math.floor(pieceIndex / cols);
  
  // CSS-Tricks에서 검증된 공식 사용
  // background-position: (x / (cols - 1)) * 100%, (y / (rows - 1)) * 100%
  // background-size: cols * 100%, rows * 100%
  
  const xPercent = cols > 1 ? (col / (cols - 1)) * 100 : 0;
  const yPercent = rows > 1 ? (row / (rows - 1)) * 100 : 0;
  
  return {
    width: '100%',
    height: '100%',
    backgroundImage: `url(${getImageUrl(selectedPuzzle.value!.imageUrl)})`,
    backgroundSize: `${cols * 100}% ${rows * 100}%`,
    backgroundPosition: `${xPercent}% ${yPercent}%`,
    backgroundRepeat: 'no-repeat',
    pointerEvents: 'none' as const,
    userSelect: 'none' as const,
    WebkitUserDrag: 'none' as const,
    display: 'block'
  };
};

const selectPuzzle = (puzzle: WordItem) => {
  selectedPuzzle.value = puzzle;
  initializePuzzle();
  gameState.value = 'playing';
};

const initializePuzzle = () => {
  if (!selectedPuzzle.value) return;

  const pieces: PuzzlePiece[] = [];
  const slots: PuzzleSlot[] = [];

  // Create puzzle pieces and slots
  for (let i = 0; i < totalPieces.value; i++) {
    pieces.push({
      id: `piece-${i}`,
      image: getImageUrl(selectedPuzzle.value.imageUrl),
      correctPosition: i,
      placed: false
    });

    slots.push({
      filled: false
    });
  }

  puzzlePieces.value = pieces;
  puzzleSlots.value = slots;
  shuffledPieces.value = [...pieces].sort(() => Math.random() - 0.5);
  completedPieces.value = 0;
  newBadgeUnlocked.value = null;
};

const handleDragStart = (event: DragEvent, piece: PuzzlePiece) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', piece.id);
    
    // 간단한 드래그 이미지 설정 - 원본 요소 사용
    const dragElement = event.target as HTMLElement;
    
    // 드래그 이미지를 현재 요소로 설정하되, 약간 투명하게
    const clonedElement = dragElement.cloneNode(true) as HTMLElement;
    clonedElement.style.opacity = '0.8';
    clonedElement.style.transform = 'scale(0.9)';
    clonedElement.style.width = '120px'; /* Set explicit width */
    clonedElement.style.height = '120px'; /* Set explicit height */
    
    // 임시로 DOM에 추가
    document.body.appendChild(clonedElement);
    clonedElement.style.position = 'absolute';
    clonedElement.style.top = '-1000px';
    clonedElement.style.left = '-1000px';
    
    // 드래그 이미지로 설정
    event.dataTransfer.setDragImage(clonedElement, 60, 60);
    
    // 잠시 후 제거
    setTimeout(() => {
      if (document.body.contains(clonedElement)) {
        document.body.removeChild(clonedElement);
      }
    }, 0);
  }
  draggedPiece.value = piece;
};

const handleDrop = (event: DragEvent, slotIndex: number) => {
  event.preventDefault();
  const pieceId = event.dataTransfer?.getData('text/plain');
  const piece = puzzlePieces.value.find(p => p.id === pieceId);
  
  if (piece && !puzzleSlots.value[slotIndex].filled) {
    placePiece(piece, slotIndex);
  }
};

const handleTouchStart = (event: TouchEvent, piece: PuzzlePiece) => {
  event.preventDefault();
  draggedPiece.value = piece;
  
  const touch = event.touches[0];
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  touchOffset.value = {
    x: touch.clientX - rect.left,
    y: touch.clientY - rect.top
  };
};

const handleTouchMove = (event: TouchEvent) => {
  event.preventDefault();
};

const handleTouchEnd = (event: TouchEvent) => {
  event.preventDefault();
  
  if (!draggedPiece.value || !puzzleBoard.value) return;
  
  const touch = event.changedTouches[0];
  const boardRect = puzzleBoard.value.getBoundingClientRect();
  
  // Calculate which slot the piece was dropped on
  const relativeX = touch.clientX - boardRect.left;
  const relativeY = touch.clientY - boardRect.top;
  
  const slotWidth = boardRect.width / gridCols.value;
  const slotHeight = boardRect.height / gridRows.value;
  
  const col = Math.floor(relativeX / slotWidth);
  const row = Math.floor(relativeY / slotHeight);
  const slotIndex = row * gridCols.value + col;
  
  if (slotIndex >= 0 && slotIndex < totalPieces.value && !puzzleSlots.value[slotIndex].filled) {
    placePiece(draggedPiece.value, slotIndex);
  }
  
  draggedPiece.value = null;
};

const placePiece = (piece: PuzzlePiece, slotIndex: number) => {
  const isCorrect = piece.correctPosition === slotIndex;
  
  if (isCorrect) {
    // Correct placement - 올바른 위치에 놓인 조각을 슬롯에 표시
    puzzleSlots.value[slotIndex].filled = true;
    puzzleSlots.value[slotIndex].piecePosition = piece.correctPosition; // 조각 위치 저장
    piece.placed = true;
    completedPieces.value++;
    
    // Play success sound
    playSuccessSound();
    
    // Check if puzzle is completed
    if (completedPieces.value === totalPieces.value) {
      setTimeout(() => {
        completePuzzle();
      }, 500);
    }
  } else {
    // Wrong placement - play error sound
    playErrorSound();
    
    // Visual feedback for wrong placement
    const slotElement = puzzleBoard.value?.children[slotIndex] as HTMLElement;
    if (slotElement) {
      slotElement.classList.add('wrong-placement');
      setTimeout(() => {
        slotElement.classList.remove('wrong-placement');
      }, 600);
    }
  }
};

const completePuzzle = async () => {
  gameState.value = 'completed';
  
  console.log('🧩 Puzzle completed! Updating puzzle completions...');
  
  // Supabase에 진행도 업데이트
  if (authStore.userProgress) {
    const newCompletions = authStore.userProgress.puzzleCompletions + 1;
    
    await authStore.updateProgress({
      puzzleCompletions: newCompletions
    });
    
    console.log('✅ Puzzle progress updated in Supabase:', { completions: newCompletions });
    
    // 뱃지 확인
    const unlockedBadges = await contentStore.checkBadgeUnlocks();
    if (unlockedBadges.length > 0) {
      newBadgeUnlocked.value = unlockedBadges[0];
      console.log('🏆 New puzzle badge unlocked:', newBadgeUnlocked.value.name);
    }
  }
  
  // Play completion sound
  playCompletionSound();
};

const playSuccessSound = () => {
  // Create "딩동댕" sound
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 딩동댕 melody
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.15); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.3); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }
};

const playErrorSound = () => {
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // 3가지 재미있는 실패 효과음 중 랜덤 선택
    const errorSounds = [
      // 삐~ 소리
      () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      },
      
      // 뿡~~ 소리 (만화 같은)
      () => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(120, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(100, audioContext.currentTime + 0.2);
        oscillator.frequency.setValueAtTime(80, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      },
      
      // 삐리리~ 소리 (경고음 같은)
      () => {
        for (let i = 0; i < 3; i++) {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + i * 0.15);
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime + i * 0.15 + 0.1);
          
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + i * 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.15 + 0.1);
          
          oscillator.start(audioContext.currentTime + i * 0.15);
          oscillator.stop(audioContext.currentTime + i * 0.15 + 0.1);
        }
      }
    ];
    
    // 랜덤하게 하나의 효과음 선택
    const randomSound = errorSounds[Math.floor(Math.random() * errorSounds.length)];
    randomSound();
  }
};

const playCompletionSound = () => {
  if ('AudioContext' in window || 'webkitAudioContext' in window) {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    
    // Play a triumphant melody
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.2);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.2 + 0.3);
      
      oscillator.start(audioContext.currentTime + index * 0.2);
      oscillator.stop(audioContext.currentTime + index * 0.2 + 0.3);
    });
  }
};

const resetPuzzle = () => {
  initializePuzzle();
};

const playAgain = () => {
  gameState.value = 'selection';
  selectedPuzzle.value = null;
};

const goHome = () => {
  gameState.value = 'selection';
  selectedPuzzle.value = null;
};

const getConfettiStyle = (index: number) => {
  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd'];
  const randomColor = colors[index % colors.length];
  const randomDelay = Math.random() * 3;
  const randomDuration = 2 + Math.random() * 3;
  const randomX = Math.random() * 100;
  
  return {
    backgroundColor: randomColor,
    animationDelay: `${randomDelay}s`,
    animationDuration: `${randomDuration}s`,
    left: `${randomX}%`
  };
};

onMounted(() => {
  nextTick(() => {
    updateBoardDimensions();
  });
  window.addEventListener('resize', updateBoardDimensions);
});

// Watch for puzzleDifficulty changes to update board dimensions
watch(puzzleDifficulty, () => {
  nextTick(() => {
    updateBoardDimensions();
  });
});
</script>

<style scoped>
.puzzle-view {
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

.puzzle-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.puzzle-option-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-card);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.puzzle-option-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.option-image {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  flex-shrink: 0;
}

.option-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.puzzle-option-card:hover .option-image img {
  transform: scale(1.05);
}

.play-overlay {
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

.puzzle-option-card:hover .play-overlay {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.05);
}

.play-icon {
  font-size: 2rem;
}

.play-text {
  color: var(--color-bg-primary);
  font-weight: 600;
  font-size: 0.875rem;
}

.option-info {
  padding: 20px 16px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  gap: 12px;
}

.option-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  line-height: 1.3;
  word-break: break-word;
}

.difficulty-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  align-items: center;
}

.difficulty-badge {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
}

.aspect-ratio-info {
  background: var(--color-primary);
  color: var(--color-bg-primary);
  padding: 2px var(--spacing-xs);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.9;
}

.difficulty-selector {
  text-align: center;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
}

.difficulty-selector h3 {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-lg);
  color: var(--color-text-primary);
}

.difficulty-buttons {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2xl);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
}

.puzzle-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  flex: 1;
  margin: 0 var(--spacing-lg);
}

.home-btn, .reset-btn {
  min-width: 120px;
}

.game-container {
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: var(--spacing-2xl);
  align-items: start;
  max-width: 1200px;
  margin: 0 auto;
}

/* 퍼즐 보드를 고정된 크기로 만들어서 일관성 유지 */
.puzzle-board-container {
  display: flex;
  justify-content: center;
}

.puzzle-board {
  display: grid;
  gap: 3px;
  background: var(--color-bg-card);
  border: 2px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  width: 600px;
  box-shadow: var(--shadow-lg);
  /* Grid layout and aspect ratio are set dynamically via :style */
}

.puzzle-slot {
  background: var(--color-bg-secondary);
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  /* 고정된 크기로 일관성 유지 */
  min-height: 0;
  min-width: 0;
}

.puzzle-slot:hover {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
}

.puzzle-slot.filled {
  border-style: solid;
  border-color: var(--color-success);
  background: rgba(16, 185, 129, 0.1);
}

.puzzle-slot.wrong-placement {
  animation: wrongPlacement 0.6s ease;
  border-color: var(--color-danger);
  background: rgba(239, 68, 68, 0.2);
}

.placed-piece {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.placed-piece-image-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  aspect-ratio: 1 / 1;
}

.placed-piece-image {
  border-radius: var(--radius-sm);
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  pointer-events: none;
  object-fit: none; /* Re-add object-fit: none */
}

.empty-slot {
  color: var(--color-text-muted);
  font-size: 2rem;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

/* 퍼즐 조각 영역 */
.puzzle-pieces-container {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  height: fit-content;
}

.pieces-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  text-align: center;
}

.puzzle-pieces {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.puzzle-piece {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: var(--radius-md);
  overflow: hidden;
  cursor: grab;
  transition: all 0.3s ease;
  box-shadow: var(--shadow-md);
  border: 3px solid var(--color-border);
  background: var(--color-bg-secondary);
  user-select: none;
}

.puzzle-piece:hover {
  transform: scale(1.05);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.puzzle-piece:active {
  cursor: grabbing;
  transform: scale(0.95);
}

.piece-image-container {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
  aspect-ratio: 1 / 1;
}

.piece-image {
  border-radius: var(--radius-sm);
  user-select: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  pointer-events: none;
  object-fit: none;
}

.piece-number {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-text-white);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  pointer-events: none;
}

.puzzle-completed {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.completion-animation {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-3xl);
}

.celebration-container {
  position: relative;
  margin-bottom: var(--spacing-xl);
}

.celebration-icon {
  font-size: 4rem;
  animation: celebration 2s ease infinite;
}

.confetti {
  position: absolute;
  width: 8px;
  height: 8px;
  animation: confettiFall 4s linear infinite;
}

.completion-title {
  font-size: 2rem;
  color: var(--color-success);
  margin-bottom: var(--spacing-md);
  animation: bounce 1s ease;
}

.completion-subtitle {
  font-size: 1.5rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xl);
}

.completed-puzzle {
  width: 200px;
  height: 200px;
  margin: 0 auto var(--spacing-xl);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  border: 3px solid var(--color-success);
}

.completed-puzzle img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.new-badge-notification {
  background: linear-gradient(135deg, var(--color-success), var(--color-secondary));
  color: var(--color-text-white);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  margin: var(--spacing-lg) 0;
  animation: badgeNotification 2s ease;
}

.badge-unlock-icon {
  font-size: 2rem;
  margin-bottom: var(--spacing-sm);
}

.badge-unlock-text {
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
}

.unlocked-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  background: rgba(255, 255, 255, 0.2);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}

.unlocked-badge-icon {
  font-size: 1.5rem;
}

.completion-actions {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-xl);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
}

@keyframes wrongPlacement {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

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

@keyframes badgeNotification {
  0% { 
    transform: scale(0.8) translateY(20px); 
    opacity: 0;
  }
  50% { 
    transform: scale(1.05) translateY(-5px); 
    opacity: 1;
  }
  100% { 
    transform: scale(1) translateY(0); 
    opacity: 1;
  }
}

/* Responsive grid adjustments */
@media (max-width: 1200px) {
  .puzzle-options {
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }
}

@media (max-width: 1024px) {
  .main-content {
    padding: 16px 0 60px;
    min-height: calc(100vh - 80px);
    display: flex;
    flex-direction: column;
  }
  
  .page-title {
    font-size: 1.75rem;
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  
  .game-container {
    grid-template-columns: 1fr;
    gap: 20px;
    flex: 1;
    min-height: 0;
    max-width: 100%;
    padding: 0 20px;
  }
  
  .puzzle-board-container {
    order: 1;
  }
  
  .puzzle-board {
    width: min(480px, 90vw);
    padding: 12px;
    max-height: 50vh;
    aspect-ratio: 1;
  }
  
  .puzzle-pieces-container {
    order: 2;
    max-width: min(480px, 90vw);
    margin: 0 auto;
  }
  
  .puzzle-pieces {
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    justify-items: center;
    max-height: 30vh;
    overflow-y: auto;
  }
  
  .puzzle-piece {
    width: min(100px, 25vw);
    height: min(100px, 25vw);
  }
  
  .game-controls {
    order: 0;
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-shrink: 0;
  }
  
  .game-controls .btn {
    padding: 8px 16px;
    font-size: 0.875rem;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 24px 0;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .page-description {
    font-size: 0.875rem;
  }
  
  .puzzle-options {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .option-info {
    padding: 16px 12px 12px;
  }
  
  .option-name {
    font-size: 1.125rem;
  }
  
  .play-overlay {
    opacity: 1;
    padding: 12px 16px;
  }
  
  .play-icon {
    font-size: 1.5rem;
  }
  
  .play-text {
    font-size: 0.75rem;
  }
}

@media (max-width: 640px) {
  .puzzle-options {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }
}

@media (max-width: 480px) {
  .main-content {
    padding: 20px 0;
  }
  
  .page-title {
    font-size: 1.5rem;
  }
  
  .puzzle-options {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  
  .option-name {
    font-size: 1rem;
  }
  
  .option-info {
    padding: 12px 8px 8px;
  }
  
  .puzzle-board {
    width: 100%;
    height: auto;
    aspect-ratio: 3 / 2;
  }

  .puzzle-board.grid-3x3 {
    aspect-ratio: 1 / 1;
  }

  .puzzle-pieces {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: var(--spacing-sm);
  }

  .puzzle-piece {
    width: 100%;
    height: auto;
    aspect-ratio: 1 / 1;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .puzzle-option-card:hover {
    transform: none;
  }
  
  .puzzle-option-card:hover .option-image img {
    transform: none;
  }
  
  .play-overlay {
    opacity: 1;
  }
  
  .puzzle-option-card:active {
    transform: scale(0.95);
    transition: transform 0.1s ease;
  }
}

/* Accessibility improvements */
@media (prefers-reduced-motion: reduce) {
  .puzzle-option-card,
  .option-image img,
  .play-overlay {
    transition: none;
  }
  
  .puzzle-option-card:hover {
    transform: none;
  }
  
  .puzzle-option-card:hover .option-image img {
    transform: none;
  }
  
  .celebration-icon {
    animation: none;
  }
  
  .confetti {
    animation: none;
  }
}
</style>