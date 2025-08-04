import { ref, onMounted, onUnmounted } from 'vue'

export function useLazyLoading() {
  const visibleElements = ref<Record<string, boolean>>({})
  const observer = ref<IntersectionObserver | null>(null)
  const visibilityCallbacks = ref<Record<string, () => void>>({})

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
              visibleElements.value[elementId] = true
              
              // 콜백 실행
              const callback = visibilityCallbacks.value[elementId]
              if (callback) {
                callback()
                delete visibilityCallbacks.value[elementId]
              }
              
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

  const observeElement = (element: Element, id: string, onVisible?: () => void) => {
    if (!observer.value) return
    
    element.setAttribute('data-lazy-id', id)
    if (onVisible) {
      visibilityCallbacks.value[id] = onVisible
    }
    observer.value.observe(element)
  }

  const isVisible = (id: string): boolean => {
    // Intersection Observer를 지원하지 않는 경우 항상 true 반환
    if (!observer.value) return true
    return visibleElements.value[id] || false
  }

  const preloadVisible = (id: string) => {
    visibleElements.value[id] = true
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
  const loadingStates = ref<Record<string, 'loading' | 'loaded' | 'error'>>({})
  const lowQualityLoaded = ref<Record<string, boolean>>({})

  const setLoadingState = (id: string, state: 'loading' | 'loaded' | 'error') => {
    if (loadingStates.value[id] === state) return // 동일한 상태면 업데이트 하지 않음
    
    console.log(`🔄 Loading state changed: ${id} -> ${state}`)
    loadingStates.value[id] = state
  }

  const getLoadingState = (id: string) => {
    return loadingStates.value[id] || 'loaded'
  }

  const setLowQualityLoaded = (id: string) => {
    if (lowQualityLoaded.value[id]) return // 이미 로드된 상태면 업데이트 하지 않음
    
    lowQualityLoaded.value[id] = true
  }

  const isLowQualityLoaded = (id: string) => {
    return lowQualityLoaded.value[id] || false
  }

  // 저화질 이미지 URL 생성 (블러 효과용)
  const getLowQualityImageUrl = (originalUrl: string): string => {
    if (!originalUrl) return ''
    
    // 서버 경로 처리
    let baseUrl = originalUrl
    if (originalUrl.startsWith('/uploads/')) {
      baseUrl = '/server' + originalUrl
    }
    
    // 현재 서버에서 이미지 리사이징을 지원하지 않으므로 원본 URL 반환
    // Progressive Loading을 위해 동일한 이미지를 사용
    return baseUrl
  }

  // 썸네일 URL 생성
  const getThumbnailUrl = (originalUrl: string, width = 300, height = 200): string => {
    if (!originalUrl) return ''
    
    // 서버 경로 처리
    let baseUrl = originalUrl
    if (originalUrl.startsWith('/uploads/')) {
      baseUrl = '/server' + originalUrl
    }
    
    // 현재 서버에서 이미지 리사이징을 지원하지 않으므로 원본 URL 반환
    // 나중에 썸네일 API가 구현되면 파라미터 추가
    return baseUrl // + `?w=${width}&h=${height}&q=80`
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