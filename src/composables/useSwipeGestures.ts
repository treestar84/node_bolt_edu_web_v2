import { ref, computed, onMounted, onUnmounted } from 'vue';

export interface SwipeDirection {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}

export interface SwipeOptions {
  threshold?: number;
  velocity?: number;
  preventDefault?: boolean;
  passive?: boolean;
}

export function useSwipeGestures(
  target: HTMLElement | null = null,
  options: SwipeOptions = {}
) {
  const {
    threshold = 50,
    velocity = 0.3,
    preventDefault = true,
    passive = false
  } = options;

  // 터치 상태
  const isSwiping = ref(false);
  const startX = ref(0);
  const startY = ref(0);
  const currentX = ref(0);
  const currentY = ref(0);
  const startTime = ref(0);

  // 스와이프 방향 계산
  const swipeDirection = computed((): SwipeDirection => {
    const deltaX = currentX.value - startX.value;
    const deltaY = currentY.value - startY.value;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    return {
      left: deltaX < -threshold && absDeltaX > absDeltaY,
      right: deltaX > threshold && absDeltaX > absDeltaY,
      up: deltaY < -threshold && absDeltaY > absDeltaX,
      down: deltaY > threshold && absDeltaY > absDeltaX
    };
  });

  // 스와이프 거리
  const swipeDistance = computed(() => {
    const deltaX = currentX.value - startX.value;
    const deltaY = currentY.value - startY.value;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  });

  // 스와이프 속도
  const swipeVelocity = computed(() => {
    const deltaTime = Date.now() - startTime.value;
    return deltaTime > 0 ? swipeDistance.value / deltaTime : 0;
  });

  // 터치 시작
  const handleTouchStart = (event: TouchEvent) => {
    if (preventDefault && !passive) {
      event.preventDefault();
    }

    const touch = event.touches[0];
    if (!touch) return;

    isSwiping.value = true;
    startX.value = touch.clientX;
    startY.value = touch.clientY;
    currentX.value = touch.clientX;
    currentY.value = touch.clientY;
    startTime.value = Date.now();
  };

  // 터치 이동
  const handleTouchMove = (event: TouchEvent) => {
    if (!isSwiping.value) return;

    const touch = event.touches[0];
    if (!touch) return;

    currentX.value = touch.clientX;
    currentY.value = touch.clientY;

    // 스와이프 중 이벤트 방지
    if (preventDefault && swipeDistance.value > threshold / 2) {
      event.preventDefault();
    }
  };

  // 터치 종료
  const handleTouchEnd = (event: TouchEvent) => {
    if (!isSwiping.value) return;

    const finalVelocity = swipeVelocity.value;
    const finalDistance = swipeDistance.value;
    const direction = swipeDirection.value;

    isSwiping.value = false;

    // 스와이프 조건 확인
    if (finalDistance >= threshold && finalVelocity >= velocity) {
      // 스와이프 이벤트 발생
      emitSwipeEvent(direction, {
        distance: finalDistance,
        velocity: finalVelocity,
        duration: Date.now() - startTime.value
      });
    }

    // 상태 초기화
    resetState();
  };

  // 상태 초기화
  const resetState = () => {
    startX.value = 0;
    startY.value = 0;
    currentX.value = 0;
    currentY.value = 0;
    startTime.value = 0;
  };

  // 스와이프 이벤트 발생
  const emitSwipeEvent = (direction: SwipeDirection, details: any) => {
    const targetElement = target || document;
    
    if (direction.left) {
      targetElement.dispatchEvent(new CustomEvent('swipe-left', { detail: details }));
    }
    if (direction.right) {
      targetElement.dispatchEvent(new CustomEvent('swipe-right', { detail: details }));
    }
    if (direction.up) {
      targetElement.dispatchEvent(new CustomEvent('swipe-up', { detail: details }));
    }
    if (direction.down) {
      targetElement.dispatchEvent(new CustomEvent('swipe-down', { detail: details }));
    }
  };

  // 이벤트 리스너 등록
  onMounted(() => {
    const element = target || document;
    
    element.addEventListener('touchstart', handleTouchStart, { passive });
    element.addEventListener('touchmove', handleTouchMove, { passive });
    element.addEventListener('touchend', handleTouchEnd, { passive });
  });

  // 정리
  onUnmounted(() => {
    const element = target || document;
    
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchmove', handleTouchMove);
    element.removeEventListener('touchend', handleTouchEnd);
  });

  return {
    isSwiping: readonly(isSwiping),
    swipeDirection: readonly(swipeDirection),
    swipeDistance: readonly(swipeDistance),
    swipeVelocity: readonly(swipeVelocity)
  };
}