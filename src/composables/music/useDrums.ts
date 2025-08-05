import { ref } from 'vue';
import { useAudioCore } from './useAudioCore';
import { useMusicGame } from './useMusicGame';

export function useDrums() {
  const { initializeAudio, ensureAudioActive, volume } = useAudioCore();
  const { playHistory } = useMusicGame();
  
  // 로컬 연주 기록 (필요시 사용)
  const localPlayHistory = ref<Array<{ note: string; timestamp: number }>>([]);

  /**
   * 드럼 소리 재생 (확장된 드럼세트)
   */
  const playDrumSound = async (drumType: 'kick' | 'snare' | 'hihat' | 'cymbal' | 'tom1' | 'tom2' | 'floor-tom' | 'ride') => {
    try {
      // 사용자 인터랙션으로 오디오 활성화
      await ensureAudioActive();
      
      const ctx = await initializeAudio();
      if (!ctx) return;

      switch (drumType) {
        case 'kick':
          // 킥드럼 (저음 둥둥)
          const kickOsc = ctx.createOscillator();
          const kickGain = ctx.createGain();
          kickOsc.connect(kickGain);
          kickGain.connect(ctx.destination);
          
          kickOsc.type = 'sine';
          kickOsc.frequency.setValueAtTime(60, ctx.currentTime);
          kickOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.1);
          
          kickGain.gain.setValueAtTime(volume.value * 0.8, ctx.currentTime);
          kickGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          
          kickOsc.start();
          kickOsc.stop(ctx.currentTime + 0.3);
          break;

        case 'snare':
          // 스네어 드럼 (따다닥)
          const snareOsc = ctx.createOscillator();
          const snareNoise = ctx.createBufferSource();
          const snareGain = ctx.createGain();
          const noiseGain = ctx.createGain();
          
          // 톤 부분
          snareOsc.connect(snareGain);
          snareGain.connect(ctx.destination);
          snareOsc.type = 'triangle';
          snareOsc.frequency.setValueAtTime(200, ctx.currentTime);
          
          snareGain.gain.setValueAtTime(volume.value * 0.3, ctx.currentTime);
          snareGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          
          // 노이즈 부분 (화이트 노이즈 시뮬레이션)
          const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
          const noiseData = noiseBuffer.getChannelData(0);
          for (let i = 0; i < noiseData.length; i++) {
            noiseData[i] = Math.random() * 2 - 1;
          }
          
          snareNoise.buffer = noiseBuffer;
          snareNoise.connect(noiseGain);
          noiseGain.connect(ctx.destination);
          
          noiseGain.gain.setValueAtTime(volume.value * 0.5, ctx.currentTime);
          noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          
          snareOsc.start();
          snareNoise.start();
          snareOsc.stop(ctx.currentTime + 0.2);
          snareNoise.stop(ctx.currentTime + 0.1);
          break;

        case 'hihat':
          // 하이햇 (칭칭)
          const hihatBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
          const hihatData = hihatBuffer.getChannelData(0);
          for (let i = 0; i < hihatData.length; i++) {
            hihatData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
          }
          
          const hihatSource = ctx.createBufferSource();
          const hihatGain = ctx.createGain();
          const hihatFilter = ctx.createBiquadFilter();
          
          hihatSource.buffer = hihatBuffer;
          hihatSource.connect(hihatFilter);
          hihatFilter.connect(hihatGain);
          hihatGain.connect(ctx.destination);
          
          hihatFilter.type = 'highpass';
          hihatFilter.frequency.setValueAtTime(8000, ctx.currentTime);
          
          hihatGain.gain.setValueAtTime(volume.value * 0.4, ctx.currentTime);
          hihatGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          
          hihatSource.start();
          hihatSource.stop(ctx.currentTime + 0.1);
          break;

        case 'cymbal':
          // 심벌 (챙~)
          const cymbalBuffer = ctx.createBuffer(1, ctx.sampleRate * 1.5, ctx.sampleRate);
          const cymbalData = cymbalBuffer.getChannelData(0);
          for (let i = 0; i < cymbalData.length; i++) {
            cymbalData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.3));
          }
          
          const cymbalSource = ctx.createBufferSource();
          const cymbalGain = ctx.createGain();
          const cymbalFilter = ctx.createBiquadFilter();
          
          cymbalSource.buffer = cymbalBuffer;
          cymbalSource.connect(cymbalFilter);
          cymbalFilter.connect(cymbalGain);
          cymbalGain.connect(ctx.destination);
          
          cymbalFilter.type = 'highpass';
          cymbalFilter.frequency.setValueAtTime(3000, ctx.currentTime);
          
          cymbalGain.gain.setValueAtTime(volume.value * 0.6, ctx.currentTime);
          cymbalGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
          
          cymbalSource.start();
          cymbalSource.stop(ctx.currentTime + 1.5);
          break;

        case 'tom1':
          // 하이톰 (높은 톰)
          const tom1Osc = ctx.createOscillator();
          const tom1Gain = ctx.createGain();
          tom1Osc.connect(tom1Gain);
          tom1Gain.connect(ctx.destination);
          
          tom1Osc.type = 'sine';
          tom1Osc.frequency.setValueAtTime(200, ctx.currentTime);
          tom1Osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.3);
          
          tom1Gain.gain.setValueAtTime(volume.value * 0.6, ctx.currentTime);
          tom1Gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          
          tom1Osc.start();
          tom1Osc.stop(ctx.currentTime + 0.4);
          break;

        case 'tom2':
          // 미드톰 (중간 톰)
          const tom2Osc = ctx.createOscillator();
          const tom2Gain = ctx.createGain();
          tom2Osc.connect(tom2Gain);
          tom2Gain.connect(ctx.destination);
          
          tom2Osc.type = 'sine';
          tom2Osc.frequency.setValueAtTime(150, ctx.currentTime);
          tom2Osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.4);
          
          tom2Gain.gain.setValueAtTime(volume.value * 0.7, ctx.currentTime);
          tom2Gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          
          tom2Osc.start();
          tom2Osc.stop(ctx.currentTime + 0.5);
          break;

        case 'floor-tom':
          // 플로어톰 (낮은 톰)
          const floorOsc = ctx.createOscillator();
          const floorGain = ctx.createGain();
          floorOsc.connect(floorGain);
          floorGain.connect(ctx.destination);
          
          floorOsc.type = 'sine';
          floorOsc.frequency.setValueAtTime(100, ctx.currentTime);
          floorOsc.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6);
          
          floorGain.gain.setValueAtTime(volume.value * 0.8, ctx.currentTime);
          floorGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
          
          floorOsc.start();
          floorOsc.stop(ctx.currentTime + 0.8);
          break;

        case 'ride':
          // 라이드 심벌 (더 부드러운 심벌)
          const rideBuffer = ctx.createBuffer(1, ctx.sampleRate * 2.0, ctx.sampleRate);
          const rideData = rideBuffer.getChannelData(0);
          for (let i = 0; i < rideData.length; i++) {
            rideData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.5));
          }
          
          const rideSource = ctx.createBufferSource();
          const rideGain = ctx.createGain();
          const rideFilter = ctx.createBiquadFilter();
          
          rideSource.buffer = rideBuffer;
          rideSource.connect(rideFilter);
          rideFilter.connect(rideGain);
          rideGain.connect(ctx.destination);
          
          rideFilter.type = 'highpass';
          rideFilter.frequency.setValueAtTime(2000, ctx.currentTime);
          
          rideGain.gain.setValueAtTime(volume.value * 0.4, ctx.currentTime);
          rideGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2.0);
          
          rideSource.start();
          rideSource.stop(ctx.currentTime + 2.0);
          break;
      }

      // 공통 playHistory에 기록 (통계용) 
      playHistory.value.push({ note: `drum_${drumType}`, timestamp: Date.now() });
      // 로컬 기록에도 저장
      localPlayHistory.value.push({ note: `drum_${drumType}`, timestamp: Date.now() });
      console.log('🥁 Playing drum:', drumType);
    } catch (error) {
      console.error('❌ Failed to play drum sound:', error);
    }
  };

  return {
    playHistory: localPlayHistory,
    playDrumSound
  };
}