import { ref, computed, onMounted, readonly } from 'vue';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function usePWA() {
  const isInstallable = ref(false);
  const isInstalled = ref(false);
  const isUpdateAvailable = ref(false);
  const isOnline = ref(navigator.onLine);
  const installPromptEvent = ref<BeforeInstallPromptEvent | null>(null);
  const registration = ref<ServiceWorkerRegistration | null>(null);
  
  // PWA 설치 가능 여부 확인
  const checkInstallability = () => {
    // 이미 설치된 경우
    if (window.matchMedia('(display-mode: standalone)').matches) {
      isInstalled.value = true;
      isInstallable.value = false;
      return;
    }

    // iOS Safari 설치 프롬프트 확인
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    
    if (isIOS && !isInStandaloneMode) {
      isInstallable.value = true;
    }
  };

  // PWA 설치 실행
  const installPWA = async (): Promise<boolean> => {
    if (!installPromptEvent.value) {
      // iOS Safari의 경우 수동 안내
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        showIOSInstallInstructions();
        return false;
      }
      return false;
    }

    try {
      await installPromptEvent.value.prompt();
      const choice = await installPromptEvent.value.userChoice;
      
      if (choice.outcome === 'accepted') {
        console.log('✅ PWA 설치 완료');
        isInstalled.value = true;
        isInstallable.value = false;
        installPromptEvent.value = null;
        
        // 설치 성공 이벤트 발송
        window.dispatchEvent(new CustomEvent('pwa-installed'));
        return true;
      } else {
        console.log('❌ PWA 설치 취소');
        return false;
      }
    } catch (error) {
      console.error('❌ PWA 설치 실패:', error);
      return false;
    }
  };

  // iOS 설치 안내 표시
  const showIOSInstallInstructions = () => {
    const message = `
      이 앱을 홈 화면에 추가하세요:
      1. Safari 하단의 공유 버튼(📤)을 누르세요
      2. "홈 화면에 추가"를 선택하세요
      3. "추가"를 누르세요
    `;
    
    // 커스텀 모달이나 토스트로 표시할 수 있음
    alert(message);
    
    // iOS 설치 가이드 이벤트 발송
    window.dispatchEvent(new CustomEvent('pwa-ios-install-guide'));
  };

  // 앱 업데이트 확인
  const checkForUpdates = async (): Promise<boolean> => {
    if (!registration.value) return false;

    try {
      const newRegistration = await registration.value.update();
      
      if ((newRegistration as any)?.waiting) {
        isUpdateAvailable.value = true;
        console.log('🔄 앱 업데이트 사용 가능');
        
        // 업데이트 알림 이벤트 발송
        window.dispatchEvent(new CustomEvent('pwa-update-available'));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ 업데이트 확인 실패:', error);
      return false;
    }
  };

  // 앱 업데이트 적용
  const applyUpdate = (): void => {
    if (!registration.value?.waiting) return;

    // 새 서비스 워커에게 메시지 전송
    registration.value.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // 페이지 새로고침
    window.location.reload();
  };

  // PWA 기능 감지
  const pwaMethods = computed(() => ({
    canInstall: isInstallable.value,
    canUpdate: isUpdateAvailable.value,
    isStandalone: isInstalled.value,
    isOnline: isOnline.value,
    hasNotificationSupport: 'Notification' in window,
    hasShareSupport: 'share' in navigator,
    hasBadgeSupport: 'setAppBadge' in navigator,
    hasPeriodicBackgroundSync: 'serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype
  }));

  // 알림 권한 요청
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
      console.warn('⚠️ 이 브라우저는 알림을 지원하지 않습니다');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('📱 알림 권한:', permission);
    
    return permission;
  };

  // 로컬 알림 표시
  const showNotification = async (
    title: string, 
    options: NotificationOptions = {}
  ): Promise<boolean> => {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      return false;
    }

    try {
      if (registration.value) {
        // 서비스 워커를 통한 알림 (더 안정적)
        await registration.value.showNotification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png',
          tag: 'learning-app',
          requireInteraction: true,
          ...options
        });
      } else {
        // 일반 알림
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options
        });
      }
      
      return true;
    } catch (error) {
      console.error('❌ 알림 표시 실패:', error);
      return false;
    }
  };

  // 앱 배지 업데이트
  const updateAppBadge = async (count: number = 0): Promise<void> => {
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          await (navigator as any).setAppBadge(count);
        } else {
          await (navigator as any).clearAppBadge();
        }
      } catch (error) {
        console.error('❌ 앱 배지 업데이트 실패:', error);
      }
    }
  };

  // 네이티브 공유 API
  const shareContent = async (shareData: ShareData): Promise<boolean> => {
    if (!('share' in navigator)) {
      console.warn('⚠️ 이 브라우저는 네이티브 공유를 지원하지 않습니다');
      return false;
    }

    try {
      await navigator.share({
        title: '똑똑한 아이들 - 유아 학습 앱',
        url: window.location.href,
        ...shareData
      });
      
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('사용자가 공유를 취소했습니다');
      } else {
        console.error('❌ 공유 실패:', error);
      }
      return false;
    }
  };

  // PWA 분석 데이터 수집
  const trackPWAUsage = () => {
    const trackingData = {
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      installSource: isInstalled.value ? 'installed' : 'browser',
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      timestamp: new Date().toISOString()
    };

    // 분석 서비스로 전송 (예: Google Analytics, 자체 분석 서버)
    console.log('📊 PWA 사용 통계:', trackingData);
    
    // 로컬 스토리지에 저장
    localStorage.setItem('pwa-usage-data', JSON.stringify(trackingData));
  };

  // 오프라인 감지 및 대응
  const setupOfflineHandling = () => {
    const updateOnlineStatus = () => {
      isOnline.value = navigator.onLine;
      
      if (isOnline.value) {
        console.log('🌐 온라인 상태');
        // 온라인 복구 시 동기화 수행
        window.dispatchEvent(new CustomEvent('app-online'));
      } else {
        console.log('📴 오프라인 상태');
        window.dispatchEvent(new CustomEvent('app-offline'));
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  // 초기화
  onMounted(() => {
    // PWA 설치 가능 이벤트 리스너
    window.addEventListener('beforeinstallprompt', (e: Event) => {
      e.preventDefault();
      installPromptEvent.value = e as BeforeInstallPromptEvent;
      isInstallable.value = true;
      console.log('📱 PWA 설치 프롬프트 준비됨');
    });

    // 앱 설치 완료 이벤트
    window.addEventListener('appinstalled', () => {
      isInstalled.value = true;
      isInstallable.value = false;
      installPromptEvent.value = null;
      console.log('✅ PWA가 성공적으로 설치되었습니다');
    });

    // 서비스 워커 등록 확인
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((reg) => {
        registration.value = reg;
        
        // 업데이트 확인
        checkForUpdates();
        
        // 주기적 업데이트 확인 (1시간마다)
        setInterval(checkForUpdates, 60 * 60 * 1000);
      });

      // 서비스 워커 업데이트 감지
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 서비스 워커가 업데이트되었습니다');
        isUpdateAvailable.value = false;
      });
    }

    checkInstallability();
    const cleanupOfflineHandling = setupOfflineHandling();
    trackPWAUsage();

    return cleanupOfflineHandling;
  });

  return {
    // 상태
    isInstallable: readonly(isInstallable),
    isInstalled: readonly(isInstalled),
    isUpdateAvailable: readonly(isUpdateAvailable),
    isOnline: readonly(isOnline),
    pwaMethods,
    
    // 메서드
    installPWA,
    applyUpdate,
    checkForUpdates,
    requestNotificationPermission,
    showNotification,
    updateAppBadge,
    shareContent,
    trackPWAUsage
  };
}