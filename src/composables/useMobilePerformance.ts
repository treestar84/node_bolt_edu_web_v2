import { ref, computed, onMounted, onUnmounted, readonly } from 'vue';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  networkSpeed: string;
  batteryLevel?: number;
  loadTime: number;
  renderTime: number;
  interactionLatency: number;
}

export function useMobilePerformance() {
  const metrics = ref<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    networkSpeed: '4g',
    batteryLevel: undefined,
    loadTime: 0,
    renderTime: 0,
    interactionLatency: 0
  });

  const performanceLevel = ref<'high' | 'medium' | 'low'>('medium');
  const shouldOptimize = ref(false);
  const isLowEndDevice = ref(false);

  let rafId = 0;
  let frameCount = 0;
  
  let fpsCalcStart = performance.now();

  // FPS 측정
  const measureFPS = () => {
    const now = performance.now();
    frameCount++;
    
    if (now - fpsCalcStart >= 1000) {
      metrics.value.fps = Math.round((frameCount * 1000) / (now - fpsCalcStart));
      frameCount = 0;
      fpsCalcStart = now;
      
      // 성능 레벨 업데이트
      updatePerformanceLevel();
    }
    
    rafId = requestAnimationFrame(measureFPS);
  };

  // 메모리 사용량 측정
  const measureMemoryUsage = () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      metrics.value.memoryUsage = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
  };

  // 네트워크 속도 감지
  const detectNetworkSpeed = () => {
    const connection = (navigator as any).connection 
      || (navigator as any).mozConnection 
      || (navigator as any).webkitConnection;
    
    if (connection) {
      metrics.value.networkSpeed = connection.effectiveType || 'unknown';
    }
  };

  // 배터리 레벨 감지
  const detectBatteryLevel = async () => {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        metrics.value.batteryLevel = Math.round(battery.level * 100);
      } catch (error) {
        console.warn('Battery API not available');
      }
    }
  };

  // 페이지 로드 시간 측정
  const measureLoadTime = () => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      metrics.value.loadTime = navigation.loadEventEnd - navigation.fetchStart;
      metrics.value.renderTime = navigation.loadEventEnd - navigation.responseEnd;
    }
  };

  // 인터랙션 지연 시간 측정
  const measureInteractionLatency = () => {
    let interactionStart = 0;
    
    const startMeasuring = () => {
      interactionStart = performance.now();
    };
    
    const endMeasuring = () => {
      if (interactionStart) {
        metrics.value.interactionLatency = performance.now() - interactionStart;
        interactionStart = 0;
      }
    };
    
    // 터치 이벤트에 리스너 추가
    document.addEventListener('touchstart', startMeasuring, { passive: true });
    document.addEventListener('touchend', endMeasuring, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', startMeasuring);
      document.removeEventListener('touchend', endMeasuring);
    };
  };

  // 기기 성능 분석
  const analyzeDevicePerformance = () => {
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const deviceMemory = (navigator as any).deviceMemory || 4;
    
    // 저성능 기기 감지
    isLowEndDevice.value = (
      hardwareConcurrency < 4 ||
      deviceMemory < 4 ||
      metrics.value.fps < 30 ||
      metrics.value.memoryUsage > 100
    );
    
    // 최적화 필요 여부 결정
    shouldOptimize.value = Boolean(
      isLowEndDevice.value ||
      metrics.value.networkSpeed === '2g' ||
      metrics.value.networkSpeed === 'slow-2g' ||
      (metrics.value.batteryLevel && metrics.value.batteryLevel < 20)
    );
  };

  // 성능 레벨 업데이트
  const updatePerformanceLevel = () => {
    const fps = metrics.value.fps;
    const memory = metrics.value.memoryUsage;
    
    if (fps >= 55 && memory < 50) {
      performanceLevel.value = 'high';
    } else if (fps >= 30 && memory < 100) {
      performanceLevel.value = 'medium';
    } else {
      performanceLevel.value = 'low';
    }
    
    analyzeDevicePerformance();
  };

  // 성능 기반 설정 제안
  const getOptimalSettings = computed(() => {
    const level = performanceLevel.value;
    const isLowEnd = isLowEndDevice.value;
    
    return {
      imageQuality: level === 'high' ? 85 : level === 'medium' ? 75 : 60,
      enableAnimations: level !== 'low',
      enableParticleEffects: level === 'high',
      preloadImages: level === 'high' ? 5 : level === 'medium' ? 3 : 1,
      maxCacheSize: level === 'high' ? 100 : level === 'medium' ? 50 : 25,
      enableLazyLoading: true,
      enableImageOptimization: isLowEnd,
      reduceMotion: isLowEnd,
      enableOfflineMode: metrics.value.networkSpeed === '2g' || metrics.value.networkSpeed === 'slow-2g'
    };
  });

  // Core Web Vitals 측정
  const measureCoreWebVitals = () => {
    // LCP (Largest Contentful Paint)
    const observeLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', Math.round(lastEntry.startTime));
        });
        
        try {
          observer.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (error) {
          console.warn('LCP measurement not supported');
        }
      }
    };

    // FID (First Input Delay)
    const observeFID = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry) => {
            console.log('FID:', Math.round((entry as any).processingStart - entry.startTime));
          });
        });
        
        try {
          observer.observe({ entryTypes: ['first-input'] });
        } catch (error) {
          console.warn('FID measurement not supported');
        }
      }
    };

    // CLS (Cumulative Layout Shift)
    const observeCLS = () => {
      if ('PerformanceObserver' in window) {
        let clsScore = 0;
        
        const observer = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsScore += entry.value;
            }
          });
          console.log('CLS:', clsScore);
        });
        
        try {
          observer.observe({ entryTypes: ['layout-shift'] });
        } catch (error) {
          console.warn('CLS measurement not supported');
        }
      }
    };

    observeLCP();
    observeFID();
    observeCLS();
  };

  // 성능 경고 시스템
  const performanceWarnings = computed(() => {
    const warnings: string[] = [];
    
    if (metrics.value.fps < 30) {
      warnings.push('낮은 프레임율이 감지되었습니다. 애니메이션을 줄이는 것을 권장합니다.');
    }
    
    if (metrics.value.memoryUsage > 100) {
      warnings.push('높은 메모리 사용량이 감지되었습니다. 캐시를 정리해보세요.');
    }
    
    if (metrics.value.interactionLatency > 100) {
      warnings.push('느린 터치 응답이 감지되었습니다. 성능 최적화가 필요할 수 있습니다.');
    }
    
    if (metrics.value.networkSpeed === '2g' || metrics.value.networkSpeed === 'slow-2g') {
      warnings.push('느린 네트워크가 감지되었습니다. 오프라인 모드를 활성화하는 것을 권장합니다.');
    }
    
    return warnings;
  });

  // 모니터링 시작
  const startMonitoring = () => {
    measureLoadTime();
    detectNetworkSpeed();
    detectBatteryLevel();
    measureCoreWebVitals();
    
    const cleanupInteractionMeasuring = measureInteractionLatency();
    
    // 정기적인 업데이트
    const metricsInterval = setInterval(() => {
      measureMemoryUsage();
      detectNetworkSpeed();
      analyzeDevicePerformance();
    }, 5000);

    rafId = requestAnimationFrame(measureFPS);

    return () => {
      clearInterval(metricsInterval);
      cancelAnimationFrame(rafId);
      cleanupInteractionMeasuring();
    };
  };

  // 마운트 시 모니터링 시작
  onMounted(() => {
    const cleanup = startMonitoring();
    
    onUnmounted(() => {
      cleanup();
    });
  });

  return {
    metrics: readonly(metrics),
    performanceLevel: readonly(performanceLevel),
    shouldOptimize: readonly(shouldOptimize),
    isLowEndDevice: readonly(isLowEndDevice),
    getOptimalSettings,
    performanceWarnings,
    startMonitoring
  };
}