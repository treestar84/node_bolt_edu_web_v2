import { ref } from 'vue';

export interface TouchFeedbackOptions {
  haptic?: boolean;
  visual?: boolean;
  audio?: boolean;
  duration?: number;
  intensity?: 'light' | 'medium' | 'heavy';
}

export function useTouchFeedback() {
  const isVibrationSupported = ref('vibrate' in navigator);
  const audioContext = ref<AudioContext | null>(null);

  // 햅틱 피드백
  const hapticFeedback = (pattern: number | number[] = 50, intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (!isVibrationSupported.value) return;

    try {
      // 강도별 패턴 조정
      let vibrationPattern: number | number[];
      
      switch (intensity) {
        case 'light':
          vibrationPattern = Array.isArray(pattern) ? pattern.map(p => p * 0.5) : pattern * 0.5;
          break;
        case 'heavy':
          vibrationPattern = Array.isArray(pattern) ? pattern.map(p => p * 1.5) : pattern * 1.5;
          break;
        default:
          vibrationPattern = pattern;
      }

      navigator.vibrate(vibrationPattern);
    } catch (error) {
      console.warn('햅틱 피드백 실행 실패:', error);
    }
  };

  // 시각적 피드백 (리플 효과)
  const visualFeedback = (element: HTMLElement, options: { color?: string; duration?: number } = {}) => {
    const { color = 'rgba(0, 0, 0, 0.1)', duration = 300 } = options;
    
    // 기존 리플 효과 제거
    const existingRipples = element.querySelectorAll('.touch-ripple');
    existingRipples.forEach(ripple => ripple.remove());

    // 새 리플 효과 생성
    const ripple = document.createElement('div');
    ripple.classList.add('touch-ripple');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: ${color};
      transform: scale(0);
      animation: touch-ripple-animation ${duration}ms linear;
      pointer-events: none;
      z-index: 1000;
    `;

    // 터치 위치 계산
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = rect.width / 2 - size / 2;
    const y = rect.height / 2 - size / 2;

    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;

    // CSS 애니메이션 추가 (한 번만)
    if (!document.querySelector('#touch-ripple-styles')) {
      const style = document.createElement('style');
      style.id = 'touch-ripple-styles';
      style.textContent = `
        @keyframes touch-ripple-animation {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // 엘리먼트에 상대 위치 설정
    const originalPosition = element.style.position;
    if (!originalPosition || originalPosition === 'static') {
      element.style.position = 'relative';
    }

    element.appendChild(ripple);

    // 애니메이션 후 제거
    setTimeout(() => {
      ripple.remove();
    }, duration);
  };

  // 오디오 피드백
  const audioFeedback = async (frequency = 800, duration = 100, volume = 0.1) => {
    try {
      if (!audioContext.value) {
        audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContext.value;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

      oscillator.start();
      oscillator.stop(ctx.currentTime + duration / 1000);
    } catch (error) {
      console.warn('오디오 피드백 실행 실패:', error);
    }
  };

  // 통합 터치 피드백
  const provideFeedback = (
    element?: HTMLElement,
    options: TouchFeedbackOptions = {}
  ) => {
    const {
      haptic = true,
      visual = true,
      audio = false,
      duration = 100,
      intensity = 'medium'
    } = options;

    // 햅틱 피드백
    if (haptic) {
      hapticFeedback(duration, intensity);
    }

    // 시각적 피드백
    if (visual && element) {
      visualFeedback(element, { duration: duration * 3 });
    }

    // 오디오 피드백
    if (audio) {
      audioFeedback(800, duration, 0.05);
    }
  };

  // 미리 정의된 피드백 패턴
  const feedbackPatterns = {
    tap: () => provideFeedback(undefined, { haptic: true, intensity: 'light', duration: 50 }),
    success: () => {
      hapticFeedback([100, 50, 100], 'medium');
      audioFeedback(600, 200, 0.1);
    },
    error: () => {
      hapticFeedback([200, 100, 200, 100, 200], 'heavy');
      audioFeedback(300, 300, 0.15);
    },
    select: () => provideFeedback(undefined, { haptic: true, intensity: 'light', duration: 30 }),
    swipe: () => provideFeedback(undefined, { haptic: true, intensity: 'medium', duration: 80 })
  };

  return {
    isVibrationSupported: readonly(isVibrationSupported),
    hapticFeedback,
    visualFeedback,
    audioFeedback,
    provideFeedback,
    feedbackPatterns
  };
}