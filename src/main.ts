import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import './style.css';
import App from './App.vue';
import { createI18n } from 'vue-i18n';

const messages = {
  ko: {
    menu: {
      home: '홈',
      words: '단어학습',
      quiz: '퀴즈',
      puzzle: '퍼즐',
      storybook: '스토리북',
      achievements: '달성도',
      books: '책',
      badges: '뱃지',
      favorites: '좋아요',
      login: '로그인',
      logout: '로그아웃',
      mypage: '마이페이지',
      settings: '설정',
      admin: '관리자'
    },
    landing: {
      welcome: '환영합니다!',
      description: '이곳은 어린이 영어 학습 플랫폼입니다.'
    },
    categories: {
      all: '전체',
      animals: '동물',
      fruits: '과일',
      vehicles: '탈것',
      objects: '사물',
      nature: '자연',
      toys: '장난감',
      clothes: '옷',
      other: '기타',
      person: '사람',
      letter: '글자'
    },
    page: {
      title: '단어 학습',
      desc: '이미지를 클릭하면 {lang} 음성을 들을 수 있어요',
      singleDesc: '이미지를 누르면 음성과 함께 단어를 배워요',
      autoAdvance: '자동 넘김 (10초)',
      prev: '이전',
      next: '다음',
      shuffle: '섞기',
      emptyTitle: '아직 단어가 없습니다',
      emptyDesc: '관리자 페이지에서 새로운 단어를 추가해보세요',
      adminBtn: '관리자 페이지로 이동',
      contentCount: '{count}개 콘텐츠'
    },
    quiz: {
      title: '퀴즈',
      score: '점수',
      streak: '연속 정답',
      start: '퀴즈 시작',
      findAnswer: '정답을 찾아보세요!',
      startGame: '시작하기',
      listen: '음성 듣기',
      correct: '정답!',
      wrong: '오답!',
      badge: '새로운 뱃지 획득!',
      notEnough: '퀴즈를 시작하려면 단어가 3개 이상 필요합니다.',
      needThree: '단어를 3개 이상 추가해주세요.',
      goWords: '단어 추가하러 가기'
    },
    puzzle: {
      title: '퍼즐 맞추기',
      select: '퍼즐을 선택하세요',
      start: '시작하기',
      chooseLevel: '난이도 선택',
      easy: '쉬움',
      normal: '보통',
      goHome: '홈으로',
      playAgain: '다시하기',
      piece: '퍼즐 조각',
      complete: '퍼즐 완성!',
      noImage: '이미지가 없습니다',
      addWord: '단어를 추가해주세요',
      pieceCount: '{count}조각'
    },
    achievements: {
      title: '달성도',
      description: '지금까지의 학습 성과와 획득한 뱃지를 확인해보세요',
      loading: '달성도를 불러오는 중...',
      errorTitle: '데이터를 불러올 수 없습니다',
      retry: '다시 시도',
      earnedBadges: '🏆 획득한 뱃지',
      earned: '획득!',
      noBadges: '아직 획득한 뱃지가 없습니다',
      startLearning: '학습을 시작해서 첫 번째 뱃지를 획득해보세요!',
      startQuiz: '퀴즈 시작하기',
      startWords: '단어 학습하기',
      nextGoals: '🎯 다음 목표',
      learningStats: '📊 학습 통계',
      quizScore: '퀴즈 점수',
      quizStreak: '연속 정답',
      puzzleCompletions: '퍼즐 완성',
      wordsLearned: '학습한 단어',
      booksRead: '읽은 책',
      wordsTotal: '총 {total}개 중',
      booksTotal: '총 {total}권 중',
      nextBadge: '다음 목표',
      categoryQuiz: '퀴즈',
      categoryPuzzle: '퍼즐',
      categoryWords: '단어',
      categoryBooks: '책'
    },
    settings: {
      title: '설정',
      desc: '개인 맞춤 설정을 변경하세요',
      username: '아이디',
      usernamePlaceholder: '아이디를 입력하세요',
      userType: '사용자 유형',
      parent: '엄마 (일반 사용자)',
      teacher: '어린이집 선생님',
      director: '원장',
      siteName: '사이트 이름',
      siteNamePlaceholder: '사이트 이름을 입력하세요',
      childAge: '자녀 나이',
      age3: '3세',
      age4: '4세',
      age5: '5세',
      age6: '6세',
      childAgeHint: '나이에 맞는 콘텐츠가 자동으로 필터링됩니다',
      mainImage: '메인 이미지',
      mainImagePlaceholder: 'https://example.com/image.jpg',
      mainImageHint: '홈 화면에 표시될 대표 이미지를 설정하세요 (새로고침 후에도 유지됩니다)',
      currentImage: '현재 설정된 이미지:',
      currentImageAlt: '현재 메인 이미지',
      saveSuccess: '✅ 설정이 성공적으로 저장되었습니다!'
    },
    admin: {
      panel: '관리자 패널',
      dashboard: '대시보드',
      words: '단어 관리',
      books: '책 관리',
      badges: '뱃지 관리',
      users: '사용자 관리',
      add: '추가',
      edit: '수정',
      delete: '삭제',
      confirmDelete: '정말로 삭제하시겠습니까?',
      cancel: '취소',
      save: '저장',
      systemAdmin: '시스템 관리자',
      global: '공용',
      personal: '개인',
      noData: '등록된 데이터가 없습니다',
      addFirst: '첫 번째 항목을 추가해보세요'
    },
    likes: {
      title: '좋아요',
      description: '인기 있는 콘텐츠를 확인해보세요',
      loading: '좋아요 데이터를 불러오는 중...',
      error: '데이터를 불러올 수 없습니다',
      retry: '다시 시도',
      noLikes: '아직 좋아요한 콘텐츠가 없습니다',
      addLikes: '좋아요를 눌러주세요',
      myLikes: '내 좋아요',
      ranking: '좋아요 랭킹',
      period: {
        all: '전체',
        monthly: '월간',
        weekly: '주간'
      },
      contentType: {
        words: '단어',
        quiz: '퀴즈', 
        puzzle: '퍼즐',
        books: '책'
      },
      rank: '{rank}위',
      likeCount: '{count}개',
      emptyRanking: '랭킹 데이터가 없습니다'
    }
  },
  en: {
    menu: {
      home: 'Home',
      words: 'Words',
      quiz: 'Quiz',
      puzzle: 'Puzzle',
      storybook: 'Storybook',
      achievements: 'Achievements',
      books: 'Books',
      badges: 'Badges',
      favorites: 'Likes',
      login: 'Login',
      logout: 'Logout',
      mypage: 'My Page',
      settings: 'Settings',
      admin: 'Admin'
    },
    landing: {
      welcome: 'Welcome!',
      description: 'This is an English learning platform for kids.'
    },
    categories: {
      all: 'All',
      animals: 'Animals',
      fruits: 'Fruits',
      vehicles: 'Vehicles',
      objects: 'Objects',
      nature: 'Nature',
      toys: 'Toys',
      clothes: 'Clothes',
      other: 'Other',
      person: 'Person',
      letter: 'Letter'
    },
    page: {
      title: 'Word Learning',
      desc: 'Click the image to hear the {lang} audio.',
      singleDesc: 'Click the image to learn the word with audio.',
      autoAdvance: 'Auto advance (10s)',
      prev: 'Prev',
      next: 'Next',
      shuffle: 'Shuffle',
      emptyTitle: 'No words yet',
      emptyDesc: 'Add new words from the admin page.',
      adminBtn: 'Go to Admin Page',
      contentCount: '{count} contents'
    },
    quiz: {
      title: 'Quiz',
      score: 'Score',
      streak: 'Streak',
      start: 'Start Quiz',
      findAnswer: 'Find the correct answer!',
      startGame: 'Start',
      listen: 'Listen',
      correct: 'Correct!',
      wrong: 'Wrong!',
      badge: 'New badge unlocked!',
      notEnough: 'You need at least 3 words to start the quiz.',
      needThree: 'Please add at least 3 words.',
      goWords: 'Go to add words'
    },
    puzzle: {
      title: 'Puzzle',
      select: 'Select a puzzle',
      start: 'Start',
      chooseLevel: 'Choose difficulty',
      easy: 'Easy',
      normal: 'Normal',
      goHome: 'Home',
      playAgain: 'Play Again',
      piece: 'Puzzle Piece',
      complete: 'Puzzle Complete!',
      noImage: 'No image',
      addWord: 'Please add a word',
      pieceCount: '{count} pieces'
    },
    achievements: {
      title: 'Achievements',
      description: 'Check your learning progress and earned badges so far.',
      loading: 'Loading achievements...',
      errorTitle: 'Unable to load data',
      retry: 'Retry',
      earnedBadges: '🏆 Earned Badges',
      earned: 'Earned!',
      noBadges: 'No badges earned yet',
      startLearning: 'Start learning to earn your first badge!',
      startQuiz: 'Start Quiz',
      startWords: 'Start Words',
      nextGoals: '🎯 Next Goals',
      learningStats: '📊 Learning Stats',
      quizScore: 'Quiz Score',
      quizStreak: 'Streak',
      puzzleCompletions: 'Puzzle Completions',
      wordsLearned: 'Words Learned',
      booksRead: 'Books Read',
      wordsTotal: 'Out of {total}',
      booksTotal: 'Out of {total}',
      nextBadge: 'Next Goal',
      categoryQuiz: 'Quiz',
      categoryPuzzle: 'Puzzle',
      categoryWords: 'Words',
      categoryBooks: 'Books'
    },
    settings: {
      title: 'Settings',
      desc: 'Change your personal settings',
      username: 'Username',
      usernamePlaceholder: 'Enter your username',
      userType: 'User Type',
      parent: 'Parent (General User)',
      teacher: 'Kindergarten Teacher',
      director: 'Director',
      siteName: 'Site Name',
      siteNamePlaceholder: 'Enter site name',
      childAge: 'Child Age',
      age3: 'Age 3',
      age4: 'Age 4',
      age5: 'Age 5',
      age6: 'Age 6',
      childAgeHint: 'Content will be filtered by age',
      mainImage: 'Main Image',
      mainImagePlaceholder: 'https://example.com/image.jpg',
      mainImageHint: 'Set the main image for the home screen (persists after refresh)',
      currentImage: 'Current Image:',
      currentImageAlt: 'Current main image',
      saveSuccess: '✅ Settings saved successfully!'
    },
    admin: {
      panel: 'Admin Panel',
      dashboard: 'Dashboard',
      words: 'Word Management',
      books: 'Book Management',
      badges: 'Badge Management',
      users: 'User Management',
      add: 'Add',
      edit: 'Edit',
      delete: 'Delete',
      confirmDelete: 'Are you sure you want to delete?',
      cancel: 'Cancel',
      save: 'Save',
      systemAdmin: 'System Admin',
      global: 'Global',
      personal: 'Personal',
      noData: 'No data registered',
      addFirst: 'Add the first item'
    },
    likes: {
      title: 'Likes',
      description: 'Check popular content',
      loading: 'Loading likes data...',
      error: 'Unable to load data',
      retry: 'Retry',
      noLikes: 'No liked content yet',
      addLikes: 'Please like some content',
      myLikes: 'My Likes',
      ranking: 'Likes Ranking',
      period: {
        all: 'All Time',
        monthly: 'Monthly',
        weekly: 'Weekly'
      },
      contentType: {
        words: 'Words',
        quiz: 'Quiz',
        puzzle: 'Puzzle',
        books: 'Books'
      },
      rank: 'Rank {rank}',
      likeCount: '{count} likes',
      emptyRanking: 'No ranking data'
    }
  }
};

const i18n = createI18n({
  legacy: false,
  locale: 'ko',
  fallbackLocale: 'en',
  messages
});

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(i18n);

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
        registration.active.addEventListener('statechange', (event) => {
          if (event.target.state === 'activated') {
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
window.addEventListener('appinstalled', (evt) => {
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

// 앱 초기화 및 마운트
initializeApp().then(() => {
  app.mount('#app');
  
  // Service Worker 등록 (앱 마운트 후)
  registerServiceWorker();
  
}).catch((error) => {
  console.error('💥 Failed to initialize application:', error);
  // 초기화 실패해도 앱은 마운트
  app.mount('#app');
  
  // Service Worker는 여전히 등록
  registerServiceWorker();
});

export { i18n };