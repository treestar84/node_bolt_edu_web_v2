import { ref } from 'vue';

export const useAutoCoverGeneration = () => {
  const isGenerating = ref(false);
  const error = ref<string>('');
  const generationStatus = ref<string>('');

  /**
   * 백엔드 API를 사용하여 비디오에서 커버 이미지를 자동 생성
   * @param videoPath 업로드된 비디오 파일 경로 (예: /uploads/videos/xxx.mp4)
   * @returns Promise<string> - 생성된 커버 이미지 URL
   */
  const generateCoverFromVideo = async (videoPath: string): Promise<string> => {
    isGenerating.value = true;
    error.value = '';
    generationStatus.value = '비디오에서 첫 번째 프레임을 추출하는 중...';

    try {
      console.log('🎬 백엔드 API로 비디오 커버 생성 시작:', videoPath);

      const response = await fetch('/server/api/video/extract-frame-from-path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: JSON.stringify({
          videoPath: videoPath
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data.frameUrl) {
        generationStatus.value = '커버 이미지 생성 완료!';
        console.log('✅ 백엔드 비디오 커버 생성 성공:', result.data);
        
        // 썸네일 URL을 반환 (더 작은 크기)
        return result.data.thumbnailUrl || result.data.frameUrl;
      } else {
        throw new Error('커버 이미지 생성에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      error.value = errorMessage;
      generationStatus.value = '커버 생성 실패';
      console.error('❌ 백엔드 비디오 커버 생성 실패:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      isGenerating.value = false;
    }
  };

  /**
   * 업로드된 비디오 파일에서 직접 커버 이미지를 생성
   * @param videoFile 비디오 파일 객체
   * @returns Promise<string> - 생성된 커버 이미지 URL
   */
  const generateCoverFromVideoFile = async (videoFile: File): Promise<string> => {
    isGenerating.value = true;
    error.value = '';
    generationStatus.value = '비디오를 업로드하고 커버를 생성하는 중...';

    try {
      console.log('🎬 비디오 파일에서 커버 생성 시작:', videoFile.name);

      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch('/server/api/video/extract-frame', {
        method: 'POST',
        headers: {
          'X-API-Key': import.meta.env.VITE_API_KEY
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data.frameUrl) {
        generationStatus.value = '커버 이미지 생성 완료!';
        console.log('✅ 비디오 파일 커버 생성 성공:', result.data);
        
        return result.data.thumbnailUrl || result.data.frameUrl;
      } else {
        throw new Error('커버 이미지 생성에 실패했습니다.');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      error.value = errorMessage;
      generationStatus.value = '커버 생성 실패';
      console.error('❌ 비디오 파일 커버 생성 실패:', errorMessage);
      throw new Error(errorMessage);
    } finally {
      isGenerating.value = false;
    }
  };

  /**
   * 첫 번째 페이지 이미지에서 커버 이미지를 생성
   * @param firstPageImageUrl 첫 번째 페이지 이미지 URL
   * @returns Promise<string> - 생성된 커버 이미지 URL (또는 원본 URL)
   */
  const generateCoverFromFirstPage = async (firstPageImageUrl: string): Promise<string> => {
    console.log('📷 첫 번째 페이지에서 커버 생성:', firstPageImageUrl);
    
    // 현재는 단순히 첫 번째 페이지 이미지를 그대로 반환
    // 필요하다면 서버에서 리사이징/최적화 API를 만들 수 있음
    return firstPageImageUrl;
  };

  /**
   * 플레이스홀더 커버 이미지를 생성
   * @param title 책 제목
   * @returns Promise<string> - 생성된 플레이스홀더 이미지 URL
   */
  const generatePlaceholderCover = async (title: string): Promise<string> => {
    generationStatus.value = '플레이스홀더 커버를 생성하는 중...';
    
    try {
      console.log('🎨 플레이스홀더 커버 생성:', title);

      // SVG를 이용한 간단한 플레이스홀더 생성
      const placeholderSvg = `
        <svg width="320" height="240" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <rect width="320" height="240" fill="url(#grad1)" />
          <text x="160" y="100" font-family="Arial, sans-serif" font-size="18" fill="white" text-anchor="middle" font-weight="bold">
            📖 ${title}
          </text>
          <text x="160" y="130" font-family="Arial, sans-serif" font-size="14" fill="white" text-anchor="middle">
            스토리북
          </text>
        </svg>
      `;

      // SVG를 Data URL로 변환
      const dataUrl = `data:image/svg+xml;base64,${btoa(placeholderSvg)}`;
      
      generationStatus.value = '플레이스홀더 커버 생성 완료!';
      return dataUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '플레이스홀더 생성 실패';
      error.value = errorMessage;
      generationStatus.value = '플레이스홀더 생성 실패';
      throw new Error(errorMessage);
    }
  };

  /**
   * 자동 커버 생성 (우선순위 시스템)
   * 1. 사용자 업로드 커버 (있으면 그대로 사용)
   * 2. 비디오에서 추출 (비디오 모드인 경우)
   * 3. 첫 번째 페이지 이미지 (전통적인 책인 경우)
   * 4. 플레이스홀더 생성
   */
  const autoGenerateCover = async (bookData: {
    title: string;
    coverImage?: string;
    isVideoMode?: boolean;
    videoUrl?: string;
    pages?: Array<{ imageUrl?: string }>;
  }): Promise<string> => {
    try {
      // 1. 사용자가 이미 커버 이미지를 제공한 경우
      if (bookData.coverImage && bookData.coverImage.trim()) {
        console.log('📷 기존 커버 이미지 사용:', bookData.coverImage);
        return bookData.coverImage;
      }

      console.log('🤖 자동 커버 생성 시작:', bookData.title);

      // 2. 비디오 모드인 경우 비디오에서 추출 시도
      if (bookData.isVideoMode && bookData.videoUrl) {
        try {
          const videoCover = await generateCoverFromVideo(bookData.videoUrl);
          console.log('✅ 비디오에서 커버 추출 성공');
          return videoCover;
        } catch (error) {
          console.warn('⚠️ 비디오 커버 생성 실패, 다음 방법 시도:', error);
        }
      }

      // 3. 전통적인 책인 경우 첫 번째 페이지 이미지 사용 시도
      if (!bookData.isVideoMode && bookData.pages && bookData.pages.length > 0 && bookData.pages[0].imageUrl) {
        try {
          const firstPageCover = await generateCoverFromFirstPage(bookData.pages[0].imageUrl);
          console.log('✅ 첫 번째 페이지에서 커버 생성 성공');
          return firstPageCover;
        } catch (error) {
          console.warn('⚠️ 첫 번째 페이지 커버 생성 실패, 플레이스홀더 생성:', error);
        }
      }

      // 4. 마지막 수단: 플레이스홀더 생성
      const placeholderCover = await generatePlaceholderCover(bookData.title);
      console.log('✅ 플레이스홀더 커버 생성 성공');
      return placeholderCover;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '커버 생성 실패';
      console.error('❌ 자동 커버 생성 최종 실패:', errorMessage);
      error.value = errorMessage;
      throw new Error(errorMessage);
    }
  };

  /**
   * FFmpeg 사용 가능 여부 확인
   */
  const checkFFmpegStatus = async (): Promise<{ available: boolean; message: string }> => {
    try {
      const response = await fetch('/server/api/video/ffmpeg-status');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        available: result.available,
        message: result.message
      };
    } catch (err) {
      console.error('❌ FFmpeg 상태 확인 실패:', err);
      return {
        available: false,
        message: 'FFmpeg 상태를 확인할 수 없습니다.'
      };
    }
  };

  /**
   * 생성 상태 초기화
   */
  const resetStatus = () => {
    isGenerating.value = false;
    error.value = '';
    generationStatus.value = '';
  };

  return {
    isGenerating,
    error,
    generationStatus,
    generateCoverFromVideo,
    generateCoverFromVideoFile,
    generateCoverFromFirstPage,
    generatePlaceholderCover,
    autoGenerateCover,
    checkFFmpegStatus,
    resetStatus
  };
};