import { ref } from 'vue';

export function useAudio() {
  const isPlaying = ref(false);
  const currentAudio = ref<HTMLAudioElement | null>(null);
  const audioDuration = ref(0);
  let currentTimeoutId: NodeJS.Timeout | null = null;
  let audioContext: AudioContext | null = null;
  let isAudioUnlocked = ref(false);

  // Initialize audio context for mobile devices
  const initializeAudioContext = async () => {
    if (audioContext) return;
    
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }
      
      isAudioUnlocked.value = true;
      console.log('🔊 Audio context initialized:', audioContext.state);
    } catch (error) {
      console.error('Failed to initialize audio context:', error);
    }
  };

  // Unlock audio on first user interaction
  const unlockAudio = async () => {
    if (isAudioUnlocked.value) return;
    
    try {
      await initializeAudioContext();
      
      // Create a silent audio buffer to unlock audio
      const silentAudio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNTBFVi1wVcpnq+K0QUKFWKNcQJunYYwJQYHBIZfOPZ5YOF5xfEglQ3qyKY5Dfjxr/YtWTD3fmPnMZNKPRXmFP6BjyTYo');
      silentAudio.volume = 0.01;
      await silentAudio.play();
      
      isAudioUnlocked.value = true;
      console.log('🔓 Audio unlocked successfully');
    } catch (error) {
      console.warn('Audio unlock failed:', error);
    }
  };

  const playAudio = (
    audioUrl: string,
    options?: { fallbackText?: string; onEnded?: () => void } | string
  ): Promise<number> => {
    return new Promise(async (resolve, reject) => {
      console.log('🎵 Starting audio playback:', audioUrl);
      
      // Ensure audio is unlocked on mobile
      if (!isAudioUnlocked.value) {
        await unlockAudio();
      }
      
      // Handle both string and object options for backward compatibility
      let fallbackText: string | undefined;
      let onEnded: (() => void) | undefined;
      
      if (typeof options === 'string') {
        fallbackText = options;
      } else if (options) {
        fallbackText = options.fallbackText;
        onEnded = options.onEnded;
      }
      
      // Clear any existing timeout
      if (currentTimeoutId) {
        clearTimeout(currentTimeoutId);
        currentTimeoutId = null;
      }

      // Stop current audio if playing
      if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value.currentTime = 0;
        currentAudio.value = null;
      }

      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audio.src = audioUrl;
      
      // Mobile optimization
      (audio as any).playsInline = true;
      if ('webkitPlaysInline' in audio) {
        (audio as any).webkitPlaysInline = true;
      }
      
      currentAudio.value = audio;
      isPlaying.value = true;

      let hasEnded = false;
      let hasErrored = false;

      const handleSuccess = (duration: number) => {
        if (hasEnded || hasErrored) return;
        hasEnded = true;
        
        console.log('✅ Audio playback completed successfully');
        isPlaying.value = false;
        currentAudio.value = null;
        
        if (onEnded) {
          console.log('🔄 Calling onEnded callback');
          onEnded();
        }
        resolve(duration);
      };

      const handleError = (errorType: string) => {
        if (hasEnded || hasErrored) return;
        hasErrored = true;
        
        console.log('❌ Audio playback failed:', errorType);
        isPlaying.value = false;
        currentAudio.value = null;
        
        // Try TTS fallback
        tryTTSFallback(audioUrl, fallbackText, onEnded)
          .then(duration => resolve(duration))
          .catch(() => {
            // If TTS also fails, still call onEnded callback
            console.log('🔄 TTS failed, calling onEnded callback anyway');
            if (onEnded) {
              onEnded();
            }
            resolve(2);
          });
      };

      // Set up event listeners
      audio.addEventListener('loadedmetadata', () => {
        audioDuration.value = audio.duration || 2;
        console.log('📊 Audio duration:', audioDuration.value);
      }, { once: true });

      audio.addEventListener('ended', () => {
        console.log('🎵 Audio ended event fired');
        handleSuccess(audioDuration.value || 2);
      }, { once: true });

      audio.addEventListener('error', (e) => {
        console.log('🚨 Audio error event:', e);
        handleError('error_event');
      }, { once: true });

      // Safety timeout - if audio doesn't end within expected time + buffer
      const setupSafetyTimeout = () => {
        const duration = audioDuration.value || 3; // fallback to 3 seconds
        const timeoutDuration = (duration + 2) * 1000; // Add 2 second buffer
        
        console.log(`⏰ Setting safety timeout for ${timeoutDuration}ms`);
        currentTimeoutId = setTimeout(() => {
          console.log('⚠️ Safety timeout triggered - forcing audio end');
          if (!hasEnded && !hasErrored) {
            handleSuccess(duration);
          }
        }, timeoutDuration);
      };

      // Start playing
      audio.play()
        .then(() => {
          console.log('▶️ Audio play() succeeded');
          // Set up safety timeout after play succeeds
          if (audioDuration.value > 0) {
            setupSafetyTimeout();
          } else {
            // If duration not available yet, wait a bit
            setTimeout(setupSafetyTimeout, 100);
          }
        })
        .catch((error) => {
          console.log('🚫 Audio play() failed:', error.name, error.message);
          if (error.name === 'NotAllowedError') {
            console.warn('Autoplay was blocked by the browser.');
            reject(error);
          } else {
            handleError('play_failed');
          }
        });
    });
  };

  const tryTTSFallback = (audioUrl: string, fallbackText?: string, onEnded?: () => void): Promise<number> => {
    return new Promise((resolve, reject) => {
      console.log('🗣️ Trying TTS fallback');
      
      let textToSpeak = fallbackText || extractTextFromAudioUrl(audioUrl);
      
      if (!textToSpeak) {
        console.log('❌ No text available for TTS');
        reject(new Error('No text available'));
        return;
      }

      // Enhanced TTS availability check
      if (!('speechSynthesis' in window)) {
        console.log('❌ SpeechSynthesis not supported');
        reject(new Error('TTS not supported'));
        return;
      }

      // Wait for voices to load (important for tablets)
      const waitForVoices = () => {
        return new Promise<void>((voiceResolve) => {
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            voiceResolve();
          } else {
            // Wait for voiceschanged event
            const handleVoicesChanged = () => {
              speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
              voiceResolve();
            };
            speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
            
            // Fallback timeout
            setTimeout(() => {
              speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
              voiceResolve();
            }, 2000);
          }
        });
      };

      waitForVoices().then(() => {
        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        let hasCompleted = false;

        const handleTTSComplete = () => {
          if (hasCompleted) return;
          hasCompleted = true;
          
          console.log('✅ TTS completed');
          isPlaying.value = false;
          
          if (onEnded) {
            console.log('🔄 Calling onEnded callback from TTS');
            onEnded();
          }
          resolve(2);
        };

        // Enhanced voice selection for better tablet compatibility
        const selectVoice = () => {
          const voices = speechSynthesis.getVoices();
          const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(textToSpeak);
          
          if (isKorean) {
            // Try to find Korean voice
            const koreanVoices = voices.filter(voice => 
              voice.lang.startsWith('ko') || 
              voice.name.toLowerCase().includes('korean') ||
              voice.name.toLowerCase().includes('yuna') ||
              voice.name.toLowerCase().includes('nayoung')
            );
            
            if (koreanVoices.length > 0) {
              utterance.voice = koreanVoices[0];
              utterance.lang = 'ko-KR';
            } else {
              utterance.lang = 'ko-KR';
            }
            utterance.rate = 0.6; // Slower for Korean
            utterance.pitch = 1.0;
          } else {
            // Try to find English voice
            const englishVoices = voices.filter(voice => 
              voice.lang.startsWith('en') ||
              voice.name.toLowerCase().includes('english')
            );
            
            if (englishVoices.length > 0) {
              utterance.voice = englishVoices[0];
              utterance.lang = 'en-US';
            } else {
              utterance.lang = 'en-US';
            }
            utterance.rate = 0.7; // Slower for better clarity
            utterance.pitch = 1.1;
          }
        };

        selectVoice();
        utterance.volume = 0.9; // Slightly higher volume for tablets

        // Enhanced event handling for tablets
        utterance.onstart = () => {
          console.log('🗣️ TTS started');
          isPlaying.value = true;
        };

        utterance.onend = () => {
          console.log('🗣️ TTS ended normally');
          handleTTSComplete();
        };

        utterance.onerror = (error) => {
          console.log('🚨 TTS error:', error.error);
          
          // On tablets, sometimes we get errors but TTS still works
          // Wait a bit before completing to see if speech actually happens
          setTimeout(() => {
            if (!hasCompleted) {
              handleTTSComplete();
            }
          }, 500);
        };

        utterance.onpause = () => {
          console.log('⏸️ TTS paused');
        };

        utterance.onresume = () => {
          console.log('▶️ TTS resumed');
        };

        // Clear any existing speech
        speechSynthesis.cancel();
        
        // Small delay to ensure cancel is processed
        setTimeout(() => {
          // Safety timeout for TTS (max 15 seconds for tablets)
          const safetyTimeout = setTimeout(() => {
            if (!hasCompleted) {
              console.log('⚠️ TTS safety timeout triggered');
              speechSynthesis.cancel();
              handleTTSComplete();
            }
          }, 15000);

          try {
            console.log('🗣️ Starting TTS with text:', textToSpeak);
            speechSynthesis.speak(utterance);
            
            // Additional check for tablets - some don't fire events properly
            setTimeout(() => {
              if (!hasCompleted && !speechSynthesis.speaking && !speechSynthesis.pending) {
                console.log('🔄 TTS seems to have completed without event');
                clearTimeout(safetyTimeout);
                handleTTSComplete();
              }
            }, 3000);
            
          } catch (error) {
            console.error('🚨 TTS speak() failed:', error);
            clearTimeout(safetyTimeout);
            reject(error);
          }
        }, 100);
      });
    });
  };

  const extractTextFromAudioUrl = (audioUrl: string): string => {
    const filename = audioUrl.split('/').pop()?.split('.')[0] || '';
    
    // Simple mapping for common words
    const audioMap: Record<string, string> = {
      'cat-ko': '고양이', 'cat-en': 'cat',
      'dog-ko': '강아지', 'dog-en': 'dog',
      'apple-ko': '사과', 'apple-en': 'apple',
      'book-ko': '책', 'book-en': 'book'
    };

    return audioMap[filename] || '내용을 읽어드립니다';
  };

  const stopAudio = () => {
    console.log('🛑 Stopping audio');
    
    // Clear any pending timeout
    if (currentTimeoutId) {
      clearTimeout(currentTimeoutId);
      currentTimeoutId = null;
    }
    
    // Stop HTML audio
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
      currentAudio.value = null;
    }
    
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    
    isPlaying.value = false;
  };

  // TTS 진단 도구 (디버깅용)
  const diagnoseTTS = () => {
    console.log('🔍 TTS Diagnosis Start');
    
    const result = {
      speechSynthesisSupported: 'speechSynthesis' in window,
      voicesCount: 0,
      availableVoices: [] as any[],
      koreanVoices: [] as any[],
      englishVoices: [] as any[],
      browserInfo: navigator.userAgent
    };

    if (result.speechSynthesisSupported) {
      const voices = speechSynthesis.getVoices();
      result.voicesCount = voices.length;
      result.availableVoices = voices.map(v => ({
        name: v.name,
        lang: v.lang,
        localService: v.localService,
        default: v.default
      }));
      
      result.koreanVoices = voices.filter(v => 
        v.lang.startsWith('ko') || 
        v.name.toLowerCase().includes('korean')
      );
      
      result.englishVoices = voices.filter(v => 
        v.lang.startsWith('en')
      );
    }

    console.log('📊 TTS Diagnosis Result:', result);
    return result;
  };

  // 강제 TTS 테스트 (태블릿 디버깅용)
  const testTTS = (text: string = '테스트') => {
    console.log('🧪 Testing TTS with text:', text);
    return tryTTSFallback('', text);
  };

  // 사용자 상호작용 후 TTS 활성화
  const activateTTSOnUserInteraction = () => {
    const activateTTS = async () => {
      try {
        // 빈 음성으로 TTS 활성화
        const utterance = new SpeechSynthesisUtterance(' ');
        utterance.volume = 0.01;
        speechSynthesis.speak(utterance);
        
        console.log('✅ TTS activated on user interaction');
      } catch (error) {
        console.warn('⚠️ TTS activation failed:', error);
      }
    };

    // 다양한 사용자 이벤트에 리스너 추가
    const events = ['click', 'touchstart', 'keydown'];
    const activateOnce = () => {
      activateTTS();
      events.forEach(event => {
        document.removeEventListener(event, activateOnce);
      });
    };

    events.forEach(event => {
      document.addEventListener(event, activateOnce, { once: true });
    });
  };

  return {
    isPlaying,
    audioDuration,
    playAudio,
    stopAudio,
    unlockAudio,
    isAudioUnlocked,
    diagnoseTTS,
    testTTS,
    activateTTSOnUserInteraction
  };
}