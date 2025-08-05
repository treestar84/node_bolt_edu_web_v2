// Re-export types for backward compatibility
export type { InstrumentItem, MusicGameState, PlayMode } from './music/useMusicGame';

// Import all decomposed composables
import { useMusicGame } from './music/useMusicGame';
import { useAudioCore } from './music/useAudioCore';
import { usePiano } from './music/usePiano';
import { useViolin } from './music/useViolin';
import { useDrums } from './music/useDrums';

export function useMusic() {
  // Get all composable functions
  const gameCore = useMusicGame();
  const audioCore = useAudioCore();
  const piano = usePiano();
  const violin = useViolin();
  const drums = useDrums();

  return {
    // Game state
    ...gameCore,
    
    // Audio core
    ...audioCore,
    
    // Piano functions
    playPianoNote: piano.playPianoNote,
    
    // Violin functions
    playViolinNote: violin.playViolinNote,
    
    // Drums functions
    playDrumSound: drums.playDrumSound,
    
    // Stats
    getPlayStats: gameCore.getPlayStats
  };
}