import { ref, computed } from 'vue';
import { useCanvas } from './useCanvas';
import { useGameSounds } from './useGameSounds';
import type { WordItem } from '@/types';

export interface ColorItem {
  name: string;
  value: string;
  displayName: string;
}

export interface BrushSize {
  name: string;
  size: number;
  preview: number;
  displayName: string;
}

export type ColoringGameState = 'selection' | 'coloring' | 'completed';

export function useColoring() {
  const canvas = useCanvas();
  const { playSuccessSound } = useGameSounds();
  
  // 외부에서 캔버스 레퍼런스를 설정할 수 있는 함수
  const setCanvasRefs = (bgCanvas: HTMLCanvasElement, drawCanvas: HTMLCanvasElement) => {
    console.log('🔗 Setting canvas references:', {
      bgCanvas: bgCanvas,
      drawCanvas: drawCanvas,
      bgContext: bgCanvas.getContext('2d'),
      drawContext: drawCanvas.getContext('2d')
    });
    
    canvas.backgroundCanvas.value = bgCanvas;
    canvas.drawingCanvas.value = drawCanvas;
    canvas.initializeCanvas(bgCanvas, drawCanvas, 600, 400);
    
    // 캔버스 초기화 후 흰색 배경 설정
    console.log('🎨 Canvas initialized, setting white background');
    
    const ctx = bgCanvas.getContext('2d');
    if (ctx) {
      // 강제로 캔버스 크기 설정
      bgCanvas.width = 600;
      bgCanvas.height = 400;
      
      // 깔끔한 흰색 배경
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 600, 400);
      
      console.log('🎨 White background set for coloring');
    }
    
    console.log('🔗 Canvas references set in useColoring');
  };

  // 게임 상태
  const gameState = ref<ColoringGameState>('selection');
  const selectedWord = ref<WordItem | null>(null);
  
  // 색상 팔레트 (3-4세 유아에게 친숙한 색상들)
  const colorPalette: ColorItem[] = [
    { name: 'red', value: '#FF6B6B', displayName: '빨간색' },
    { name: 'orange', value: '#FF8E53', displayName: '주황색' },
    { name: 'yellow', value: '#FFD93D', displayName: '노란색' },
    { name: 'green', value: '#6BCF7F', displayName: '초록색' },
    { name: 'blue', value: '#4DABF7', displayName: '파란색' },
    { name: 'purple', value: '#845EC2', displayName: '보라색' },
    { name: 'pink', value: '#FF8FA3', displayName: '분홍색' },
    { name: 'brown', value: '#D2691E', displayName: '갈색' },
    { name: 'black', value: '#495057', displayName: '검은색' },
    { name: 'white', value: '#FFFFFF', displayName: '하얀색' }
  ];

  // 브러쉬 크기 (3-4세 손가락 크기를 고려)
  const brushSizes: BrushSize[] = [
    { name: 'small', size: 8, preview: 10, displayName: '작게' },
    { name: 'medium', size: 15, preview: 16, displayName: '보통' },
    { name: 'large', size: 25, preview: 22, displayName: '크게' }
  ];

  // 현재 선택된 색상과 브러쉬
  const selectedColor = ref<ColorItem>(colorPalette[0]); // 빨간색 기본
  const selectedBrushSize = ref<BrushSize>(brushSizes[1]); // 보통 크기 기본

  // 색칠 진행률 계산 (실제 픽셀 기반)
  const coloringProgress = ref(0);
  
  // 색칠 완성 여부
  const isColoringComplete = computed(() => {
    return coloringProgress.value >= 15; // 15% 이상 색칠하면 완성으로 간주 (3-4세 기준)
  });

  // 진행률 업데이트 함수 (자동 완료 제거)
  const updateProgress = () => {
    const progress = canvas.getColoringProgress();
    coloringProgress.value = Math.round(progress);
    
    console.log('🎨 Current progress:', coloringProgress.value + '%');
    
    // 자동 완료 기능 제거 - 사용자가 직접 완료 버튼을 눌러야 함
    // if (progress >= 15 && gameState.value === 'coloring') {
    //   console.log('🎉 Coloring completed!');
    //   completeColoring();
    // }
  };

  /**
   * 이미지 선택하여 색칠 시작
   */
  const selectImageForColoring = async (word: WordItem) => {
    if (!word.imageUrl) {
      console.error('Image URL is required for coloring');
      return;
    }

    selectedWord.value = word;
    gameState.value = 'coloring';

    // DOM이 업데이트될 때까지 기다림
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      // 이미지 URL 처리
      let imageUrl = word.imageUrl;
      if (imageUrl.startsWith('/uploads/')) {
        imageUrl = '/server' + imageUrl;
      }

      // 캔버스가 초기화될 때까지 기다리기
      if (!canvas.backgroundCanvas.value || !canvas.drawingCanvas.value) {
        console.log('⏳ Canvas elements not ready yet, waiting for initialization...');
        
        // 캔버스가 준비될 때까지 최대 3초 기다리기
        let attempts = 0;
        while ((!canvas.backgroundCanvas.value || !canvas.drawingCanvas.value) && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
          console.log(`⏳ Waiting for canvas... attempt ${attempts}/30`);
        }
        
        if (!canvas.backgroundCanvas.value || !canvas.drawingCanvas.value) {
          console.error('❌ Canvas elements still not ready after waiting');
          return;
        }
      }

      // 배경 이미지 로드 (캔버스가 준비된 후)
      console.log('🖼️ Loading background image:', imageUrl);
      try {
        await canvas.loadBackgroundImage(imageUrl);
        console.log('✅ Background image loaded successfully');
      } catch (error) {
        console.error('❌ Failed to load background image:', error);
        // 이미지 로딩 실패해도 색칠하기는 계속 진행
      }
      
      // 초기 색상과 브러쉬 크기 설정
      canvas.setColor(selectedColor.value.value);
      canvas.setBrushSize(selectedBrushSize.value.size);
      
      console.log('🎨 Coloring session started for:', getCurrentName(word));
    } catch (error) {
      console.error('Failed to load image for coloring:', error);
      gameState.value = 'selection';
    }
  };

  /**
   * 색상 선택
   */
  const selectColor = (color: ColorItem) => {
    selectedColor.value = color;
    canvas.setColor(color.value);
    console.log('🎨 Color selected:', color.displayName);
  };

  /**
   * 브러쉬 크기 선택
   */
  const selectBrushSize = (brushSize: BrushSize) => {
    selectedBrushSize.value = brushSize;
    canvas.setBrushSize(brushSize.size);
    console.log('🖌️ Brush size selected:', brushSize.displayName);
  };

  /**
   * 색칠 완성 처리 (내부 함수)
   */
  const completeColoring = () => {
    if (!selectedWord.value) return;

    gameState.value = 'completed';
    playSuccessSound();
    
    console.log('🎉 Coloring completed!', {
      word: getCurrentName(selectedWord.value),
      progress: coloringProgress.value,
      totalStrokes: canvas.canvasState.value.strokes.length
    });
  };

  /**
   * 수동 색칠 완성 처리 (사용자가 직접 완료 버튼 클릭)
   */
  const completeColoringManually = () => {
    if (!selectedWord.value) return;
    
    // 최소 5% 이상 색칠했을 때만 완료 가능
    if (coloringProgress.value < 5) {
      console.log('⚠️ 색칠을 더 해주세요! 현재:', coloringProgress.value + '%');
      return;
    }

    console.log('🎉 사용자가 직접 색칠 완료!', {
      word: getCurrentName(selectedWord.value),
      finalProgress: coloringProgress.value,
      totalStrokes: canvas.canvasState.value.strokes.length
    });

    completeColoring();
  };

  /**
   * 작품 저장
   */
  const saveArtwork = async () => {
    if (!selectedWord.value) {
      console.error('No selected word for saving artwork');
      return false;
    }

    const artworkImage = canvas.getArtworkAsImage();
    if (!artworkImage) {
      console.error('Failed to generate artwork image');
      return false;
    }

    // 동적으로 useColoringGallery 로드 (순환 참조 방지)
    try {
      const { useColoringGallery } = await import('./useColoringGallery');
      const gallery = useColoringGallery();
      
      // 색칠 품질 정보 수집
      const qualityInfo = evaluateColoringQuality();
      const usedColors = Array.from(new Set(canvas.canvasState.value.strokes.map(s => s.color)));
      
      const artworkData = {
        wordId: selectedWord.value.id,
        wordName: getCurrentName(selectedWord.value),
        artworkData: artworkImage,
        completionPercentage: coloringProgress.value,
        colorsUsed: usedColors,
        brushStrokes: qualityInfo.strokeCount,
        timeSpentSeconds: Math.round(qualityInfo.timeSpent)
      };

      console.log('💾 Saving artwork with data:', {
        wordName: artworkData.wordName,
        completion: artworkData.completionPercentage,
        colorsCount: artworkData.colorsUsed.length,
        strokes: artworkData.brushStrokes,
        timeSpent: artworkData.timeSpentSeconds
      });

      const success = await gallery.saveArtwork(artworkData);
      
      if (success) {
        console.log('✅ Artwork saved successfully!');
        // 완성 상태로 전환 (이미 완성 상태가 아니라면)
        if (gameState.value !== 'completed') {
          completeColoring();
        }
        return true;
      } else {
        console.error('❌ Failed to save artwork');
        return false;
      }
    } catch (error) {
      console.error('💥 Error during artwork save:', error);
      return false;
    }
  };

  /**
   * 작품 공유
   */
  const shareArtwork = () => {
    if (!selectedWord.value) return;

    const artworkImage = canvas.getArtworkAsImage();
    if (!artworkImage) {
      console.error('Failed to generate artwork image');
      return;
    }

    // Web Share API 사용 (모바일에서 지원)
    if (navigator.share) {
      // Blob으로 변환하여 공유
      fetch(artworkImage)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `coloring-${selectedWord.value!.name}.png`, { 
            type: 'image/png' 
          });
          
          navigator.share({
            title: `${getCurrentName(selectedWord.value!)} 색칠 작품`,
            text: '내가 색칠한 예쁜 그림을 봐주세요!',
            files: [file]
          });
        })
        .catch(error => {
          console.error('Share failed:', error);
          fallbackShare(artworkImage);
        });
    } else {
      fallbackShare(artworkImage);
    }
  };

  /**
   * 공유 API가 지원되지 않을 때의 대체 방법
   */
  const fallbackShare = (imageData: string) => {
    // 다운로드 링크 생성
    const link = document.createElement('a');
    link.download = `coloring-${selectedWord.value!.name}.png`;
    link.href = imageData;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📤 Artwork downloaded as fallback share');
  };

  /**
   * 다른 그림 색칠하기
   */
  const startNewColoring = () => {
    gameState.value = 'selection';
    selectedWord.value = null;
    canvas.clearCanvas();
  };

  /**
   * 홈으로 돌아가기
   */
  const goHome = () => {
    gameState.value = 'selection';
    selectedWord.value = null;
    canvas.clearCanvas();
  };

  /**
   * 현재 단어명 가져오기 (언어별)
   */
  const getCurrentName = (word: WordItem): string => {
    // TODO: 언어 설정에 따라 결정 (현재는 한국어 기본)
    return word.name || word.nameEn;
  };

  /**
   * 마우스 이벤트 핸들러들
   */
  const handleMouseDown = (event: MouseEvent) => {
    if (!canvas.drawingCanvas.value) return;
    
    const point = canvas.getCanvasPoint(event, canvas.drawingCanvas.value);
    canvas.startDrawing(point);
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!canvas.drawingCanvas.value) return;
    
    const point = canvas.getCanvasPoint(event, canvas.drawingCanvas.value);
    canvas.continueDrawing(point);
  };

  const handleMouseUp = () => {
    canvas.stopDrawing();
    // 그리기 완료 후 진행률 업데이트
    setTimeout(() => updateProgress(), 100);
  };

  /**
   * 터치 이벤트 핸들러들 (3-4세 유아는 주로 터치 사용)
   */
  const handleTouchStart = (event: TouchEvent) => {
    event.preventDefault(); // 스크롤 방지
    
    if (!canvas.drawingCanvas.value || event.touches.length === 0) return;
    
    const touch = event.touches[0];
    const point = canvas.getCanvasPoint(touch, canvas.drawingCanvas.value);
    canvas.startDrawing(point);
  };

  const handleTouchMove = (event: TouchEvent) => {
    event.preventDefault(); // 스크롤 방지
    
    if (!canvas.drawingCanvas.value || event.touches.length === 0) return;
    
    const touch = event.touches[0];
    const point = canvas.getCanvasPoint(touch, canvas.drawingCanvas.value);
    canvas.continueDrawing(point);
  };

  const handleTouchEnd = (event: TouchEvent) => {
    event.preventDefault();
    canvas.stopDrawing();
    // 그리기 완료 후 진행률 업데이트
    setTimeout(() => updateProgress(), 100);
  };

  /**
   * 색칠 품질 평가 (미래 기능)
   */
  const evaluateColoringQuality = () => {
    const strokes = canvas.canvasState.value.strokes;
    
    return {
      strokeCount: strokes.length,
      colorVariety: new Set(strokes.map(s => s.color)).size,
      averageStrokeSize: strokes.reduce((sum, s) => sum + s.size, 0) / strokes.length || 0,
      timeSpent: strokes.length > 0 ? (strokes[strokes.length - 1].timestamp - strokes[0].timestamp) / 1000 : 0
    };
  };

  return {
    // 상태
    gameState,
    selectedWord,
    selectedColor,
    selectedBrushSize,
    coloringProgress,
    isColoringComplete,
    
    // 데이터
    colorPalette,
    brushSizes,
    
    // Canvas 기능 노출
    canvas,
    setCanvasRefs,
    
    // 색칠 기능
    selectImageForColoring,
    selectColor,
    selectBrushSize,
    completeColoringManually,
    saveArtwork,
    shareArtwork,
    startNewColoring,
    goHome,
    
    // 이벤트 핸들러
    handleMouseDown,
    handleMouseMove, 
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    
    // 유틸리티
    getCurrentName,
    evaluateColoringQuality
  };
}