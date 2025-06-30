import { ref } from 'vue';

export function useFileUpload() {
  const isUploading = ref(false);
  const uploadProgress = ref(0);

  // 서버 업로드 함수 (이미지/오디오)
  const uploadFile = async (file: File, type: 'image' | 'audio'): Promise<string> => {
    try {
      isUploading.value = true;
      uploadProgress.value = 0;

      const formData = new FormData();
      formData.append(type, file);
      const endpoint = type === 'image' ? '/api/upload/image' : '/api/upload/audio';

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
    if (filename.startsWith('/uploads/images/') || filename.startsWith('/uploads/audio/')) {
      return filename;
    }
    return null;
  };

  const validateFile = (file: File, type: 'image' | 'audio'): { valid: boolean; error?: string } => {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { valid: false, error: '파일 크기는 10MB 이하여야 합니다.' };
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
    }
    return { valid: true };
  };

  return {
    isUploading,
    uploadProgress,
    uploadFile,
    getUploadedFileUrl,
    validateFile
  };
}