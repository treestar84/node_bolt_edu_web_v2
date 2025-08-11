import { ref, computed } from 'vue';

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  sizes?: string[];
  loading?: 'lazy' | 'eager';
  priority?: 'high' | 'low' | 'auto';
}

export function useImageOptimization() {
  const isWebPSupported = ref(false);
  const isAVIFSupported = ref(false);
  const connectionType = ref<string>('4g');
  const devicePixelRatio = ref(window.devicePixelRatio || 1);

  // 브라우저 지원 감지
  const detectImageFormatSupport = async () => {
    // WebP 지원 확인
    const webpCanvas = document.createElement('canvas');
    webpCanvas.width = 1;
    webpCanvas.height = 1;
    isWebPSupported.value = webpCanvas.toDataURL('image/webp').startsWith('data:image/webp');

    // AVIF 지원 확인 (더 정확한 방법)
    try {
      const avifTest = new Image();
      const avifPromise = new Promise<boolean>((resolve) => {
        avifTest.onload = () => resolve(true);
        avifTest.onerror = () => resolve(false);
        avifTest.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
      });
      isAVIFSupported.value = await avifPromise;
    } catch (error) {
      isAVIFSupported.value = false;
    }

    // 네트워크 연결 타입 감지
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection) {
      connectionType.value = connection.effectiveType || connection.type || '4g';
    }
  };

  // 최적화된 이미지 URL 생성
  const generateOptimizedUrl = (
    originalUrl: string,
    options: ImageOptimizationOptions = {}
  ): string => {
    const {
      quality = getOptimalQuality(),
      format = getBestFormat(),
      sizes = ['320w', '640w', '1024w'],
      loading = 'lazy'
    } = options;

    // URL이 이미 최적화된 경우 (예: CDN URL)
    if (originalUrl.includes('?') && originalUrl.includes('quality')) {
      return originalUrl;
    }

    // 로컬 파일인 경우 서버 최적화 API 사용
    if (originalUrl.startsWith('/server/uploads/') || originalUrl.startsWith('/uploads/')) {
      const params = new URLSearchParams();
      params.set('quality', quality.toString());
      params.set('format', format);
      params.set('dpr', Math.min(devicePixelRatio.value, 2).toString()); // 최대 2x까지만
      
      return `${originalUrl}?${params.toString()}`;
    }

    return originalUrl;
  };

  // 최적 품질 결정
  const getOptimalQuality = (): number => {
    switch (connectionType.value) {
      case 'slow-2g':
      case '2g':
        return 60;
      case '3g':
        return 75;
      case '4g':
      default:
        return 85;
    }
  };

  // 최적 포맷 결정
  const getBestFormat = (): string => {
    if (isAVIFSupported.value) return 'avif';
    if (isWebPSupported.value) return 'webp';
    return 'jpeg';
  };

  // srcset 생성
  const generateSrcSet = (baseUrl: string, options: ImageOptimizationOptions = {}): string => {
    const { sizes = ['320w', '640w', '1024w'], format = getBestFormat(), quality = getOptimalQuality() } = options;
    
    return sizes.map(size => {
      const width = parseInt(size);
      const params = new URLSearchParams();
      params.set('w', width.toString());
      params.set('quality', quality.toString());
      params.set('format', format);
      
      const optimizedUrl = baseUrl.includes('?') 
        ? `${baseUrl}&${params.toString()}`
        : `${baseUrl}?${params.toString()}`;
      
      return `${optimizedUrl} ${size}`;
    }).join(', ');
  };

  // 이미지 프리로딩
  const preloadImage = (url: string, priority: 'high' | 'low' = 'low'): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // 고해상도 디스플레이 처리
      if (devicePixelRatio.value > 1) {
        img.setAttribute('loading', priority === 'high' ? 'eager' : 'lazy');
      }
      
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = generateOptimizedUrl(url, { priority });
    });
  };

  // 중요한 이미지 배치 프리로딩
  const preloadCriticalImages = async (urls: string[]): Promise<void> => {
    const preloadPromises = urls.slice(0, 3).map(url => 
      preloadImage(url, 'high').catch(error => {
        console.warn('Critical image preload failed:', url, error);
      })
    );
    
    await Promise.all(preloadPromises);
  };

  // 이미지 압축 (클라이언트 사이드)
  const compressImage = async (
    file: File,
    options: { quality?: number; maxWidth?: number; maxHeight?: number } = {}
  ): Promise<File> => {
    const { quality = 0.8, maxWidth = 1024, maxHeight = 1024 } = options;
    
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 크기 계산
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob으로 변환
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // 반응형 이미지 속성 생성
  const getResponsiveImageProps = (url: string, options: ImageOptimizationOptions = {}) => {
    const optimizedUrl = generateOptimizedUrl(url, options);
    const srcSet = generateSrcSet(url, options);
    
    return {
      src: optimizedUrl,
      srcset: srcSet,
      sizes: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw',
      loading: options.loading || 'lazy',
      decoding: 'async'
    };
  };

  // 초기화
  detectImageFormatSupport();

  return {
    isWebPSupported: readonly(isWebPSupported),
    isAVIFSupported: readonly(isAVIFSupported),
    connectionType: readonly(connectionType),
    devicePixelRatio: readonly(devicePixelRatio),
    
    generateOptimizedUrl,
    generateSrcSet,
    preloadImage,
    preloadCriticalImages,
    compressImage,
    getResponsiveImageProps,
    getOptimalQuality,
    getBestFormat
  };
}