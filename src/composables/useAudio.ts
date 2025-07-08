import { ref } from 'vue';

export function useAudio() {
  const isPlaying = ref(false);
  const currentAudio = ref<HTMLAudioElement | null>(null);
  const audioDuration = ref(0);

  const playAudio = (audioUrl: string, fallbackText?: string): Promise<number> => {
    return new Promise((resolve, reject) => {
      let fallbackHasBeenCalled = false;
      const callFallbackOnce = () => {
        if (!fallbackHasBeenCalled) {
          fallbackHasBeenCalled = true;
          handleAudioFallback(audioUrl, fallbackText);
        }
      };

      // Stop current audio if playing
      if (currentAudio.value) {
        currentAudio.value.pause();
        currentAudio.value.currentTime = 0;
      }

      const audio = new Audio(audioUrl);
      currentAudio.value = audio;
      isPlaying.value = true;

      audio.addEventListener('loadedmetadata', () => {
        audioDuration.value = audio.duration || 2;
      });

      audio.play().catch((error) => {
        if (error.name === 'NotAllowedError') {
          console.warn('Autoplay was blocked by the browser.');
          isPlaying.value = false;
          currentAudio.value = null;
          return reject(error); // Reject promise to be caught by the component
        }
        callFallbackOnce();
        resolve(2);
      });

      audio.addEventListener('ended', () => {
        isPlaying.value = false;
        currentAudio.value = null;
        resolve(audioDuration.value || 2);
      });

      audio.addEventListener('error', (e) => {
        callFallbackOnce();
        resolve(2); // Resolve to avoid unhandled promise rejection
      });
    });
  };

  const handleAudioFallback = (audioUrl: string, fallbackText?: string) => {
    let textToSpeak = fallbackText || '';
    // Extract word from audio URL for text-to-speech
    if (!textToSpeak) {
      const filename = audioUrl.split('/').pop()?.split('.')[0] || '';
      // Map common audio filenames to Korean/English words
      const audioMap: Record<string, { ko: string, en: string }> = {
        'cat-ko': { ko: '고양이', en: 'cat' },
        'cat-en': { ko: '고양이', en: 'cat' },
        'dog-ko': { ko: '강아지', en: 'dog' },
        'dog-en': { ko: '강아지', en: 'dog' },
        'apple-ko': { ko: '사과', en: 'apple' },
        'apple-en': { ko: '사과', en: 'apple' },
        'banana-ko': { ko: '바나나', en: 'banana' },
        'banana-en': { ko: '바나나', en: 'banana' },
        'car-ko': { ko: '자동차', en: 'car' },
        'car-en': { ko: '자동차', en: 'car' },
        'bus-ko': { ko: '버스', en: 'bus' },
        'bus-en': { ko: '버스', en: 'bus' },
        'house-ko': { ko: '집', en: 'house' },
        'house-en': { ko: '집', en: 'house' },
        'flower-ko': { ko: '꽃', en: 'flower' },
        'flower-en': { ko: '꽃', en: 'flower' },
        'tree-ko': { ko: '나무', en: 'tree' },
        'tree-en': { ko: '나무', en: 'tree' },
        'water-ko': { ko: '물', en: 'water' },
        'water-en': { ko: '물', en: 'water' },
        'sun-ko': { ko: '해', en: 'sun' },
        'sun-en': { ko: '해', en: 'sun' },
        'moon-ko': { ko: '달', en: 'moon' },
        'moon-en': { ko: '달', en: 'moon' },
        'book-ko': { ko: '책', en: 'book' },
        'book-en': { ko: '책', en: 'book' },
        'ball-ko': { ko: '공', en: 'ball' },
        'ball-en': { ko: '공', en: 'ball' },
        'airplane-ko': { ko: '비행기', en: 'airplane' },
        'airplane-en': { ko: '비행기', en: 'airplane' },
        'train-ko': { ko: '기차', en: 'train' },
        'train-en': { ko: '기차', en: 'train' },
        'hat-ko': { ko: '모자', en: 'hat' },
        'hat-en': { ko: '모자', en: 'hat' },
        'shoes-ko': { ko: '신발', en: 'shoes' },
        'shoes-en': { ko: '신발', en: 'shoes' },
        'fish-ko': { ko: '물고기', en: 'fish' },
        'fish-en': { ko: '물고기', en: 'fish' },
        'bird-ko': { ko: '새', en: 'bird' },
        'bird-en': { ko: '새', en: 'bird' }
      };

      // Determine language and text
      if (filename.includes('-ko')) {
        textToSpeak = audioMap[filename]?.ko || filename.replace('-ko', '');
      } else if (filename.includes('-en')) {
        textToSpeak = audioMap[filename]?.en || filename.replace('-en', '');
      } else {
        // For book audio or other content
        textToSpeak = '내용을 읽어드립니다';
      }
    }

    // Use Web Speech API for text-to-speech
    if ('speechSynthesis' in window && textToSpeak) {
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      // Set language based on filename
      if (/[^a-zA-Z]/.test(textToSpeak)) {
        utterance.lang = 'ko-KR';
        utterance.rate = 0.8; // Slower for children
      } else {
        utterance.lang = 'en-US';
        utterance.rate = 0.7;
      }
      
      utterance.volume = 0.8;
      utterance.pitch = 1.2; // Higher pitch for children
      
      utterance.onstart = () => {
        isPlaying.value = true;
      };
      
      utterance.onend = () => {
        isPlaying.value = false;
        currentAudio.value = null;
      };
      
      utterance.onerror = () => {
        isPlaying.value = false;
        currentAudio.value = null;
      };
      
      speechSynthesis.speak(utterance);
    } else {
      // Fallback: just show visual feedback
      isPlaying.value = true;
      setTimeout(() => {
        isPlaying.value = false;
        currentAudio.value = null;
      }, 1500);
    }
  };

  const stopAudio = () => {
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
      isPlaying.value = false;
      currentAudio.value = null;
    }
    
    // Stop speech synthesis if active
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  return {
    isPlaying,
    audioDuration,
    playAudio,
    stopAudio
  };
}