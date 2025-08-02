/**
 * 게임 효과음을 관리하는 Composable
 * 퍼즐, 퀴즈 등에서 공통으로 사용되는 다양한 효과음을 제공합니다.
 */

export function useGameSounds() {
  
  /**
   * 성공 시 재생되는 다양한 효과음들 (3가지 랜덤)
   */
  const playSuccessSound = () => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      const successSounds = [
        // 1. 딩동댕~ 클래식한 성공음
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
          oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
          oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        },

        // 2. 야호~ 환호 소리
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'triangle';
          
          // "야~호~" 패턴
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);     // 야
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.15); // 높은 음
          oscillator.frequency.setValueAtTime(500, audioContext.currentTime + 0.3);  // 호
          
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.6);
        },

        // 3. 짝짝짝~ 박수 소리
        () => {
          // 3번의 박수 소리
          for (let i = 0; i < 3; i++) {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.type = 'square';
            
            const startTime = audioContext.currentTime + i * 0.2;
            
            // 박수 소리 (높은 주파수의 짧은 버스트)
            oscillator.frequency.setValueAtTime(800, startTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, startTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.2, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + 0.1);
          }
        }
      ];
      
      // 랜덤하게 하나의 성공 효과음 선택
      const randomSound = successSounds[Math.floor(Math.random() * successSounds.length)];
      randomSound();
    }
  };

  /**
   * 실패 시 재생되는 다양한 재미있는 효과음들 (4가지 랜덤)
   */
  const playFailureSound = () => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      const failureSounds = [
        // 1. 방구 소리 (뿡~ 뿌웅~)
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sawtooth'; // 방구 같은 거친 소리
          
          // 뿡~ 뿌웅~ 패턴
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(150, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(120, audioContext.currentTime + 0.2);
          oscillator.frequency.setValueAtTime(90, audioContext.currentTime + 0.35);
          oscillator.frequency.setValueAtTime(70, audioContext.currentTime + 0.5);
          
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime + 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.6);
        },
        
        // 2. 틀렸어~ 말하는 소리 (톤 변화로 표현)
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'triangle';
          
          // "틀~렸~어~" 패턴 (3음절)
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime);     // 틀
          oscillator.frequency.setValueAtTime(350, audioContext.currentTime + 0.15); // 렸
          oscillator.frequency.setValueAtTime(280, audioContext.currentTime + 0.3);  // 어
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.25, audioContext.currentTime + 0.15);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        },
        
        // 3. 아이고~ 한숨 소리
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sine';
          
          // "아~이~고~" 한숨 패턴
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);     // 아
          oscillator.frequency.setValueAtTime(250, audioContext.currentTime + 0.2); // 이
          oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.4); // 고
          oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.8); // 한숨
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.15, audioContext.currentTime + 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.8);
        },
        
        // 4. 야옹~ 고양이 울음소리 (귀여운 실패음)
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'triangle';
          
          // "야~옹~" 패턴
          oscillator.frequency.setValueAtTime(500, audioContext.currentTime);      // 야
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1); // 고음
          oscillator.frequency.setValueAtTime(400, audioContext.currentTime + 0.2); // 옹
          oscillator.frequency.exponentialRampToValueAtTime(250, audioContext.currentTime + 0.6); // 꼬리음
          
          gainNode.gain.setValueAtTime(0.18, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.22, audioContext.currentTime + 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.6);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.6);
        }
      ];
      
      // 랜덤하게 하나의 실패 효과음 선택
      const randomSound = failureSounds[Math.floor(Math.random() * failureSounds.length)];
      randomSound();
    }
  };

  /**
   * 게임 완료 시 재생되는 화려한 축하 효과음
   */
  const playCompletionSound = () => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // 승리 팡파르 (C-E-G-C 상승)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + index * 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + index * 0.2 + 0.3);
        
        oscillator.start(audioContext.currentTime + index * 0.2);
        oscillator.stop(audioContext.currentTime + index * 0.2 + 0.3);
      });
    }
  };

  /**
   * 색칠할 때 재생되는 부드러운 효과음들 (5가지 랜덤)
   */
  const playColoringSound = () => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      const coloringSounds = [
        // 1. 부드러운 붓 터치 소리
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sine';
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.1);
        },
        
        // 2. 물방울 소리 (톡~)
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'triangle';
          
          oscillator.frequency.setValueAtTime(1200, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(600, audioContext.currentTime + 0.05);
          
          gainNode.gain.setValueAtTime(0.08, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.05);
        },
        
        // 3. 부드러운 하프 소리
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'triangle';
          
          const notes = [523, 659, 783]; // C, E, G 화음
          const randomNote = notes[Math.floor(Math.random() * notes.length)];
          
          oscillator.frequency.setValueAtTime(randomNote, audioContext.currentTime);
          
          gainNode.gain.setValueAtTime(0.06, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        },
        
        // 4. 종소리 (딩~)
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sine';
          
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, audioContext.currentTime + 0.2);
          
          gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.2);
        },
        
        // 5. 바람 소리 (쉬익~)
        () => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sawtooth';
          
          oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.15);
          
          gainNode.gain.setValueAtTime(0.04, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.15);
        }
      ];
      
      // 랜덤하게 하나의 색칠 효과음 선택
      const randomSound = coloringSounds[Math.floor(Math.random() * coloringSounds.length)];
      randomSound();
    }
  };

  /**
   * 색칠 완성 시 특별한 축하 효과음 (더 화려함)
   */
  const playColoringCompletionSound = () => {
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      
      // 더 화려한 팡파르 (C-E-G-C-E-G-C 상승)
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00]; // C5-C7
      
      // 첫 번째 파트: 상승하는 음계
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.type = 'triangle';
        
        const startTime = audioContext.currentTime + index * 0.15;
        oscillator.frequency.setValueAtTime(freq, startTime);
        
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.4);
      });
      
      // 두 번째 파트: 화려한 코드 (1초 후)
      setTimeout(() => {
        const chord = [1046.50, 1318.51, 1567.98]; // C6, E6, G6
        chord.forEach((freq, index) => {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.type = 'sine';
          
          const startTime = audioContext.currentTime + index * 0.05;
          oscillator.frequency.setValueAtTime(freq, startTime);
          
          gainNode.gain.setValueAtTime(0.25, startTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + 1.5);
        });
      }, 50);
    }
  };

  return {
    playSuccessSound,
    playFailureSound,
    playCompletionSound,
    playColoringSound,
    playColoringCompletionSound,
  };
}