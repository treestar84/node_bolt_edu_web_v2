import { ref } from 'vue';

export interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio: number;
}

export function useFileUpload() {
  const isUploading = ref(false);
  const uploadProgress = ref(0);

  // 서버 업로드 함수 (이미지/오디오/비디오)
  const uploadFile = async (file: File, type: 'image' | 'audio' | 'video'): Promise<string> => {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;

      const formData = new FormData();
      formData.append(type, file);
      let endpoint: string;
      if (type === 'image') {
        endpoint = '/api/upload/image';
      } else if (type === 'audio') {
        endpoint = '/api/upload/audio';
      } else {
        endpoint = '/api/upload/video';
      }

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        uploadProgress.value += 10;
        if (uploadProgress.value >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      uploadProgress.value = 100;

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data?.url) {
        return result.data.url; // ex: /uploads/images/xxx.png
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } finally {
      isUploading.value = false;
      uploadProgress.value = 0;
    }
  };

  // 서버 파일 경로만 반환
  const getUploadedFileUrl = (filename: string): string | null => {
    if (filename.startsWith('/uploads/images/') || filename.startsWith('/uploads/audio/') || filename.startsWith('/uploads/videos/')) {
      return filename;
    }
    return null;
  };

  // 이미지 크기 추출 함수
  const getImageDimensions = (file: File): Promise<ImageDimensions> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('Not an image file'));
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        const dimensions: ImageDimensions = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          aspectRatio: img.naturalWidth / img.naturalHeight
        };
        
        URL.revokeObjectURL(url);
        resolve(dimensions);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };

      img.src = url;
    });
  };

  // 향상된 업로드 함수 (이미지 크기 정보 포함)
  const uploadFileWithDimensions = async (
    file: File, 
    type: 'image' | 'audio' | 'video'
  ): Promise<{ url: string; dimensions?: ImageDimensions }> => {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;

      let dimensions: ImageDimensions | undefined;
      
      // 이미지인 경우 크기 정보 추출
      if (type === 'image') {
        try {
          dimensions = await getImageDimensions(file);
          console.log('🖼️ Image dimensions extracted:', dimensions);
        } catch (error) {
          console.warn('Failed to extract image dimensions:', error);
        }
      }

      const formData = new FormData();
      formData.append(type, file);
      
      // 이미지 크기 정보도 함께 전송
      if (dimensions) {
        formData.append('imageWidth', dimensions.width.toString());
        formData.append('imageHeight', dimensions.height.toString());
        formData.append('imageAspectRatio', dimensions.aspectRatio.toString());
      }

      let endpoint: string;
      if (type === 'image') {
        endpoint = '/api/upload/image';
      } else if (type === 'audio') {
        endpoint = '/api/upload/audio';
      } else {
        endpoint = '/api/upload/video';
      }

      // 업로드 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        uploadProgress.value += 10;
        if (uploadProgress.value >= 90) {
          clearInterval(progressInterval);
        }
      }, 100);

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      uploadProgress.value = 100;

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success && result.data?.url) {
        return { 
          url: result.data.url,
          dimensions
        };
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } finally {
      isUploading.value = false;
      uploadProgress.value = 0;
    }
  };

  const validateFile = (file: File, type: 'image' | 'audio' | 'video'): { valid: boolean; error?: string } => {
    const maxSize = 200 * 1024 * 1024; // 200MB
    if (file.size > maxSize) {
      return { valid: false, error: '파일 크기는 200MB 이하여야 합니다.' };
    }
    if (type === 'image') {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        return { valid: false, error: '지원되는 이미지 형식: JPG, PNG, GIF, WebP' };
      }
    } else if (type === 'audio') {
      const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      if (!validTypes.includes(file.type)) {
        return { valid: false, error: '지원되는 오디오 형식: MP3, WAV, OGG' };
      }
    } else if (type === 'video') {
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        return { valid: false, error: '지원되는 비디오 형식: MP4, AVI, MOV, WMV, WebM' };
      }
    }
    return { valid: true };
  };

  return {
    isUploading,
    uploadProgress,
    uploadFile,
    uploadFileWithDimensions,
    getImageDimensions,
    getUploadedFileUrl,
    validateFile
  };
}