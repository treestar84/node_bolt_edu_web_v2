import { ref } from 'vue';

export function useAudioCore() {
  // 오디오 관련
  const audioContext = ref<AudioContext | null>(null);
  const isPlaying = ref(false);
  const volume = ref(0.7);

  /**
   * Web Audio API 초기화
   */
  const initializeAudio = async () => {
    if (!audioContext.value) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        audioContext.value = new AudioContext();
        console.log('🎵 Audio Context initialized');
      } else {
        console.error('❌ Web Audio API not supported');
        return null;
      }
    }
    
    // AudioContext가 suspended 상태이면 resume 시도
    if (audioContext.value && audioContext.value.state === 'suspended') {
      try {
        await audioContext.value.resume();
        console.log('🎵 Audio Context resumed');
      } catch (error) {
        console.error('❌ Failed to resume audio context:', error);
      }
    }
    
    return audioContext.value;
  };

  /**
   * 기본 오실레이터 생성 (공통 함수)
   */
  const createOscillator = async (frequency: number, type: OscillatorType = 'sine', duration: number = 0.5) => {
    const ctx = await initializeAudio();
    if (!ctx) return null;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume.value * 0.3, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    return { oscillator, gainNode };
  };

  /**
   * 사용자 인터랙션 후 오디오 활성화
   */
  const ensureAudioActive = async () => {
    const ctx = await initializeAudio();
    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
        console.log('🎵 Audio activated by user interaction');
      } catch (error) {
        console.error('❌ Failed to activate audio:', error);
      }
    }
  };

  /**
   * 볼륨 조절
   */
  const setVolume = (newVolume: number) => {
    volume.value = Math.max(0, Math.min(1, newVolume));
    console.log('🔊 Volume set to:', volume.value);
  };

  return {
    audioContext,
    isPlaying,
    volume,
    initializeAudio,
    createOscillator,
    ensureAudioActive,
    setVolume
  };
}