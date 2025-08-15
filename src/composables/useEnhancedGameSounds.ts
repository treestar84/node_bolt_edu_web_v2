/**
 * 향상된 게임 효과음 시스템
 * 실제 오디오 파일과 Web Audio API를 조합하여 고품질 사운드 제공
 */

import { ref, computed, readonly } from 'vue';

interface SoundConfig {
  volume: number;
  playbackRate?: number;
  loop?: boolean;
}

interface SoundBank {
  success: string[];
  failure: string[];
  coloring: string[];
  completion: string[];
  ui: string[];
}

export function useEnhancedGameSounds() {
  
  // 사운드 뱅크 정의 (실제 파일이 없을 때 폴백용)
  const soundBank: SoundBank = {
    success: [
      '/sounds/success/chime.mp3',
      '/sounds/success/applause.mp3', 
      '/sounds/success/hooray.mp3'
    ],
    failure: [
      '/sounds/failure/oops.mp3',
      '/sounds/failure/try-again.mp3',
      '/sounds/failure/gentle-buzz.mp3'
    ],
    coloring: [
      '/sounds/coloring/brush-tap.mp3',
      '/sounds/coloring/paint-splash.mp3',
      '/sounds/coloring/water-drop.mp3'
    ],
    completion: [
      '/sounds/completion/fanfare.mp3',
      '/sounds/completion/celebration.mp3',
      '/sounds/completion/tada.mp3'
    ],
    ui: [
      '/sounds/ui/click.mp3',
      '/sounds/ui/hover.mp3',
      '/sounds/ui/swipe.mp3'
    ]
  };

  // 오디오 캐시
  const audioCache = new Map<string, HTMLAudioElement>();
  const audioContext = ref<AudioContext | null>(null);

  /**
   * 오디오 파일을 미리 로드
   */
  const preloadSounds = async () => {
    const allSounds = Object.values(soundBank).flat();
    
    const loadPromises = allSounds.map(soundPath => 
      new Promise<void>((resolve) => {
        const audio = new Audio();
        audio.preload = 'auto';
        audio.addEventListener('canplaythrough', () => resolve());
        audio.addEventListener('error', () => resolve()); // 에러시에도 계속 진행
        audio.src = soundPath;
        audioCache.set(soundPath, audio);
      })
    );

    try {
      await Promise.all(loadPromises);
      console.log('🎵 사운드 파일 로딩 완료');
    } catch (error) {
      console.warn('⚠️ 일부 사운드 파일 로딩 실패:', error);
    }
  };

  /**
   * 향상된 사운드 재생 함수
   */
  const playSound = async (soundPath: string, config: SoundConfig = { volume: 0.7 }) => {
    try {
      // 캐시된 오디오 사용 또는 새로 생성
      let audio = audioCache.get(soundPath);
      
      if (!audio) {
        audio = new Audio(soundPath);
        audioCache.set(soundPath, audio);
      }

      // 오디오 설정
      audio.volume = Math.min(Math.max(config.volume, 0), 1);
      audio.playbackRate = config.playbackRate || 1.0;
      audio.loop = config.loop || false;

      // 이전 재생 정지 후 처음부터 재생
      audio.currentTime = 0;
      
      return await audio.play();
    } catch (error) {
      console.warn('🔇 사운드 재생 실패, 폴백 사용:', soundPath, error);
      // 폴백으로 Web Audio API 사용
      playFallbackSound(soundPath);
    }
  };

  /**
   * 랜덤 사운드 재생
   */
  const playRandomSound = (soundArray: string[], config?: SoundConfig) => {
    const randomSound = soundArray[Math.floor(Math.random() * soundArray.length)];
    return playSound(randomSound, config);
  };

  /**
   * 성공 효과음 재생 (향상됨)
   */
  const playSuccessSound = () => {
    playRandomSound(soundBank.success, { 
      volume: 0.8,
      playbackRate: 1.0 + (Math.random() - 0.5) * 0.2 // 미세한 피치 변화
    });
  };

  /**
   * 실패 효과음 재생 (더 부드러움)
   */
  const playFailureSound = () => {
    playRandomSound(soundBank.failure, { 
      volume: 0.6,
      playbackRate: 0.9 + Math.random() * 0.2
    });
  };

  /**
   * 색칠 효과음 재생 (자연스러움)
   */
  const playColoringSound = () => {
    playRandomSound(soundBank.coloring, { 
      volume: 0.4,
      playbackRate: 0.8 + Math.random() * 0.4
    });
  };

  /**
   * 완성 축하 효과음 재생 (웅장함)
   */
  const playCompletionSound = () => {
    playRandomSound(soundBank.completion, { 
      volume: 0.9,
      playbackRate: 1.0
    });
  };

  /**
   * 색칠 완성 특별 효과음
   */
  const playColoringCompletionSound = () => {
    // 팡파르 후 박수 소리 시퀀스
    playSound('/sounds/completion/fanfare.mp3', { volume: 0.9 });
    setTimeout(() => {
      playSound('/sounds/success/applause.mp3', { volume: 0.7 });
    }, 1500);
  };

  /**
   * UI 인터랙션 사운드
   */
  const playClickSound = () => playSound('/sounds/ui/click.mp3', { volume: 0.3 });
  const playHoverSound = () => playSound('/sounds/ui/hover.mp3', { volume: 0.2 });
  const playSwipeSound = () => playSound('/sounds/ui/swipe.mp3', { volume: 0.4 });

  /**
   * 폴백 사운드 시스템 (Web Audio API - 기존 코드 간소화)
   */
  const playFallbackSound = (soundPath: string) => {
    if (!audioContext.value) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContext.value;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // 사운드 타입에 따른 폴백 사운드
    if (soundPath.includes('success')) {
      // 성공음: 밝은 화음
      oscillator.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      oscillator.type = 'triangle';
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.5);
    } else if (soundPath.includes('failure')) {
      // 실패음: 부드러운 하강음
      oscillator.frequency.setValueAtTime(300, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.3);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.3);
    } else if (soundPath.includes('coloring')) {
      // 색칠음: 부드러운 톤
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      oscillator.start();
      oscillator.stop(ctx.currentTime + 0.1);
    }
  };

  /**
   * 사운드 매니저 초기화
   */
  const initializeSounds = async () => {
    console.log('🎵 향상된 사운드 시스템 초기화 중...');
    await preloadSounds();
    
    // 오디오 컨텍스트 초기화
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      audioContext.value = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    console.log('✅ 사운드 시스템 초기화 완료');
  };

  /**
   * 볼륨 조절 (전역)
   */
  const setMasterVolume = (volume: number) => {
    audioCache.forEach(audio => {
      audio.volume = Math.min(Math.max(volume, 0), 1);
    });
  };

  /**
   * 모든 사운드 정지
   */
  const stopAllSounds = () => {
    audioCache.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  return {
    // 초기화
    initializeSounds,
    
    // 게임 사운드
    playSuccessSound,
    playFailureSound,
    playColoringSound,
    playCompletionSound,
    playColoringCompletionSound,
    
    // UI 사운드
    playClickSound,
    playHoverSound,
    playSwipeSound,
    
    // 유틸리티
    playSound,
    playRandomSound,
    setMasterVolume,
    stopAllSounds,
    
    // 상태
    audioCache: readonly(audioCache),
    isReady: computed(() => audioCache.size > 0)
  };
}