/**
 * 드럼킷용 재미있는 효과음을 생성하는 Composable
 * 자동차, 동물, 방귀 등 3-4세 유아가 좋아하는 소리들
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
   * Web Audio API를 사용한 효과음 생성 함수들
   */
  
  /**
   * 경찰차 사이렌 (위이잉~ 위이잉~)
   */
  const playPoliceSound = (audioContext: AudioContext) => {
    // const _duration = 2.0;
    
    // 두 개의 주파수를 번갈아가며 재생
    for (let i = 0; i < 4; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'triangle';
      const startTime = audioContext.currentTime + i * 0.5;
      
      // 위이잉~ 패턴 (높은음 -> 낮은음)
      oscillator.frequency.setValueAtTime(800, startTime);
      oscillator.frequency.linearRampToValueAtTime(400, startTime + 0.25);
      oscillator.frequency.setValueAtTime(800, startTime + 0.25);
      oscillator.frequency.linearRampToValueAtTime(400, startTime + 0.5);
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    }
  };

  /**
   * 구급차 사이렌 (삐뽀삐뽀~)
   */
  const playAmbulanceSound = (audioContext: AudioContext) => {
    // const _duration = 2.0;
    
    for (let i = 0; i < 6; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'square';
      const startTime = audioContext.currentTime + i * 0.3;
      
      // 삐뽀 패턴 (짧은 높은음 -> 짧은 낮은음)
      const freq = i % 2 === 0 ? 1000 : 600;
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    }
  };

  /**
   * 자동차 엔진소리 (부릉부릉~)
   */
  const playEngineSound = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();
    
    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(80, audioContext.currentTime);
    oscillator.frequency.linearRampToValueAtTime(200, audioContext.currentTime + 0.5);
    oscillator.frequency.linearRampToValueAtTime(120, audioContext.currentTime + 1.5);
    
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(500, audioContext.currentTime);
    filterNode.frequency.linearRampToValueAtTime(1000, audioContext.currentTime + 0.5);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.4, audioContext.currentTime + 0.5);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 1.5);
  };

  /**
   * 방귀소리 (뿡~ 뿌웅~)
   */
  const playFartSound = (audioContext: AudioContext) => {
    // 첫 번째 방귀: 뿡~
    const osc1 = audioContext.createOscillator();
    const gain1 = audioContext.createGain();
    
    osc1.connect(gain1);
    gain1.connect(audioContext.destination);
    
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(150, audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(80, audioContext.currentTime + 0.3);
    
    gain1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    osc1.start();
    osc1.stop(audioContext.currentTime + 0.3);
    
    // 두 번째 방귀: 뿌웅~
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(120, audioContext.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(60, audioContext.currentTime + 0.8);
      
      gain2.gain.setValueAtTime(0.25, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
      
      osc2.start();
      osc2.stop(audioContext.currentTime + 0.8);
    }, 400);
  };

  /**
   * 경적소리 (빵빵!)
   */
  const playHornSound = (audioContext: AudioContext) => {
    for (let i = 0; i < 2; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'square';
      const startTime = audioContext.currentTime + i * 0.3;
      
      oscillator.frequency.setValueAtTime(440, startTime);
      oscillator.frequency.setValueAtTime(330, startTime + 0.05);
      
      gainNode.gain.setValueAtTime(0.4, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    }
  };

  /**
   * 소 울음소리 (음메~ 음메~)
   */
  const playCowSound = (audioContext: AudioContext) => {
    for (let i = 0; i < 2; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'triangle';
      const startTime = audioContext.currentTime + i * 0.8;
      
      // 음메~ 패턴
      oscillator.frequency.setValueAtTime(200, startTime);
      oscillator.frequency.linearRampToValueAtTime(150, startTime + 0.6);
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.setValueAtTime(0.2, startTime + 0.3);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    }
  };

  /**
   * 개구리 소리 (개굴개굴)
   */
  const playFrogSound = (audioContext: AudioContext) => {
    for (let i = 0; i < 4; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      const startTime = audioContext.currentTime + i * 0.3;
      
      // 개굴 패턴 (빠른 주파수 변화)
      oscillator.frequency.setValueAtTime(400, startTime);
      oscillator.frequency.setValueAtTime(300, startTime + 0.1);
      oscillator.frequency.setValueAtTime(350, startTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.25, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    }
  };

  /**
   * 웃음소리 (하하하하)
   */
  const playLaughSound = (audioContext: AudioContext) => {
    for (let i = 0; i < 8; i++) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'triangle';
      const startTime = audioContext.currentTime + i * 0.15;
      
      // 하하하 패턴 (빠른 반복)
      const freq = 300 + Math.random() * 200; // 랜덤한 높이
      oscillator.frequency.setValueAtTime(freq, startTime);
      
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    }
  };

  /**
   * 효과음 재생 함수 맵
   */
  const soundFunctions: { [key: string]: (ctx: AudioContext) => void } = {
    police: playPoliceSound,
    ambulance: playAmbulanceSound,
    engine: playEngineSound,
    fart: playFartSound,
    horn: playHornSound,
    cow: playCowSound,
    frog: playFrogSound,
    laugh: playLaughSound
  };

  /**
   * 효과음 재생
   */
  const playFunSound = (soundId: string, audioContext: AudioContext) => {
    const soundFunction = soundFunctions[soundId];
    if (soundFunction) {
      soundFunction(audioContext);
      console.log('🎵 Playing fun sound:', soundId);
    } else {
      console.warn('❌ Unknown sound ID:', soundId);
    }
  };

  return {
    funSounds,
    playFunSound
  };
}