interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
  next_page: string;
}

class PexelsService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.pexels.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async searchPhotos(query: string, perPage = 20, page = 1): Promise<PexelsSearchResponse> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Pexels API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async searchForWord(koreanWord: string, englishWord: string): Promise<PexelsPhoto | null> {
    try {
      // 먼저 영어 단어로 검색 시도
      let searchResult = await this.searchPhotos(englishWord, 10, 1);
      
      if (searchResult.photos.length > 0) {
        // 가장 적합한 이미지 선택 (첫 번째 결과 사용)
        return searchResult.photos[0];
      }

      // 영어 검색 결과가 없으면 한국어로 검색 시도
      searchResult = await this.searchPhotos(koreanWord, 10, 1);
      
      if (searchResult.photos.length > 0) {
        return searchResult.photos[0];
      }

      return null;
    } catch (error) {
      console.error('Error searching Pexels:', error);
      return null;
    }
  }

  async downloadImage(imageUrl: string): Promise<Blob> {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }
    
    return response.blob();
  }

  selectBestImageSize(photo: PexelsPhoto): string {
    // 단어 카드에 적합한 중간 크기 이미지 선택
    return photo.src.medium || photo.src.small || photo.src.original;
  }
}

// 환경변수에서 API 키 가져오기
const getPexelsApiKey = (): string => {
  const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_PEXELS_API_KEY environment variable is required');
  }
  return apiKey;
};

// 싱글톤 인스턴스 생성
let pexelsServiceInstance: PexelsService | null = null;

export const getPexelsService = (): PexelsService => {
  if (!pexelsServiceInstance) {
    const apiKey = getPexelsApiKey();
    pexelsServiceInstance = new PexelsService(apiKey);
  }
  return pexelsServiceInstance;
};

export type { PexelsPhoto, PexelsSearchResponse };
export { PexelsService };