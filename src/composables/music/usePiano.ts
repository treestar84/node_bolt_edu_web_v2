import { ref } from 'vue';
import { useAudioCore } from './useAudioCore';

export function usePiano() {
  const { initializeAudio, ensureAudioActive, createOscillator } = useAudioCore();
  
  // 연주 기록
  const playingNotes = ref<Set<string>>(new Set());
  const playHistory = ref<Array<{ note: string; timestamp: number }>>([]);

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

      const { oscillator } = result;
      
      playingNotes.value.add(noteKey);
      playHistory.value.push({ note: noteKey, timestamp: Date.now() });

      const ctx = await initializeAudio();
      if (!ctx) return;

      oscillator.start();
      oscillator.stop(ctx.currentTime + 1.0);

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
   * 모든 피아노 소리 정지
   */
  const stopAllNotes = () => {
    playingNotes.value.clear();
  };

  return {
    playingNotes,
    playHistory,
    playPianoNote,
    stopAllNotes
  };
}