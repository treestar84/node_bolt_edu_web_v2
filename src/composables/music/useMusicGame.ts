import { ref, computed } from 'vue';

export interface InstrumentItem {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type MusicGameState = 'selection' | 'piano' | 'car-sounds' | 'violin';
export type PlayMode = 'free' | 'guide';

export function useMusicGame() {
  // 게임 상태
  const gameState = ref<MusicGameState>('selection');
  const selectedInstrument = ref<InstrumentItem | null>(null);
  const playMode = ref<PlayMode>('free');
  const isPlaying = ref(false);
  
  // 연주 기록 (여러 악기 공통)
  const playingNotes = ref<Set<string>>(new Set());
  const playHistory = ref<Array<{ note: string; timestamp: number }>>([]);

  /**
   * 악기 선택
   */
  const selectInstrument = async (instrument: InstrumentItem) => {
    selectedInstrument.value = instrument;
    gameState.value = instrument.id as MusicGameState;
    
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

  return {
    // 상태
    gameState,
    selectedInstrument,
    playMode,
    isPlaying,
    playingNotes,
    playHistory,

    // 통계
    getPlayStats,

    // 기본 기능
    selectInstrument,
    goBack,
    setMode,
    stopAllSounds
  };
}