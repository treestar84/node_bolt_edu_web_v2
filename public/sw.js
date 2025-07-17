/**
 * Service Worker for 똑똑한 아이들 - 유아 학습 앱
 * PWA 오프라인 지원 및 캐싱 전략 구현
 */

const CACHE_NAME = 'toddler-app-v1.0.0';
const OFFLINE_URL = '/offline.html';

// 캐시할 핵심 리소스들
const CORE_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // CSS 및 폰트
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css'
];

// 동적 캐시 전략이 필요한 리소스 패턴
const DYNAMIC_CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com\//,
  /^https:\/\/fonts\.gstatic\.com\//,
  /^https:\/\/cdn\.jsdelivr\.net\//,
  /\/api\/words/,
  /\/api\/books/,
  /\/server\/uploads\//
];

// 오프라인 시 보여줄 페이지들
const OFFLINE_FALLBACK_PAGES = [
  '/words',
  '/books',
  '/quiz',
  '/puzzle',
  '/achievements'
];

/**
 * Service Worker 설치 이벤트
 */
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker 설치 중...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('✅ 핵심 리소스 캐시 중...');
        return cache.addAll(CORE_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker 설치 완료');
        // 새 버전 즉시 활성화
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker 설치 실패:', error);
      })
  );
});

/**
 * Service Worker 활성화 이벤트
 */
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker 활성화 중...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ 이전 캐시 삭제:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker 활성화 완료');
        // 모든 탭에서 새 Service Worker 적용
        return self.clients.claim();
      })
  );
});

/**
 * 네트워크 요청 가로채기 (Fetch 이벤트)
 */
self.addEventListener('fetch', (event) => {
  // POST 요청은 캐시하지 않음
  if (event.request.method !== 'GET') {
    return;
  }

  // Chrome extension 요청 무시
  if (event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    handleFetchRequest(event.request)
  );
});

/**
 * 요청 처리 전략
 */
async function handleFetchRequest(request) {
  const url = new URL(request.url);
  
  try {
    // 1. 네비게이션 요청 (페이지 이동)
    if (request.mode === 'navigate') {
      return await handleNavigationRequest(request);
    }
    
    // 2. 이미지 요청
    if (request.destination === 'image') {
      return await handleImageRequest(request);
    }
    
    // 3. 오디오 요청
    if (request.destination === 'audio') {
      return await handleAudioRequest(request);
    }
    
    // 4. API 요청
    if (url.pathname.startsWith('/api/')) {
      return await handleApiRequest(request);
    }
    
    // 5. 정적 리소스 요청
    if (isDynamicCachePattern(request.url)) {
      return await handleStaticResourceRequest(request);
    }
    
    // 6. 기본 네트워크 우선 전략
    return await handleDefaultRequest(request);
    
  } catch (error) {
    console.error('❌ 요청 처리 실패:', error);
    return await handleOfflineResponse(request);
  }
}

/**
 * 네비게이션 요청 처리 (페이지 이동)
 */
async function handleNavigationRequest(request) {
  try {
    // 네트워크 우선 시도
    const networkResponse = await fetch(request);
    
    // 성공하면 캐시에 저장
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 네트워크 실패 시 캐시에서 찾기
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 오프라인 페이지 반환
    return caches.match(OFFLINE_URL);
  }
}

/**
 * 이미지 요청 처리 (캐시 우선)
 */
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // 오프라인 시 기본 이미지 반환
    return caches.match('/icons/icon-192x192.png');
  }
}

/**
 * 오디오 요청 처리 (네트워크 우선)
 */
async function handleAudioRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    return caches.match(request);
  }
}

/**
 * API 요청 처리 (네트워크 우선, 캐시 백업)
 */
async function handleApiRequest(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // API 오프라인 응답
    return new Response(
      JSON.stringify({
        error: '오프라인 상태입니다. 인터넷 연결을 확인해주세요.',
        offline: true
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * 정적 리소스 요청 처리 (캐시 우선)
 */
async function handleStaticResourceRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw error;
  }
}

/**
 * 기본 요청 처리 (네트워크 우선)
 */
async function handleDefaultRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    return caches.match(request);
  }
}

/**
 * 오프라인 응답 처리
 */
async function handleOfflineResponse(request) {
  if (request.mode === 'navigate') {
    return caches.match(OFFLINE_URL);
  }
  
  return new Response(
    'Network error occurred.',
    {
      status: 408,
      headers: { 'Content-Type': 'text/plain' }
    }
  );
}

/**
 * 동적 캐시 패턴 확인
 */
function isDynamicCachePattern(url) {
  return DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

/**
 * 백그라운드 동기화 (미래 기능)
 */
self.addEventListener('sync', (event) => {
  console.log('🔄 백그라운드 동기화:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

/**
 * 푸시 알림 처리 (미래 기능)
 */
self.addEventListener('push', (event) => {
  console.log('📱 푸시 알림 수신:', event.data?.text());
  
  const options = {
    body: event.data?.text() || '새로운 학습 콘텐츠가 추가되었습니다!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'learning-notification',
    requireInteraction: true,
    actions: [
      {
        action: 'open',
        title: '앱 열기',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: '닫기'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('똑똑한 아이들', options)
  );
});

/**
 * 알림 클릭 처리
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 알림 클릭:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * 백그라운드 동기화 처리
 */
async function handleBackgroundSync() {
  console.log('🔄 백그라운드 동기화 실행');
  
  try {
    // 학습 진도 동기화
    await syncLearningProgress();
    
    // 오프라인 상태에서 수집된 데이터 업로드
    await uploadOfflineData();
    
    console.log('✅ 백그라운드 동기화 완료');
  } catch (error) {
    console.error('❌ 백그라운드 동기화 실패:', error);
  }
}

/**
 * 학습 진도 동기화
 */
async function syncLearningProgress() {
  // 구현 예정
  console.log('📊 학습 진도 동기화');
}

/**
 * 오프라인 데이터 업로드
 */
async function uploadOfflineData() {
  // 구현 예정
  console.log('📤 오프라인 데이터 업로드');
}

console.log('🚀 Service Worker 로드 완료');