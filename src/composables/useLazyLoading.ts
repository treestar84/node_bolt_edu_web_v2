import { ref, onMounted, onUnmounted } from 'vue'

export function useLazyLoading() {
  const visibleElements = ref(new Set<string>())
  const observer = ref<IntersectionObserver | null>(null)

  const initializeObserver = () => {
    if (!('IntersectionObserver' in window)) {
      // Intersection Observer를 지원하지 않는 브라우저에서는 모든 요소를 즉시 표시
      return null
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elementId = entry.target.getAttribute('data-lazy-id')
          if (elementId) {
            if (entry.isIntersecting) {
              visibleElements.value.add(elementId)
              // 한 번 로드되면 관찰 중단
              observer.value?.unobserve(entry.target)
            }
          }
        })
      },
      {
        // 요소가 뷰포트의 10% 정도 보일 때 로드 시작
        rootMargin: '50px',
        threshold: 0.1
      }
    )

    return observer.value
  }

  const observeElement = (element: Element, id: string) => {
    if (!observer.value) return
    
    element.setAttribute('data-lazy-id', id)
    observer.value.observe(element)
  }

  const isVisible = (id: string): boolean => {
    // Intersection Observer를 지원하지 않는 경우 항상 true 반환
    if (!observer.value) return true
    return visibleElements.value.has(id)
  }

  const preloadVisible = (id: string) => {
    visibleElements.value.add(id)
  }

  onMounted(() => {
    initializeObserver()
  })

  onUnmounted(() => {
    if (observer.value) {
      observer.value.disconnect()
    }
  })

  return {
    observeElement,
    isVisible,
    preloadVisible,
    visibleElements
  }
}

// 이미지 로딩 상태 관리
export function useImageLoading() {
  const loadingStates = ref(new Map<string, 'loading' | 'loaded' | 'error'>())
  const lowQualityLoaded = ref(new Set<string>())

  const setLoadingState = (id: string, state: 'loading' | 'loaded' | 'error') => {
    loadingStates.value.set(id, state)
  }

  const getLoadingState = (id: string) => {
    return loadingStates.value.get(id) || 'loading'
  }

  const setLowQualityLoaded = (id: string) => {
    lowQualityLoaded.value.add(id)
  }

  const isLowQualityLoaded = (id: string) => {
    return lowQualityLoaded.value.has(id)
  }

  // 저화질 이미지 URL 생성 (블러 효과용)
  const getLowQualityImageUrl = (originalUrl: string): string => {
    if (!originalUrl) return ''
    
    // 서버 경로 처리
    let baseUrl = originalUrl
    if (originalUrl.startsWith('/uploads/')) {
      baseUrl = '/server' + originalUrl
    }
    
    // 작은 크기로 리사이즈 (서버에서 지원한다면)
    // 현재는 원본 URL을 사용하되, 나중에 썸네일 API 추가 시 활용
    return baseUrl + '?w=50&h=50&q=20' // 예시: 서버에서 리사이즈 지원
  }

  // 썸네일 URL 생성
  const getThumbnailUrl = (originalUrl: string, width = 300, height = 200): string => {
    if (!originalUrl) return ''
    
    // 서버 경로 처리
    let baseUrl = originalUrl
    if (originalUrl.startsWith('/uploads/')) {
      baseUrl = '/server' + originalUrl
    }
    
    // 실제 구현에서는 서버의 이미지 리사이징 API를 사용
    return baseUrl + `?w=${width}&h=${height}&q=80`
  }

  return {
    loadingStates,
    setLoadingState,
    getLoadingState,
    setLowQualityLoaded,
    isLowQualityLoaded,
    getLowQualityImageUrl,
    getThumbnailUrl
  }
}