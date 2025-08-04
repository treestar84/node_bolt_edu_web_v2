import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';
import { createI18nInstance } from '@/utils/i18n';

// i18n 인스턴스는 동적으로 생성됩니다

// 앱 초기화 함수
const initializeApp = async () => {
  try {
    console.log('🌐 Initializing i18n system...');
    
    // i18n 인스턴스 생성 및 초기화
    const i18n = await createI18nInstance();
    
    console.log('🚀 Creating Vue app...');
    const app = createApp(App);
    const pinia = createPinia();

    // 플러그인 등록
    app.use(pinia);
    app.use(router);
    app.use(i18n);

    return { app, pinia, i18n };
  } catch (error) {
    console.error('💥 Failed to initialize i18n:', error);
    throw error;
  }
};

// Initialize stores and content after i18n is ready
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useAppStore } from '@/stores/app';
import { useTheme } from '@/composables/useTheme';

const initializeStores = async () => {
  const authStore = useAuthStore();
  const contentStore = useContentStore();
  const appStore = useAppStore();
  const { watchSystemTheme } = useTheme();
  
  console.log('🚀 Initializing stores and content...');
  
  // 테마 시스템 초기화
  console.log('🎨 Initializing theme system...');
  watchSystemTheme();
  
  try {
    // 1. 먼저 공용 콘텐츠를 로드 (인증 없이도 접근 가능)
    console.log('🌐 Loading public content first...');
    await appStore.loadAllData();
    
    // 2. 인증 상태 확인
    console.log('🔐 Checking authentication...');
    await authStore.initialize();
    
    // 3. 인증된 사용자라면 개인화된 콘텐츠 로드
    if (authStore.isAuthenticated) {
      console.log('👤 User authenticated, loading personalized content...');
      await contentStore.loadContent();
    } else {
      console.log('👤 No authentication, using public content');
      // 공용 콘텐츠를 content store에도 복사
      await contentStore.loadPublicContent();
    }
    
    console.log('✅ Stores initialized successfully');
    console.log('📊 Final content state:', {
      words: authStore.isAuthenticated ? contentStore.words.length : appStore.currentWords.length,
      books: authStore.isAuthenticated ? contentStore.books.length : appStore.currentBooks.length,
      badges: authStore.isAuthenticated ? contentStore.badges.length : appStore.currentBadges.length,
      authenticated: authStore.isAuthenticated
    });
    
  } catch (error) {
    console.error('💥 Error during stores initialization:', error);
    // 에러가 발생해도 최소한 공용 콘텐츠는 로드 시도
    try {
      await appStore.loadAllData();
      await contentStore.loadPublicContent();
      console.log('🔄 Fallback: Public content loaded after error');
    } catch (fallbackError) {
      console.error('💥 Fallback loading also failed:', fallbackError);
    }
  }
};

// Service Worker 등록
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      console.log('🔄 Service Worker 등록 중...');
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker 등록 성공:', registration.scope);
      
      // 업데이트 확인
      registration.addEventListener('updatefound', () => {
        console.log('🔄 Service Worker 업데이트 발견');
        
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('🔄 새 버전의 Service Worker 설치됨');
                // 사용자에게 새로고침 제안 (나중에 토스트 메시지로 개선)
                if (confirm('새로운 버전이 설치되었습니다. 새로고침하시겠습니까?')) {
                  window.location.reload();
                }
              } else {
                console.log('✅ Service Worker 처음 설치됨');
              }
            }
          });
        }
      });
      
      // 활성 Service Worker 변경 감지
      if (registration.active) {
        registration.active.addEventListener('statechange', (event: Event) => {
          const worker = event.target as ServiceWorker;
          if (worker.state === 'activated') {
            console.log('🚀 Service Worker 활성화됨');
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Service Worker 등록 실패:', error);
    }
  } else {
    console.log('⚠️ Service Worker가 지원되지 않는 브라우저입니다.');
  }
};

// PWA 설치 프롬프트 관리
let deferredPrompt: any = null;

// PWA 설치 이벤트 리스너
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📱 PWA 설치 프롬프트 준비됨');
  e.preventDefault();
  deferredPrompt = e;
  
  // 사용자에게 설치 옵션 표시 (나중에 UI로 개선)
  showInstallPrompt();
});

// PWA 설치 프롬프트 표시
const showInstallPrompt = () => {
  // 이미 설치된 경우 무시
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('📱 이미 PWA로 설치되어 있음');
    return;
  }
  
  // 모바일 기기에서만 설치 프롬프트 표시
  if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    setTimeout(() => {
      if (deferredPrompt && confirm('홈 화면에 앱을 설치하시겠습니까?')) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            console.log('✅ PWA 설치 수락됨');
          } else {
            console.log('❌ PWA 설치 거부됨');
          }
          deferredPrompt = null;
        });
      }
    }, 3000); // 3초 후 프롬프트 표시
  }
};

// PWA 설치 완료 이벤트
window.addEventListener('appinstalled', () => {
  console.log('🎉 PWA 설치 완료!');
  deferredPrompt = null;
});

// 온라인/오프라인 상태 모니터링
window.addEventListener('online', () => {
  console.log('🌐 온라인 상태로 전환');
  // 온라인 상태 UI 업데이트 (나중에 구현)
});

window.addEventListener('offline', () => {
  console.log('📴 오프라인 상태로 전환');
  // 오프라인 상태 UI 업데이트 (나중에 구현)
});

// 메인 앱 초기화 및 마운트
const main = async () => {
  try {
    console.log('🌟 Starting application initialization...');
    
    // 1. i18n 시스템과 Vue 앱 초기화
    const { app, i18n } = await initializeApp();
    
    // 2. 스토어 및 콘텐츠 초기화
    await initializeStores();
    
    // 3. 앱 마운트
    console.log('🎯 Mounting Vue application...');
    app.mount('#app');
    
    // 4. Service Worker 등록
    await registerServiceWorker();
    
    console.log('🎉 Application successfully initialized and mounted!');
    
    // i18n 인스턴스를 전역에서 사용할 수 있도록 export
    return i18n;
    
  } catch (error) {
    console.error('💥 Critical error during application initialization:', error);
    
    // 폴백: 최소한의 앱이라도 실행되도록 시도
    try {
      console.log('🔄 Attempting fallback initialization...');
      const { app } = await initializeApp();
      app.mount('#app');
      await registerServiceWorker();
      console.log('🔄 Fallback initialization completed');
    } catch (fallbackError) {
      console.error('💥 Fallback initialization also failed:', fallbackError);
      
      // 최후의 수단: 기본 앱만 마운트
      const basicApp = createApp(App);
      basicApp.mount('#app');
      console.log('⚠️ Basic application mounted without full initialization');
    }
  }
};

// 앱 시작
const i18nInstance = main();

// 전역 i18n 인스턴스 export
export { i18nInstance as i18n };