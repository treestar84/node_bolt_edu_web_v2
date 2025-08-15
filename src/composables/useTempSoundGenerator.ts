/**
 * 임시 사운드 파일 생성기
 * 실제 사운드 파일이 준비될 때까지 사용할 고품질 Web Audio 사운드
 */

export function useTempSoundGenerator() {
  
  /**
   * 더 자연스러운 성공 사운드 생성
   */
  const generateSuccessSound = (audioContext: AudioContext) => {
    // 하프 아르페지오 효과
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4-E4-G4-C5
    
    notes.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // 필터로 더 부드러운 소리
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, audioContext.currentTime);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'triangle';  // 부드러운 삼각파
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
      
      // 자연스러운 엔벨로프
      const startTime = audioContext.currentTime + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.02); // 어택
      gainNode.gain.exponentialRampToValueAtTime(0.1, startTime + 0.1); // 디케이
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6); // 릴리즈
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    });
  };

  /**
   * 부드러운 실패 사운드 생성
   */
  const generateFailureSound = (audioContext: AudioContext) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // 로우패스 필터로 부드럽게
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioContext.currentTime);
    filter.Q.setValueAtTime(5, audioContext.currentTime);
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    
    // 부드럽게 하강하는 음
    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
    oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.6);
    
    // 부드러운 볼륨 곡선
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.15, audioContext.currentTime + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  };

  /**
   * 색칠 터치 사운드 생성
   */
  const generateColoringSound = (audioContext: AudioContext) => {
    // 물방울 + 브러쉬 터치 효과
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();
    const gainNode2 = audioContext.createGain();
    const masterGain = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();
    
    // 하이패스 필터로 깔끔한 소리
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(400, audioContext.currentTime);
    
    oscillator1.connect(gainNode1);
    oscillator2.connect(gainNode2);
    gainNode1.connect(filter);
    gainNode2.connect(filter);
    filter.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    // 첫 번째 오실레이터: 물방울 효과
    oscillator1.type = 'sine';
    oscillator1.frequency.setValueAtTime(1200, audioContext.currentTime);
    oscillator1.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.03);
    
    gainNode1.gain.setValueAtTime(0.08, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.03);
    
    // 두 번째 오실레이터: 브러쉬 터치 효과
    oscillator2.type = 'triangle';
    oscillator2.frequency.setValueAtTime(600, audioContext.currentTime + 0.01);
    oscillator2.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.05);
    
    gainNode2.gain.setValueAtTime(0.04, audioContext.currentTime + 0.01);
    gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    masterGain.gain.setValueAtTime(0.6, audioContext.currentTime);
    
    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.03);
    oscillator2.start(audioContext.currentTime + 0.01);
    oscillator2.stop(audioContext.currentTime + 0.05);
  };

  /**
   * 웅장한 완성 사운드 생성
   */
  const generateCompletionSound = (audioContext: AudioContext) => {
    // 화려한 팡파르
    const majorScale = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5-E6
    
    // 첫 번째 패시지: 상승하는 아르페지오
    majorScale.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3000, audioContext.currentTime);
      filter.Q.setValueAtTime(2, audioContext.currentTime);
      
      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sawtooth';  // 더 풍부한 배음
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.1);
      
      const startTime = audioContext.currentTime + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.4);
    });
    
    // 두 번째 패시지: 화려한 코드 (0.8초 후)
    setTimeout(() => {
      const chord = [523.25, 659.25, 783.99]; // C 메이저
      chord.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(freq * 2, audioContext.currentTime);
        filter.Q.setValueAtTime(3, audioContext.currentTime);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.02);
        
        const startTime = audioContext.currentTime + index * 0.02;
        gainNode.gain.setValueAtTime(0.25, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.2);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 1.2);
      });
    }, 800);
  };

  /**
   * 향상된 사운드 재생
   */
  const playEnhancedSound = (type: 'success' | 'failure' | 'coloring' | 'completion') => {
    if (!('AudioContext' in window || 'webkitAudioContext' in window)) {
      console.warn('Web Audio API not supported');
      return;
    }

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    switch (type) {
      case 'success':
        generateSuccessSound(audioContext);
        break;
      case 'failure':
        generateFailureSound(audioContext);
        break;
      case 'coloring':
        generateColoringSound(audioContext);
        break;
      case 'completion':
        generateCompletionSound(audioContext);
        break;
    }
  };

  return {
    playEnhancedSound,
    generateSuccessSound,
    generateFailureSound,
    generateColoringSound,
    generateCompletionSound
  };
}