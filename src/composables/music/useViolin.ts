import { ref } from 'vue';
import { useAudioCore } from './useAudioCore';

export function useViolin() {
  const { initializeAudio, volume } = useAudioCore();
  
  // 연주 기록
  const playHistory = ref<Array<{ note: string; timestamp: number }>>([]);

  /**
   * 바이올린 음 재생 (현실적인 바이올린 사운드)
   */
  const playViolinNote = async (noteName: string, duration: number = 1.0) => {
    // 실제 음계 주파수 (한국 동요에 맞는 음정)
    const noteFrequencies: { [key: string]: number } = {
      // 낮은 옥타브
      'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
      // 중간 옥타브 (주로 사용되는 음역)
      'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
      // 높은 옥타브
      'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'F5': 698.46, 'G5': 783.99, 'A5': 880.00, 'B5': 987.77,
      // 바이올린 개방현 (기본 현)
      'G': 196.00,  // G3 - 가장 굵고 낮은 현
      'D': 293.66,  // D4 - 중간 낮은 현  
      'A': 440.00,  // A4 - 중간 높은 현
      'E': 659.25   // E5 - 가장 가늘고 높은 현
    };

    const frequency = noteFrequencies[noteName];
    if (!frequency) {
      console.warn(`Unknown note: ${noteName}`);
      return;
    }

    const ctx = await initializeAudio();
    if (!ctx) return;

    // 바이올린의 복잡한 음향 구조 시뮬레이션
    const fundamental = ctx.createOscillator();
    const harmonic2 = ctx.createOscillator();
    const harmonic3 = ctx.createOscillator();
    const harmonic4 = ctx.createOscillator();
    
    const mainGain = ctx.createGain();
    const harmonic2Gain = ctx.createGain();
    const harmonic3Gain = ctx.createGain();
    const harmonic4Gain = ctx.createGain();
    
    // 바이올린 특유의 필터 (공명효과)
    const resonanceFilter = ctx.createBiquadFilter();
    const brightnessFilter = ctx.createBiquadFilter();
    
    // 연결 구조
    fundamental.connect(mainGain);
    harmonic2.connect(harmonic2Gain);
    harmonic3.connect(harmonic3Gain);
    harmonic4.connect(harmonic4Gain);
    
    mainGain.connect(resonanceFilter);
    harmonic2Gain.connect(resonanceFilter);
    harmonic3Gain.connect(resonanceFilter);
    harmonic4Gain.connect(resonanceFilter);
    
    resonanceFilter.connect(brightnessFilter);
    brightnessFilter.connect(ctx.destination);

    // 오실레이터 설정 (바이올린의 복합 톤)
    fundamental.frequency.setValueAtTime(frequency, ctx.currentTime);
    fundamental.type = 'sawtooth'; // 바이올린의 기본 파형
    
    harmonic2.frequency.setValueAtTime(frequency * 2, ctx.currentTime);
    harmonic2.type = 'triangle';
    
    harmonic3.frequency.setValueAtTime(frequency * 3, ctx.currentTime);
    harmonic3.type = 'sine';
    
    harmonic4.frequency.setValueAtTime(frequency * 4, ctx.currentTime);
    harmonic4.type = 'sine';

    // 필터 설정 (바이올린 바디의 공명)
    resonanceFilter.type = 'bandpass';
    resonanceFilter.frequency.setValueAtTime(frequency * 2.5, ctx.currentTime);
    resonanceFilter.Q.setValueAtTime(8, ctx.currentTime);
    
    brightnessFilter.type = 'highpass';
    brightnessFilter.frequency.setValueAtTime(200, ctx.currentTime);

    // 활로 긋는 듯한 볼륨 엔벨로프 (어택, 서스테인, 릴리즈)
    const baseVolume = volume.value * 0.3;
    
    // 메인 톤
    mainGain.gain.setValueAtTime(0, ctx.currentTime);
    mainGain.gain.linearRampToValueAtTime(baseVolume * 0.8, ctx.currentTime + 0.08); // 빠른 어택
    mainGain.gain.linearRampToValueAtTime(baseVolume * 0.6, ctx.currentTime + 0.15); // 약간 감소
    mainGain.gain.linearRampToValueAtTime(baseVolume * 0.7, ctx.currentTime + duration * 0.7); // 서스테인
    mainGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration); // 부드러운 릴리즈

    // 2차 하모닉 (풍부한 음색)
    harmonic2Gain.gain.setValueAtTime(0, ctx.currentTime);
    harmonic2Gain.gain.linearRampToValueAtTime(baseVolume * 0.25, ctx.currentTime + 0.1);
    harmonic2Gain.gain.linearRampToValueAtTime(baseVolume * 0.2, ctx.currentTime + duration * 0.8);
    harmonic2Gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    // 3차 하모닉 (밝기 추가)
    harmonic3Gain.gain.setValueAtTime(0, ctx.currentTime);
    harmonic3Gain.gain.linearRampToValueAtTime(baseVolume * 0.12, ctx.currentTime + 0.12);
    harmonic3Gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 0.9);

    // 4차 하모닉 (고음의 반짝임)
    harmonic4Gain.gain.setValueAtTime(0, ctx.currentTime);
    harmonic4Gain.gain.linearRampToValueAtTime(baseVolume * 0.06, ctx.currentTime + 0.15);
    harmonic4Gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration * 0.7);

    // 미세한 비브라토 효과 (살짝 떨리는 느낌)
    const vibratoLFO = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    
    vibratoLFO.connect(vibratoGain);
    vibratoGain.connect(fundamental.frequency);
    
    vibratoLFO.frequency.setValueAtTime(4.5, ctx.currentTime); // 4.5Hz 비브라토
    vibratoLFO.type = 'sine';
    vibratoGain.gain.setValueAtTime(frequency * 0.008, ctx.currentTime); // 매우 미세한 떨림

    // 모든 오실레이터 시작
    fundamental.start();
    harmonic2.start();
    harmonic3.start();
    harmonic4.start();
    vibratoLFO.start();

    // 정지 (각각 다른 시점에 자연스럽게)
    fundamental.stop(ctx.currentTime + duration);
    harmonic2.stop(ctx.currentTime + duration);
    harmonic3.stop(ctx.currentTime + duration * 0.9);
    harmonic4.stop(ctx.currentTime + duration * 0.7);
    vibratoLFO.stop(ctx.currentTime + duration);

    playHistory.value.push({ note: `violin_${noteName}`, timestamp: Date.now() });
    console.log('🎻 Playing violin note:', noteName, `(${frequency.toFixed(2)}Hz)`);
  };

  return {
    playHistory,
    playViolinNote
  };
}