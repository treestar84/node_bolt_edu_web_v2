/**
 * 게임 효과음을 관리하는 Composable
 * 퍼즐, 퀴즈 등에서 공통으로 사용되는 다양한 효과음을 제공합니다.
 * 향상된 사운드 품질과 폴백 시스템 포함
 */

import { useTempSoundGenerator } from './useTempSoundGenerator';

export function useGameSounds() {
  const tempSounds = useTempSoundGenerator();
  
  /**
   * 성공 시 재생되는 향상된 효과음
   */
  const playSuccessSound = () => {
    // 향상된 하프 아르페지오 사운드 사용
    tempSounds.playEnhancedSound('success');
    console.log('🎵 향상된 성공 사운드 재생');
  };

  /**
   * 실패 시 재생되는 향상된 효과음
   */
  const playFailureSound = () => {
    // 향상된 부드러운 실패 사운드 사용
    tempSounds.playEnhancedSound('failure');
    console.log('🎵 향상된 실패 사운드 재생');
  };

  /**
   * 게임 완료 시 재생되는 향상된 축하 효과음
   */
  const playCompletionSound = () => {
    // 향상된 웅장한 완성 사운드 사용
    tempSounds.playEnhancedSound('completion');
    console.log('🎵 향상된 완성 사운드 재생');
  };

  /**
   * 색칠할 때 재생되는 향상된 효과음
   */
  const playColoringSound = () => {
    // 향상된 자연스러운 색칠 터치 사운드 사용
    tempSounds.playEnhancedSound('coloring');
    console.log('🎵 향상된 색칠 사운드 재생');
  };

  /**
   * 색칠 완성 시 특별한 향상된 축하 효과음
   */
  const playColoringCompletionSound = () => {
    // 향상된 화려한 완성 사운드 사용
    tempSounds.playEnhancedSound('completion');
    console.log('🎵 향상된 색칠 완성 사운드 재생');
  };

  return {
    playSuccessSound,
    playFailureSound,
    playCompletionSound,
    playColoringSound,
    playColoringCompletionSound,
  };
}