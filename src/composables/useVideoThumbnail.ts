import { ref } from 'vue';

export const useVideoThumbnail = () => {
  const isGenerating = ref(false);
  const error = ref<string>('');

  /**
   * 비디오 파일에서 썸네일 이미지를 생성합니다
   * @param videoSrc 비디오 파일 URL 또는 Blob URL
   * @param time 캡처할 시간 (초, 기본값: 1초)
   * @param width 썸네일 너비 (기본값: 320px)
   * @param height 썸네일 높이 (기본값: 240px)
   * @returns Promise<string> - Base64 인코딩된 이미지 데이터 URL
   */
  const generateThumbnail = async (
    videoSrc: string,
    time: number = 1,
    width: number = 320,
    height: number = 240
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      isGenerating.value = true;
      error.value = '';

      // 비디오 엘리먼트 생성
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.muted = true;
      video.preload = 'metadata';

      // Canvas 엘리먼트 생성
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        isGenerating.value = false;
        error.value = 'Canvas context를 생성할 수 없습니다.';
        reject(new Error('Canvas context를 생성할 수 없습니다.'));
        return;
      }

      // 비디오 로드 완료 후 캡처
      video.addEventListener('loadedmetadata', () => {
        // 캔버스 크기 설정
        canvas.width = width;
        canvas.height = height;
        
        // 지정된 시간으로 이동
        video.currentTime = Math.min(time, video.duration);
      });

      // 시간 위치 이동 완료 후 캡처
      video.addEventListener('seeked', () => {
        try {
          // 비디오 프레임을 캔버스에 그리기
          ctx.drawImage(video, 0, 0, width, height);
          
          // 캔버스 내용을 Base64 이미지로 변환
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          isGenerating.value = false;
          resolve(thumbnailDataUrl);
        } catch (err) {
          isGenerating.value = false;
          const errorMessage = err instanceof Error ? err.message : '썸네일 생성 중 오류가 발생했습니다.';
          error.value = errorMessage;
          reject(new Error(errorMessage));
        }
      });

      // 에러 핸들링
      video.addEventListener('error', () => {
        isGenerating.value = false;
        const errorMessage = '비디오 로드 중 오류가 발생했습니다.';
        error.value = errorMessage;
        reject(new Error(errorMessage));
      });

      // 비디오 소스 설정 (로드 시작)
      video.src = videoSrc;
    });
  };

  /**
   * 파일에서 썸네일을 생성합니다
   * @param file 비디오 파일
   * @param time 캡처할 시간 (초)
   * @param width 썸네일 너비
   * @param height 썸네일 높이
   * @returns Promise<string> - Base64 인코딩된 이미지 데이터 URL
   */
  const generateThumbnailFromFile = async (
    file: File,
    time: number = 1,
    width: number = 320,
    height: number = 240
  ): Promise<string> => {
    const videoUrl = URL.createObjectURL(file);
    
    try {
      const thumbnail = await generateThumbnail(videoUrl, time, width, height);
      return thumbnail;
    } finally {
      // 메모리 해제
      URL.revokeObjectURL(videoUrl);
    }
  };

  /**
   * Base64 데이터 URL을 Blob으로 변환합니다
   * @param dataUrl Base64 데이터 URL
   * @returns Blob
   */
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    return new Blob([u8arr], { type: mime });
  };

  /**
   * 썸네일을 서버에 업로드합니다
   * @param thumbnailDataUrl Base64 데이터 URL
   * @param filename 파일명 (확장자 제외)
   * @returns Promise<string> - 업로드된 썸네일 URL
   */
  const uploadThumbnail = async (thumbnailDataUrl: string, filename: string): Promise<string> => {
    const blob = dataUrlToBlob(thumbnailDataUrl);
    const formData = new FormData();
    formData.append('image', blob, `${filename}_thumbnail.jpg`);

    const response = await fetch('/server/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || '썸네일 업로드에 실패했습니다.');
    }

    const result = await response.json();
    return result.url;
  };

  return {
    isGenerating,
    error,
    generateThumbnail,
    generateThumbnailFromFile,
    dataUrlToBlob,
    uploadThumbnail
  };
};