import { ref } from 'vue';
import { getPexelsService } from '@/services/pexelsService';
import { useFileUpload } from './useFileUpload';

export function useAutoImageFetch() {
  const isSearching = ref(false);
  const searchError = ref<string | null>(null);
  const { uploadFile } = useFileUpload();

  const fetchAndUploadImage = async (
    koreanWord: string, 
    englishWord: string
  ): Promise<string | null> => {
    try {
      isSearching.value = true;
      searchError.value = null;

      console.log(`🔍 Searching for image: Korean="${koreanWord}", English="${englishWord}"`);

      // Pexels에서 이미지 검색
      const pexelsService = getPexelsService();
      const photo = await pexelsService.searchForWord(koreanWord, englishWord);

      if (!photo) {
        searchError.value = '적합한 이미지를 찾을 수 없습니다.';
        return null;
      }

      console.log(`📸 Found image from Pexels: ${photo.alt} by ${photo.photographer}`);

      // 이미지 다운로드
      const imageUrl = pexelsService.selectBestImageSize(photo);
      const imageBlob = await pexelsService.downloadImage(imageUrl);

      // 이미지를 File 객체로 변환
      const fileExtension = getFileExtensionFromUrl(imageUrl);
      const fileName = `${englishWord.toLowerCase().replace(/\s+/g, '-')}-${photo.id}.${fileExtension}`;
      const imageFile = new File([imageBlob], fileName, { type: imageBlob.type });

      console.log(`⬆️ Uploading image: ${fileName}`);

      // 서버에 업로드
      const uploadedUrl = await uploadFile(imageFile, 'image');
      
      console.log(`✅ Image uploaded successfully: ${uploadedUrl}`);
      
      return uploadedUrl;
    } catch (error) {
      console.error('❌ Error in fetchAndUploadImage:', error);
      searchError.value = error instanceof Error ? error.message : '이미지 처리 중 오류가 발생했습니다.';
      return null;
    } finally {
      isSearching.value = false;
    }
  };

  const getFileExtensionFromUrl = (url: string): string => {
    // URL에서 파일 확장자 추출
    const urlParts = url.split('.');
    const extension = urlParts[urlParts.length - 1].split('?')[0]; // 쿼리 파라미터 제거
    
    // 일반적인 이미지 확장자가 아니면 기본값 사용
    const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    return validExtensions.includes(extension.toLowerCase()) ? extension : 'jpg';
  };

  const clearError = () => {
    searchError.value = null;
  };

  return {
    isSearching,
    searchError,
    fetchAndUploadImage,
    clearError
  };
}