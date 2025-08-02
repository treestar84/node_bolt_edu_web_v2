import { ref, computed } from 'vue';

export interface InstrumentItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type MusicGameState = 'selection' | 'piano' | 'car-sounds' | 'violin';
export type PlayMode = 'free' | 'guide';

export function useMusic() {
  // 게임 상태
  const gameState = ref<MusicGameState>('selection');
  const selectedInstrument = ref<InstrumentItem | null>(null);
  const playMode = ref<PlayMode>('free');
  
  // 오디오 관련
  const audioContext = ref<AudioContext | null>(null);
  const isPlaying = ref(false);
  const volume = ref(0.7);
  
  // 연주 기록
  const playingNotes = ref<Set<string>>(new Set());
  const playHistory = ref<Array<{ note: string; timestamp: number }>>([]);

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
   * 악기 선택
   */
  const selectInstrument = async (instrument: InstrumentItem) => {
    selectedInstrument.value = instrument;
    gameState.value = instrument.id as MusicGameState;
    
    // 오디오 컨텍스트 초기화
    await initializeAudio();
    
    console.log('🎵 Selected instrument:', instrument.name);
  };

  /**
   * 뒤로 가기 (악기 선택 화면으로)
   */
  const goBack = () => {
    gameState.value = 'selection';
    selectedInstrument.value = null;
    stopAllSounds();
  };

  /**
   * 연주 모드 설정
   */
  const setMode = (mode: PlayMode) => {
    playMode.value = mode;
    console.log('🎵 Play mode changed to:', mode);
  };

  /**
   * 모든 소리 정지
   */
  const stopAllSounds = () => {
    playingNotes.value.clear();
    isPlaying.value = false;
    console.log('🔇 All sounds stopped');
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
   * 피아노 음 재생
   */
  const playPianoNote = async (noteWithOctave: string, octave?: number) => {
    const noteFrequencies: { [key: string]: number } = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };

    // 'C3', 'D#4' 같은 형태에서 음표와 옥타브 분리
    let noteName: string;
    let noteOctave: number;
    
    if (octave !== undefined) {
      // 별도로 옥타브가 제공된 경우
      noteName = noteWithOctave;
      noteOctave = octave;
    } else {
      // 'C3', 'D#4' 형태에서 파싱
      const match = noteWithOctave.match(/^([A-G]#?)(\d+)$/);
      if (!match) {
        console.error('❌ Invalid note format:', noteWithOctave);
        return;
      }
      noteName = match[1];
      noteOctave = parseInt(match[2]);
    }

    const baseFreq = noteFrequencies[noteName];
    if (!baseFreq) {
      console.error('❌ Unknown note:', noteName);
      return;
    }

    // 옥타브 조정
    const frequency = baseFreq * Math.pow(2, noteOctave - 4);
    const noteKey = `${noteName}${noteOctave}`;

    // 이미 재생 중인 음이면 중복 방지
    if (playingNotes.value.has(noteKey)) return;

    try {
      // 사용자 인터랙션으로 오디오 활성화
      await ensureAudioActive();
      
      const result = await createOscillator(frequency, 'triangle', 1.0);
      if (!result) return;

      const { oscillator, gainNode } = result;
      
      playingNotes.value.add(noteKey);
      playHistory.value.push({ note: noteKey, timestamp: Date.now() });

      oscillator.start();
      oscillator.stop(audioContext.value!.currentTime + 1.0);

      // 정리
      oscillator.addEventListener('ended', () => {
        playingNotes.value.delete(noteKey);
      });

      console.log('🎹 Playing piano note:', noteKey);
    } catch (error) {
      console.error('❌ Failed to play piano note:', error);
    }
  };

  /**
   * 바이올린 음 재생 (현실적인 바이올린 사운드)
   */
  const playViolinNote = async (stringName: string, duration: number = 1.0) => {
    const stringFrequencies: { [key: string]: number } = {
      'G': 196.00,  // G3 - 가장 굵고 낮은 현
      'D': 293.66,  // D4 - 중간 낮은 현  
      'A': 440.00,  // A4 - 중간 높은 현
      'E': 659.25   // E5 - 가장 가늘고 높은 현
    };

    const frequency = stringFrequencies[stringName];
    if (!frequency) return;

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

    playHistory.value.push({ note: `violin_${stringName}`, timestamp: Date.now() });
    console.log('🎻 Playing violin string:', `${stringName}현 (${stringName === 'G' ? '솔' : stringName === 'D' ? '레' : stringName === 'A' ? '라' : '미'})`);
  };

  /**
   * 볼륨 조절
   */
  const setVolume = (newVolume: number) => {
    volume.value = Math.max(0, Math.min(1, newVolume));
    console.log('🔊 Volume set to:', volume.value);
  };

  /**
   * 연주 통계
   */
  const getPlayStats = computed(() => {
    const recentHistory = playHistory.value.slice(-50); // 최근 50개
    const uniqueNotes = new Set(recentHistory.map(h => h.note)).size;
    const playDuration = recentHistory.length > 0 
      ? (recentHistory[recentHistory.length - 1].timestamp - recentHistory[0].timestamp) / 1000
      : 0;

    return {
      totalNotes: recentHistory.length,
      uniqueNotes,
      playDuration: Math.round(playDuration),
      currentlyPlaying: playingNotes.value.size
    };
  });

  /**
   * 드럼 소리 재생 (확장된 드럼세트)
   */
  const playDrumSound = async (drumType: 'kick' | 'snare' | 'hihat' | 'cymbal' | 'tom1' | 'tom2' | 'floor-tom' | 'ride') => {
    try {
      // 사용자 인터랙션으로 오디오 활성화
      await ensureAudioActive();
      
      const ctx = await initializeAudio();
      if (!ctx) return;

    switch (drumType) {
      case 'kick':
        // 킥드럼 (저음 둥둥)
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.connect(kickGain);
        kickGain.connect(ctx.destination);
        
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(60, ctx.currentTime);
        kickOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
        
        kickGain.gain.setValueAtTime(volume.value * 0.8, ctx.currentTime);
        kickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        
        kickOsc.start();
        kickOsc.stop(ctx.currentTime + 0.3);
        break;

      case 'snare':
        // 스네어 드럼 (따다닥)
        const snareOsc = ctx.createOscillator();
        const snareNoise = ctx.createBufferSource();
        const snareGain = ctx.createGain();
        const noiseGain = ctx.createGain();
        
        // 톤 부분
        snareOsc.connect(snareGain);
        snareGain.connect(ctx.destination);
        snareOsc.type = 'triangle';
        snareOsc.frequency.setValueAtTime(200, ctx.currentTime);
        
        snareGain.gain.setValueAtTime(volume.value * 0.3, ctx.currentTime);
        snareGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        
        // 노이즈 부분 (화이트 노이즈 시뮬레이션)
        const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const noiseData = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseData.length; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }
        
        snareNoise.buffer = noiseBuffer;
        snareNoise.connect(noiseGain);
        noiseGain.connect(ctx.destination);
        
        noiseGain.gain.setValueAtTime(volume.value * 0.5, ctx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        snareOsc.start();
        snareNoise.start();
        snareOsc.stop(ctx.currentTime + 0.2);
        snareNoise.stop(ctx.currentTime + 0.1);
        break;

      case 'hihat':
        // 하이햇 (칭칭)
        const hihatBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
        const hihatData = hihatBuffer.getChannelData(0);
        for (let i = 0; i < hihatData.length; i++) {
          hihatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
        }
        
        const hihatSource = ctx.createBufferSource();
        const hihatGain = ctx.createGain();
        const hihatFilter = ctx.createBiquadFilter();
        
        hihatSource.buffer = hihatBuffer;
        hihatSource.connect(hihatFilter);
        hihatFilter.connect(hihatGain);
        hihatGain.connect(ctx.destination);
        
        hihatFilter.type = 'highpass';
        hihatFilter.frequency.setValueAtTime(8000, ctx.currentTime);
        
        hihatGain.gain.setValueAtTime(volume.value * 0.4, ctx.currentTime);
        hihatGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        
        hihatSource.start();
        hihatSource.stop(ctx.currentTime + 0.1);
        break;

      case 'cymbal':
        // 심벌 (챙~)
        const cymbalBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
        const cymbalData = cymbalBuffer.getChannelData(0);
        for (let i = 0; i < cymbalData.length; i++) {
          cymbalData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
        }
        
        const cymbalSource = ctx.createBufferSource();
        const cymbalGain = ctx.createGain();
        const cymbalFilter = ctx.createBiquadFilter();
        
        cymbalSource.buffer = cymbalBuffer;
        cymbalSource.connect(cymbalFilter);
        cymbalFilter.connect(cymbalGain);
        cymbalGain.connect(ctx.destination);
        
        cymbalFilter.type = 'highpass';
        cymbalFilter.frequency.setValueAtTime(3000, ctx.currentTime);
        
        cymbalGain.gain.setValueAtTime(volume.value * 0.6, ctx.currentTime);
        cymbalGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
        
        cymbalSource.start();
        cymbalSource.stop(ctx.currentTime + 1.5);
        break;

      case 'tom1':
        // 하이톰 (높은 톰)
        const tom1Osc = ctx.createOscillator();
        const tom1Gain = ctx.createGain();
        tom1Osc.connect(tom1Gain);
        tom1Gain.connect(ctx.destination);
        
        tom1Osc.type = 'sine';
        tom1Osc.frequency.setValueAtTime(200, ctx.currentTime);
        tom1Osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
        
        tom1Gain.gain.setValueAtTime(volume.value * 0.6, ctx.currentTime);
        tom1Gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        
        tom1Osc.start();
        tom1Osc.stop(ctx.currentTime + 0.4);
        break;

      case 'tom2':
        // 미드톰 (중간 톰)
        const tom2Osc = ctx.createOscillator();
        const tom2Gain = ctx.createGain();
        tom2Osc.connect(tom2Gain);
        tom2Gain.connect(ctx.destination);
        
        tom2Osc.type = 'sine';
        tom2Osc.frequency.setValueAtTime(150, ctx.currentTime);
        tom2Osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.4);
        
        tom2Gain.gain.setValueAtTime(volume.value * 0.7, ctx.currentTime);
        tom2Gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        tom2Osc.start();
        tom2Osc.stop(ctx.currentTime + 0.5);
        break;

      case 'floor-tom':
        // 플로어톰 (낮은 톰)
        const floorOsc = ctx.createOscillator();
        const floorGain = ctx.createGain();
        floorOsc.connect(floorGain);
        floorGain.connect(ctx.destination);
        
        floorOsc.type = 'sine';
        floorOsc.frequency.setValueAtTime(100, ctx.currentTime);
        floorOsc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6);
        
        floorGain.gain.setValueAtTime(volume.value * 0.8, ctx.currentTime);
        floorGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
        
        floorOsc.start();
        floorOsc.stop(ctx.currentTime + 0.8);
        break;

      case 'ride':
        // 라이드 심벌 (더 부드러운 심벌)
        const rideBuffer = ctx.createBuffer(1, ctx.sampleRate * 2.0, ctx.sampleRate);
        const rideData = rideBuffer.getChannelData(0);
        for (let i = 0; i < rideData.length; i++) {
          rideData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.5));
        }
        
        const rideSource = ctx.createBufferSource();
        const rideGain = ctx.createGain();
        const rideFilter = ctx.createBiquadFilter();
        
        rideSource.buffer = rideBuffer;
        rideSource.connect(rideFilter);
        rideFilter.connect(rideGain);
        rideGain.connect(ctx.destination);
        
        rideFilter.type = 'highpass';
        rideFilter.frequency.setValueAtTime(2000, ctx.currentTime);
        
        rideGain.gain.setValueAtTime(volume.value * 0.4, ctx.currentTime);
        rideGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
        
        rideSource.start();
        rideSource.stop(ctx.currentTime + 2.0);
        break;
    }

    playHistory.value.push({ note: `drum_${drumType}`, timestamp: Date.now() });
    console.log('🥁 Playing drum:', drumType);
    } catch (error) {
      console.error('❌ Failed to play drum sound:', error);
    }
  };

  return {
    // 상태
    gameState,
    selectedInstrument,
    playMode,
    isPlaying,
    volume,
    playingNotes,

    // 통계
    getPlayStats,

    // 기본 기능
    selectInstrument,
    goBack,
    setMode,
    stopAllSounds,
    setVolume,

    // 악기별 연주 기능
    playPianoNote,
    playViolinNote,
    playDrumSound,

    // 오디오 관리
    initializeAudio,
    createOscillator,
    ensureAudioActive
  };
}