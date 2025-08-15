/**
 * 드럼킷용 고품질 재미있는 효과음을 생성하는 Composable
 * 자동차, 동물, 방귀 등 3-4세 유아가 좋아하는 소리들
 * 각 효과음마다 2가지 버전을 랜덤하게 재생하여 다양성 증대
 */

export interface FunSound {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export function useCarSounds() {
  
  /**
   * 재미있는 효과음 목록
   */
  const funSounds: FunSound[] = [
    { id: 'police', name: '경찰차', icon: '🚨', color: '#e74c3c', description: '위이잉~ 위이잉~' },
    { id: 'ambulance', name: '구급차', icon: '🚑', color: '#f39c12', description: '삐뽀삐뽀~' },
    { id: 'engine', name: '부릉부릉', icon: '🚗', color: '#3498db', description: '자동차 엔진소리' },
    { id: 'fart', name: '방귀', icon: '💨', color: '#9b59b6', description: '뿡~ 뿌웅~' },
    { id: 'horn', name: '빵빵', icon: '📯', color: '#e67e22', description: '경적소리' },
    { id: 'cow', name: '소', icon: '🐄', color: '#2ecc71', description: '음메~ 음메~' },
    { id: 'frog', name: '개구리', icon: '🐸', color: '#1abc9c', description: '개굴개굴' },
    { id: 'laugh', name: '웃음', icon: '😂', color: '#f1c40f', description: '하하하하' }
  ];

  /**
   * Web Audio API를 사용한 고품질 효과음 생성 함수들
   * 각 사운드마다 2가지 버전 (A, B)을 제공
   */
  
  /**
   * 경찰차 사이렌 - 버전 A (위이잉~ 위이잉~)
   */
  const playPoliceSoundA = (audioContext: AudioContext) => {
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // 필터 체인 설정
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // 로우패스 필터로 부드러운 소리
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, audioContext.currentTime);
      filter.Q.setValueAtTime(3, audioContext.currentTime);
      
      oscillator.type = 'triangle';
      const startTime = audioContext.currentTime + i * 0.6;
      
