import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Initialize auth store and load content
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useAppStore } from '@/stores/app';

const initializeApp = async () => {
  const authStore = useAuthStore();
  const contentStore = useContentStore();
  const appStore = useAppStore();
  
  console.log('🚀 Initializing application...');
  
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
    
    console.log('✅ Application initialized successfully');
    console.log('📊 Final content state:', {
      words: authStore.isAuthenticated ? contentStore.words.length : appStore.currentWords.length,
      books: authStore.isAuthenticated ? contentStore.books.length : appStore.currentBooks.length,
      badges: authStore.isAuthenticated ? contentStore.badges.length : appStore.currentBadges.length,
      authenticated: authStore.isAuthenticated
    });
    
  } catch (error) {
    console.error('💥 Error during app initialization:', error);
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

initializeApp().then(() => {
  app.mount('#app');
}).catch((error) => {
  console.error('💥 Failed to initialize application:', error);
  // 초기화 실패해도 앱은 마운트
  app.mount('#app');
});