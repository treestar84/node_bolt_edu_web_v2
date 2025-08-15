import { ref } from 'vue';

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  points: DrawingPoint[];
  color: string;
  size: number;
  timestamp: number;
}

export interface CanvasState {
  strokes: DrawingStroke[];
  isDrawing: boolean;
  currentStroke: DrawingPoint[];
}

export function useCanvas() {
  // 캔버스 상태
  const canvasState = ref<CanvasState>({
    strokes: [],
    isDrawing: false,
    currentStroke: []
  });

  // 현재 그리기 설정
  const currentColor = ref('#FF6B6B');
  const currentBrushSize = ref(10);
  const drawingMode = ref<'brush' | 'eraser'>('brush');
  
  // 캔버스 레퍼런스들
  const backgroundCanvas = ref<HTMLCanvasElement | null>(null);  
  const drawingCanvas = ref<HTMLCanvasElement | null>(null);
  
  // 캔버스 크기 (더 크게)
  const canvasSize = ref({ width: 600, height: 400 });
  
  // 되돌리기를 위한 히스토리
  const strokeHistory = ref<DrawingStroke[][]>([]);
  const historyIndex = ref(-1);

  /**
   * 캔버스 초기화
   */
  const initializeCanvas = (bgCanvas: HTMLCanvasElement, drawCanvas: HTMLCanvasElement, width: number, height: number) => {
    backgroundCanvas.value = bgCanvas;
    drawingCanvas.value = drawCanvas;
    canvasSize.value = { width, height };
    
    // 그리기 캔버스 설정
    const ctx = drawCanvas.getContext('2d');
    if (ctx) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    
    // 히스토리 초기화
    saveToHistory();
  };

  /**
   * 배경 이미지 로드 (윤곽선 처리)
   */
  const loadBackgroundImage = (imageUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      console.log('🔍 Background canvas check:', {
        backgroundCanvas: backgroundCanvas.value,
        hasValue: !!backgroundCanvas.value,
        tagName: backgroundCanvas.value?.tagName
      });
      
      if (!backgroundCanvas.value) {
        reject(new Error('Background canvas not initialized'));
        return;
      }

      const ctx = backgroundCanvas.value.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      console.log('📸 Creating image element for:', imageUrl);
      
      // 이미지 URL 접근 테스트
      fetch(imageUrl, { method: 'HEAD' })
        .then(response => {
          console.log('🌐 Image URL accessible:', response.status, response.statusText);
          console.log('🌐 Content-Type:', response.headers.get('content-type'));
        })
        .catch(error => {
          console.error('🌐 Image URL not accessible:', error);
        });
      
      img.onload = () => {
        console.log('📸 Image loaded successfully. Dimensions:', img.width, 'x', img.height);
        console.log('📸 Image source:', img.src);
        console.log('📸 Image complete:', img.complete);
        
        // 고정된 캔버스 크기 사용 (600x400)
        const newWidth = 600;
        const newHeight = 400;
        
        canvasSize.value = { width: newWidth, height: newHeight };
        
        // 이미지를 캔버스에 그리기 전에 캔버스 상태 확인
        console.log('🎨 Canvas context before image drawing:', {
          canvas: backgroundCanvas.value,
          context: ctx,
          canvasWidth: backgroundCanvas.value?.width,
          canvasHeight: backgroundCanvas.value?.height
        });
        
        // 간단한 이미지 그리기 테스트
        console.log('🎨 Attempting to draw image directly on canvas');
        
        try {
          // 이미지를 70% 투명도로 그리기 (색칠하기 좋게)
          ctx.globalAlpha = 0.3;
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          ctx.globalAlpha = 1.0;
          console.log('✅ Image drawn successfully with 30% opacity for coloring');
          
        } catch (error) {
          console.error('❌ Error drawing image:', error);
          
          // 이미지 그리기 실패시 대체 표시
          ctx.fillStyle = 'magenta';
          ctx.fillRect(50, 50, 200, 100);
          ctx.fillStyle = 'white';
          ctx.font = '20px Arial';
          ctx.fillText('IMAGE ERROR', 75, 105);
          console.log('🔴 Error indicator drawn');
        }
        
        console.log('📊 Canvas context info:', {
          canvas: backgroundCanvas.value,
          context: ctx,
          canvasWidth: backgroundCanvas.value?.width,
          canvasHeight: backgroundCanvas.value?.height,
          canvasStyle: backgroundCanvas.value?.style.cssText,
          imageDrawn: `at position (0,0) with size ${newWidth}x${newHeight}`,
          actualCanvasSize: `${backgroundCanvas.value?.width}x${backgroundCanvas.value?.height}`,
          computedStyle: window.getComputedStyle(backgroundCanvas.value!).cssText
        });
        
        console.log('🚀 Background image with overlay should now be visible');
        
        resolve();
      };
      
      img.onerror = (error) => {
        console.error('❌ Failed to load image:', imageUrl, error);
        console.error('❌ Image error details:', {
          src: img.src,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight
        });
        reject(new Error(`Failed to load image: ${imageUrl}`));
      };
      
      console.log('📸 Loading actual image:', imageUrl);
      img.src = imageUrl;
    });
  };

  // 윤곽선 효과 함수는 현재 사용되지 않아 제거됨

  /**
   * 그리기 시작
   */
  const startDrawing = (point: DrawingPoint) => {
    if (!drawingCanvas.value) return;
    
    canvasState.value.isDrawing = true;
    canvasState.value.currentStroke = [point];
    
    const ctx = drawingCanvas.value.getContext('2d');
    if (ctx) {
      if (drawingMode.value === 'eraser') {
        // 지우개 모드
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        // 브러쉬 모드
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = currentColor.value;
      }
      
      ctx.lineWidth = currentBrushSize.value;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    }
  };

  /**
   * 그리기 진행
   */
  const continueDrawing = (point: DrawingPoint) => {
    if (!canvasState.value.isDrawing || !drawingCanvas.value) return;
    
    canvasState.value.currentStroke.push(point);
    
    const ctx = drawingCanvas.value.getContext('2d');
    if (ctx) {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  /**
   * 그리기 종료
   */
  const stopDrawing = () => {
    if (!canvasState.value.isDrawing) return;
    
    canvasState.value.isDrawing = false;
    
    // 현재 스트로크를 히스토리에 저장
    if (canvasState.value.currentStroke.length > 0) {
      const stroke: DrawingStroke = {
        points: [...canvasState.value.currentStroke],
        color: currentColor.value,
        size: currentBrushSize.value,
        timestamp: Date.now()
      };
      
      canvasState.value.strokes.push(stroke);
      saveToHistory();
    }
    
    canvasState.value.currentStroke = [];
  };

  /**
   * 마우스/터치 좌표를 캔버스 좌표로 변환
   */
  const getCanvasPoint = (event: MouseEvent | Touch, canvas: HTMLCanvasElement): DrawingPoint => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const point = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    };
    
    console.log('🖱️ Mouse/Touch coordinate mapping:', {
      clientX: event.clientX,
      clientY: event.clientY,
      rectLeft: rect.left,
      rectTop: rect.top,
      scaleX,
      scaleY,
      canvasPoint: point
    });
    
    return point;
  };

  /**
   * 히스토리에 현재 상태 저장
   */
  const saveToHistory = () => {
    // 현재 인덱스 이후의 히스토리 제거 (새로운 분기 시작)
    strokeHistory.value = strokeHistory.value.slice(0, historyIndex.value + 1);
    
    // 현재 스트로크 상태를 히스토리에 추가
    strokeHistory.value.push([...canvasState.value.strokes]);
    historyIndex.value = strokeHistory.value.length - 1;
    
    // 히스토리 크기 제한 (메모리 관리)
    if (strokeHistory.value.length > 20) {
      strokeHistory.value.shift();
      historyIndex.value--;
    }
  };

  /**
   * 되돌리기 (Undo)
   */
  const undo = (): boolean => {
    if (historyIndex.value > 0) {
      historyIndex.value--;
      canvasState.value.strokes = [...strokeHistory.value[historyIndex.value]];
      redrawCanvas();
      return true;
    }
    return false;
  };

  /**
   * 다시하기 (Redo)
   */
  const redo = (): boolean => {
    if (historyIndex.value < strokeHistory.value.length - 1) {
      historyIndex.value++;
      canvasState.value.strokes = [...strokeHistory.value[historyIndex.value]];
      redrawCanvas();
      return true;
    }
    return false;
  };

  /**
   * 캔버스 다시 그리기
   */
  const redrawCanvas = () => {
    if (!drawingCanvas.value) return;
    
    const ctx = drawingCanvas.value.getContext('2d');
    if (!ctx) return;
    
    // 캔버스 지우기
    ctx.clearRect(0, 0, canvasSize.value.width, canvasSize.value.height);
    
    // 모든 스트로크 다시 그리기
    canvasState.value.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      
      ctx.stroke();
    });
  };

  /**
   * 캔버스 지우기
   */
  const clearCanvas = () => {
    if (!drawingCanvas.value) return;
    
    canvasState.value.strokes = [];
    canvasState.value.currentStroke = [];
    canvasState.value.isDrawing = false;
    
    const ctx = drawingCanvas.value.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvasSize.value.width, canvasSize.value.height);
    }
    
    saveToHistory();
  };

  /**
   * 색칠 완성도 계산 (0-100%)
   */
  const getColoringProgress = (): number => {
    if (!drawingCanvas.value) return 0;
    
    const ctx = drawingCanvas.value.getContext('2d');
    if (!ctx) return 0;
    
    try {
      // 캔버스의 이미지 데이터 가져오기
      const imageData = ctx.getImageData(0, 0, canvasSize.value.width, canvasSize.value.height);
      const data = imageData.data;
      
      let coloredPixels = 0;
      let totalPixels = 0;
      
      // 4픽셀씩 건너뛰면서 검사 (성능 최적화)
      for (let i = 0; i < data.length; i += 16) { // RGBA * 4픽셀
        const alpha = data[i + 3]; // 알파 채널
        totalPixels++;
        
        // 알파값이 0보다 크면 색칠된 것으로 간주
        if (alpha > 0) {
          coloredPixels++;
        }
      }
      
      const progress = totalPixels > 0 ? (coloredPixels / totalPixels) * 100 : 0;
      console.log('🎨 Coloring progress:', Math.round(progress) + '%', `(${coloredPixels}/${totalPixels} pixels)`);
      
      return Math.min(progress, 100);
    } catch (error) {
      console.error('Error calculating coloring progress:', error);
      return 0;
    }
  };

  /**
   * 완성된 작품을 이미지로 변환
   */
  const getArtworkAsImage = (): string | null => {
    if (!backgroundCanvas.value || !drawingCanvas.value) return null;
    
    // 임시 캔버스 생성
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasSize.value.width;
    tempCanvas.height = canvasSize.value.height;
    
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return null;
    
    // 배경 이미지와 그리기를 합성
    ctx.drawImage(backgroundCanvas.value, 0, 0);
    ctx.drawImage(drawingCanvas.value, 0, 0);
    
    return tempCanvas.toDataURL('image/png');
  };

  /**
   * 색상 설정
   */
  const setColor = (color: string) => {
    currentColor.value = color;
  };

  /**
   * 브러쉬 크기 설정
   */
  const setBrushSize = (size: number) => {
    currentBrushSize.value = size;
  };
  
  /**
   * 그리기 모드 설정 (브러쉬/지우개)
   */
  const setDrawingMode = (mode: 'brush' | 'eraser') => {
    drawingMode.value = mode;
  };

  /**
   * 되돌리기 가능 여부 확인
   */
  const canUndo = (): boolean => {
    return historyIndex.value > 0;
  };

  /**
   * 다시하기 가능 여부 확인
   */
  const canRedo = (): boolean => {
    return historyIndex.value < strokeHistory.value.length - 1;
  };

  return {
    // 상태
    canvasState,
    currentColor,
    currentBrushSize,
    drawingMode,
    canvasSize,
    backgroundCanvas,
    drawingCanvas,
    
    // 초기화 및 설정
    initializeCanvas,
    loadBackgroundImage,
    setColor,
    setBrushSize,
    setDrawingMode,
    
    // 그리기 기능
    startDrawing,
    continueDrawing, 
    stopDrawing,
    getCanvasPoint,
    
    // 편집 기능
    undo,
    redo,
    clearCanvas,
    canUndo,
    canRedo,
    
    // 내보내기
    getArtworkAsImage,
    getColoringProgress
  };
}