      // 부드러운 위이잉~ 패턴
      oscillator.frequency.setValueAtTime(900, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(450, startTime + 0.3);
      oscillator.frequency.exponentialRampToValueAtTime(900, startTime + 0.6);
      
      // 자연스러운 볼륨 엔벨로프
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05);
      gainNode.gain.setValueAtTime(0.25, startTime + 0.55);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    }
  };

  /**
   * 경찰차 사이렌 - 버전 B (웅~ 웅~ 웅~)
   */
  const playPoliceSoundB = (audioContext: AudioContext) => {
    for (let i = 0; i < 4; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, audioContext.currentTime);
      filter.Q.setValueAtTime(5, audioContext.currentTime);
      
      oscillator.type = 'sawtooth';
      const startTime = audioContext.currentTime + i * 0.4;
      
      // 깊은 웅~ 패턴
      oscillator.frequency.setValueAtTime(600, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(300, startTime + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(600, startTime + 0.4);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.setValueAtTime(0.2, startTime + 0.38);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    }
  };

  /**
   * 구급차 사이렌 - 버전 A (삐뽀삐뽀~)
   */
  const playAmbulanceSoundA = (audioContext: AudioContext) => {
    for (let i = 0; i < 6; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, audioContext.currentTime);
      filter.Q.setValueAtTime(2, audioContext.currentTime);
      
      oscillator.type = 'triangle';
      const startTime = audioContext.currentTime + i * 0.25;
      
      // 부드러운 삐뽀 패턴
      const freq = i % 2 === 0 ? 1100 : 650;
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    }
  };

  /**
   * 구급차 사이렌 - 버전 B (우우~ 아아~)
   */
  const playAmbulanceSoundB = (audioContext: AudioContext) => {
    for (let i = 0; i < 4; i++) {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      const gainNode2 = audioContext.createGain();
      const masterGain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(filter);
      gainNode2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioContext.destination);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, audioContext.currentTime);
      filter.Q.setValueAtTime(4, audioContext.currentTime);
      
      const startTime = audioContext.currentTime + i * 0.8;
      
      // 두 개의 오실레이터로 하모니 생성
      oscillator1.type = 'sine';
      oscillator2.type = 'triangle';
      
      oscillator1.frequency.setValueAtTime(800, startTime);
      oscillator1.frequency.exponentialRampToValueAtTime(500, startTime + 0.4);
      oscillator1.frequency.exponentialRampToValueAtTime(800, startTime + 0.8);
      
      oscillator2.frequency.setValueAtTime(1200, startTime);
      oscillator2.frequency.exponentialRampToValueAtTime(750, startTime + 0.4);
      oscillator2.frequency.exponentialRampToValueAtTime(1200, startTime + 0.8);
      
      gainNode1.gain.setValueAtTime(0.15, startTime);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
      
      gainNode2.gain.setValueAtTime(0.1, startTime);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
      
      masterGain.gain.setValueAtTime(0.8, startTime);
      
      oscillator1.start(startTime);
      oscillator1.stop(startTime + 0.8);
      oscillator2.start(startTime);
      oscillator2.stop(startTime + 0.8);
    }
  };

  /**
   * 자동차 엔진소리 - 버전 A (부릉부릉~)
   */
  const playEngineSoundA = (audioContext: AudioContext) => {
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
    const distortion = audioContext.createWaveShaper();
    
    // 체인 구성
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(filterNode);
    gainNode2.connect(filterNode);
    filterNode.connect(distortion);
    distortion.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // 디스토션 커브 생성 (엔진의 거친 소리 표현)
    const samples = 44100;
    const curve = new Float32Array(samples);
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * 2) * 0.5;
    }
    distortion.curve = curve;
    
    // 필터 설정
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(300, audioContext.currentTime);
    filterNode.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.6);
    filterNode.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 1.8);
    filterNode.Q.setValueAtTime(3, audioContext.currentTime);
    
    // 기본 엔진음 (낮은 주파수)
    oscillator1.type = 'sawtooth';
    oscillator1.frequency.setValueAtTime(85, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(180, audioContext.currentTime + 0.6);
    oscillator1.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 1.8);
    
    // 배음 (높은 주파수)
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(170, audioContext.currentTime);
    oscillator2.frequency.exponentialRampToValueAtTime(360, audioContext.currentTime + 0.6);
    oscillator2.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1.8);
    
    // 볼륨 엔벨로프
    gainNode1.gain.setValueAtTime(0.25, audioContext.currentTime);
    gainNode1.gain.setValueAtTime(0.35, audioContext.currentTime + 0.6);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.8);
    
    gainNode2.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode2.gain.setValueAtTime(0.15, audioContext.currentTime + 0.6);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.8);
    
    masterGain.gain.setValueAtTime(0.8, audioContext.currentTime);
    
    oscillator1.start();
    oscillator1.stop(audioContext.currentTime + 1.8);
    oscillator2.start();
    oscillator2.stop(audioContext.currentTime + 1.8);
  };

  /**
   * 자동차 엔진소리 - 버전 B (브름브름~)
   */
  const playEngineSoundB = (audioContext: AudioContext) => {
    // 더 가벼운 스쿠터 엔진 소리
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(150, audioContext.currentTime);
      filter.Q.setValueAtTime(2, audioContext.currentTime);
      
      oscillator.type = 'sawtooth';
      const startTime = audioContext.currentTime + i * 0.5;
      
      // 브름브름 패턴
      oscillator.frequency.setValueAtTime(120, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(220, startTime + 0.2);
      oscillator.frequency.exponentialRampToValueAtTime(140, startTime + 0.5);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.setValueAtTime(0.2, startTime + 0.45);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    }
  };

  /**
   * 방귀소리 - 버전 A (뿡~ 뿌웅~)
   */
  const playFartSoundA = (audioContext: AudioContext) => {
    // 첫 번째 방귀: 뿡~
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const filter1 = audioContext.createBiquadFilter();
    
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(audioContext.destination);
    
    filter1.type = 'lowpass';
    filter1.frequency.setValueAtTime(400, audioContext.currentTime);
    filter1.Q.setValueAtTime(4, audioContext.currentTime);
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(180, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(90, audioContext.currentTime + 0.25);
    
    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.25);
    
    osc1.start();
    osc1.stop(audioContext.currentTime + 0.25);
    
    // 두 번째 방귀: 뿌웅~
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      const filter2 = audioContext.createBiquadFilter();
      
      osc2.connect(filter2);
      filter2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      filter2.type = 'lowpass';
      filter2.frequency.setValueAtTime(300, audioContext.currentTime);
      filter2.Q.setValueAtTime(6, audioContext.currentTime);
      
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(140, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.6);
      
      gain2.gain.setValueAtTime(0.18, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
      
      osc2.start();
      osc2.stop(audioContext.currentTime + 0.6);
    }, 350);
  };

  /**
   * 방귀소리 - 버전 B (프르르~ 푸웅~)
   */
  const playFartSoundB = (audioContext: AudioContext) => {
    // 길고 진동하는 방귀소리
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    const filter1 = audioContext.createBiquadFilter();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    
    // LFO로 진동 효과
    lfo.connect(lfoGain);
    lfoGain.connect(osc1.frequency);
    
    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(audioContext.destination);
    
    filter1.type = 'bandpass';
    filter1.frequency.setValueAtTime(250, audioContext.currentTime);
    filter1.Q.setValueAtTime(8, audioContext.currentTime);
    
    // 메인 오실레이터
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(110, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(65, audioContext.currentTime + 1.2);
    
    // 진동 LFO
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(8, audioContext.currentTime);
    lfoGain.gain.setValueAtTime(15, audioContext.currentTime);
    
    gain1.gain.setValueAtTime(0, audioContext.currentTime);
    gain1.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + 0.1);
    gain1.gain.setValueAtTime(0.15, audioContext.currentTime + 1.0);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.2);
    
    lfo.start();
    lfo.stop(audioContext.currentTime + 1.2);
    osc1.start();
    osc1.stop(audioContext.currentTime + 1.2);
  };

  /**
   * 경적소리 - 버전 A (빵빵!)
   */
  const playHornSoundA = (audioContext: AudioContext) => {
    for (let i = 0; i < 2; i++) {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      const gainNode2 = audioContext.createGain();
      const masterGain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(filter);
      gainNode2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioContext.destination);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, audioContext.currentTime);
      filter.Q.setValueAtTime(2, audioContext.currentTime);
      
      const startTime = audioContext.currentTime + i * 0.4;
      
      // 하모니를 이루는 두 음
      oscillator1.type = 'triangle';
      oscillator1.frequency.setValueAtTime(440, startTime);
      oscillator1.frequency.setValueAtTime(330, startTime + 0.1);
      
      oscillator2.type = 'triangle';
      oscillator2.frequency.setValueAtTime(550, startTime);
      oscillator2.frequency.setValueAtTime(415, startTime + 0.1);
      
      gainNode1.gain.setValueAtTime(0, startTime);
      gainNode1.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      gainNode2.gain.setValueAtTime(0, startTime);
      gainNode2.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      masterGain.gain.setValueAtTime(0.8, startTime);
      
      oscillator1.start(startTime);
      oscillator1.stop(startTime + 0.25);
      oscillator2.start(startTime);
      oscillator2.stop(startTime + 0.25);
    }
  };

  /**
   * 경적소리 - 버전 B (뿌빠~)
   */
  const playHornSoundB = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, audioContext.currentTime);
    filter.Q.setValueAtTime(3, audioContext.currentTime);
    
    oscillator.type = 'sawtooth';
    
    // 뿌빠~ 패턴 (낮은음 -> 높은음)
    oscillator.frequency.setValueAtTime(220, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(350, audioContext.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(350, audioContext.currentTime + 0.15);
    oscillator.frequency.exponentialRampToValueAtTime(280, audioContext.currentTime + 0.6);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.03);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.57);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.6);
  };

  /**
   * 소 울음소리 - 버전 A (음메~ 음메~)
   */
  const playCowSoundA = (audioContext: AudioContext) => {
    for (let i = 0; i < 2; i++) {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      const gainNode2 = audioContext.createGain();
      const masterGain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(filter);
      gainNode2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioContext.destination);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, audioContext.currentTime);
      filter.Q.setValueAtTime(4, audioContext.currentTime);
      
      const startTime = audioContext.currentTime + i * 1.0;
      
      // 기본음과 배음으로 자연스러운 소 울음소리
      oscillator1.type = 'triangle';
      oscillator1.frequency.setValueAtTime(180, startTime);
      oscillator1.frequency.linearRampToValueAtTime(140, startTime + 0.8);
      
      oscillator2.type = 'sine';
      oscillator2.frequency.setValueAtTime(360, startTime);
      oscillator2.frequency.linearRampToValueAtTime(280, startTime + 0.8);
      
      gainNode1.gain.setValueAtTime(0, startTime);
      gainNode1.gain.linearRampToValueAtTime(0.25, startTime + 0.1);
      gainNode1.gain.setValueAtTime(0.2, startTime + 0.4);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
      
      gainNode2.gain.setValueAtTime(0, startTime);
      gainNode2.gain.linearRampToValueAtTime(0.1, startTime + 0.1);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8);
      
      masterGain.gain.setValueAtTime(0.8, startTime);
      
      oscillator1.start(startTime);
      oscillator1.stop(startTime + 0.8);
      oscillator2.start(startTime);
      oscillator2.stop(startTime + 0.8);
    }
  };

  /**
   * 소 울음소리 - 버전 B (으음~ 메에~)
   */
  const playCowSoundB = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    const lfo = audioContext.createOscillator();
    const lfoGain = audioContext.createGain();
    
    // 비브라토 효과
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, audioContext.currentTime);
    filter.Q.setValueAtTime(6, audioContext.currentTime);
    
    oscillator.type = 'triangle';
    
    // 으음~ 메에~ 패턴
    oscillator.frequency.setValueAtTime(160, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(120, audioContext.currentTime + 0.6);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 1.0);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 1.8);
    
    // 비브라토 LFO
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(4, audioContext.currentTime);
    lfoGain.gain.setValueAtTime(8, audioContext.currentTime);
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 1.7);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.8);
    
    lfo.start();
    lfo.stop(audioContext.currentTime + 1.8);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.8);
  };

  /**
   * 개구리 소리 - 버전 A (개굴개굴)
   */
  const playFrogSoundA = (audioContext: AudioContext) => {
    for (let i = 0; i < 4; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(500, audioContext.currentTime);
      filter.Q.setValueAtTime(8, audioContext.currentTime);
      
      oscillator.type = 'sine';
      const startTime = audioContext.currentTime + i * 0.35;
      
      // 자연스러운 개굴 패턴
      oscillator.frequency.setValueAtTime(450, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(320, startTime + 0.08);
      oscillator.frequency.exponentialRampToValueAtTime(380, startTime + 0.15);
      oscillator.frequency.exponentialRampToValueAtTime(300, startTime + 0.25);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
      gainNode.gain.setValueAtTime(0.15, startTime + 0.08);
      gainNode.gain.setValueAtTime(0.12, startTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    }
  };

  /**
   * 개구리 소리 - 버전 B (굴굴굴~)
   */
  const playFrogSoundB = (audioContext: AudioContext) => {
    for (let i = 0; i < 3; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      const lfo = audioContext.createOscillator();
      const lfoGain = audioContext.createGain();
      
      // 떨림 효과
      lfo.connect(lfoGain);
      lfoGain.connect(oscillator.frequency);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, audioContext.currentTime);
      filter.Q.setValueAtTime(5, audioContext.currentTime);
      
      const startTime = audioContext.currentTime + i * 0.5;
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(380, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(280, startTime + 0.4);
      
      // 떨림 LFO
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(12, startTime);
      lfoGain.gain.setValueAtTime(20, startTime);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
      gainNode.gain.setValueAtTime(0.15, startTime + 0.35);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      lfo.start(startTime);
      lfo.stop(startTime + 0.4);
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    }
  };

  /**
   * 웃음소리 - 버전 A (하하하하)
   */
  const playLaughSoundA = (audioContext: AudioContext) => {
    for (let i = 0; i < 6; i++) {
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode1 = audioContext.createGain();
      const gainNode2 = audioContext.createGain();
      const masterGain = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(filter);
      gainNode2.connect(filter);
      filter.connect(masterGain);
      masterGain.connect(audioContext.destination);
      
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(200, audioContext.currentTime);
      filter.Q.setValueAtTime(2, audioContext.currentTime);
      
      const startTime = audioContext.currentTime + i * 0.18;
      
      // 하하 패턴을 위한 두 음성
      oscillator1.type = 'triangle';
      const freq1 = 280 + Math.random() * 120;
      oscillator1.frequency.setValueAtTime(freq1, startTime);
      oscillator1.frequency.exponentialRampToValueAtTime(freq1 * 0.8, startTime + 0.08);
      
      oscillator2.type = 'sine';
      const freq2 = freq1 * 1.5;
      oscillator2.frequency.setValueAtTime(freq2, startTime);
      oscillator2.frequency.exponentialRampToValueAtTime(freq2 * 0.8, startTime + 0.08);
      
      gainNode1.gain.setValueAtTime(0, startTime);
      gainNode1.gain.linearRampToValueAtTime(0.15, startTime + 0.01);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
      
      gainNode2.gain.setValueAtTime(0, startTime);
      gainNode2.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, startTime + 0.12);
      
      masterGain.gain.setValueAtTime(0.8, startTime);
      
      oscillator1.start(startTime);
      oscillator1.stop(startTime + 0.12);
      oscillator2.start(startTime);
      oscillator2.stop(startTime + 0.12);
    }
  };

  /**
   * 웃음소리 - 버전 B (히히히히)
   */
  const playLaughSoundB = (audioContext: AudioContext) => {
    for (let i = 0; i < 8; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, audioContext.currentTime);
      filter.Q.setValueAtTime(6, audioContext.currentTime);
      
      oscillator.type = 'triangle';
      const startTime = audioContext.currentTime + i * 0.12;
      
      // 히히 패턴 (더 높고 날카로운 웃음)
      const freq = 400 + Math.random() * 300;
      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 1.2, startTime + 0.03);
      oscillator.frequency.exponentialRampToValueAtTime(freq * 0.9, startTime + 0.08);
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.08);
    }
  };

  /**
   * 고품질 효과음 재생 함수 맵 (각 사운드마다 2가지 버전)
   */
  const soundFunctions: { [key: string]: { A: (ctx: AudioContext) => void, B: (ctx: AudioContext) => void } } = {
    police: { A: playPoliceSoundA, B: playPoliceSoundB },
    ambulance: { A: playAmbulanceSoundA, B: playAmbulanceSoundB },
    engine: { A: playEngineSoundA, B: playEngineSoundB },
    fart: { A: playFartSoundA, B: playFartSoundB },
    horn: { A: playHornSoundA, B: playHornSoundB },
    cow: { A: playCowSoundA, B: playCowSoundB },
    frog: { A: playFrogSoundA, B: playFrogSoundB },
    laugh: { A: playLaughSoundA, B: playLaughSoundB }
  };

  /**
   * 고품질 효과음 재생 (랜덤하게 A 또는 B 버전 선택)
   */
  const playFunSound = (soundId: string, audioContext: AudioContext) => {
    const soundVariants = soundFunctions[soundId];
    if (soundVariants) {
      // 랜덤하게 A 또는 B 버전 선택
      const version = Math.random() < 0.5 ? 'A' : 'B';
      const soundFunction = soundVariants[version];
      
      soundFunction(audioContext);
      console.log(`🎵 Playing fun sound: ${soundId} (Version ${version})`);
    } else {
      console.warn('❌ Unknown sound ID:', soundId);
    }
  };

  return {
    funSounds,
    playFunSound
  };
}