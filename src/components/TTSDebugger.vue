<template>
  <div class="tts-debugger" v-if="showDebugger">
    <div class="debug-panel">
      <div class="debug-header">
        <h3>🔊 TTS 디버그 패널</h3>
        <button @click="showDebugger = false" class="close-btn">✕</button>
      </div>
      
      <div class="debug-info">
        <div class="info-section">
          <h4>📊 시스템 정보</h4>
          <div class="info-item">
            <span class="label">브라우저:</span>
            <span class="value">{{ browserInfo }}</span>
          </div>
          <div class="info-item">
            <span class="label">TTS 지원:</span>
            <span class="value" :class="{ supported: ttsSupported, unsupported: !ttsSupported }">
              {{ ttsSupported ? '✅ 지원됨' : '❌ 지원되지 않음' }}
            </span>
          </div>
          <div class="info-item">
            <span class="label">음성 개수:</span>
            <span class="value">{{ voicesCount }}개</span>
          </div>
        </div>

        <div class="info-section">
          <h4>🎤 사용 가능한 음성</h4>
          <div class="voices-list">
            <div v-if="koreanVoices.length > 0" class="voice-group">
              <strong>한국어 음성 ({{ koreanVoices.length }}개):</strong>
              <ul>
                <li v-for="voice in koreanVoices" :key="voice.name">
                  {{ voice.name }} ({{ voice.lang }})
                  <span v-if="voice.default" class="default-badge">기본</span>
                </li>
              </ul>
            </div>
            <div v-else class="no-voices">
              ⚠️ 한국어 음성이 없습니다
            </div>

            <div v-if="englishVoices.length > 0" class="voice-group">
              <strong>영어 음성 ({{ englishVoices.length }}개):</strong>
              <ul>
                <li v-for="voice in englishVoices" :key="voice.name">
                  {{ voice.name }} ({{ voice.lang }})
                  <span v-if="voice.default" class="default-badge">기본</span>
                </li>
              </ul>
            </div>
            <div v-else class="no-voices">
              ⚠️ 영어 음성이 없습니다
            </div>
          </div>
        </div>

        <div class="info-section">
          <h4>🧪 TTS 테스트</h4>
          <div class="test-controls">
            <input 
              v-model="testText" 
              placeholder="테스트할 텍스트 입력" 
              class="test-input"
            />
            <button @click="testTTS" :disabled="isTesting" class="test-btn">
              {{ isTesting ? '테스트 중...' : 'TTS 테스트' }}
            </button>
          </div>
          <div v-if="testResult" class="test-result" :class="testResult.success ? 'success' : 'error'">
            {{ testResult.message }}
          </div>
        </div>

        <div class="info-section">
          <h4>💡 해결 방법</h4>
          <div class="solutions">
            <div v-if="!ttsSupported" class="solution error">
              <strong>❌ TTS가 지원되지 않음</strong>
              <p>이 브라우저는 음성 합성을 지원하지 않습니다. Chrome, Safari, Edge를 사용해보세요.</p>
            </div>
            <div v-else-if="voicesCount === 0" class="solution warning">
              <strong>⚠️ 음성이 없음</strong>
              <div class="solution-steps">
                <p><strong>Windows 사용자:</strong></p>
                <ol>
                  <li>설정 → 시간 및 언어 → 음성</li>
                  <li>"음성 추가" 클릭</li>
                  <li>한국어 음성 다운로드</li>
                </ol>
                <p><strong>Mac 사용자:</strong></p>
                <ol>
                  <li>시스템 환경설정 → 손쉬운 사용</li>
                  <li>음성 → 시스템 음성</li>
                  <li>한국어 음성 설치</li>
                </ol>
              </div>
            </div>
            <div v-else-if="koreanVoices.length === 0" class="solution warning">
              <strong>⚠️ 한국어 음성 없음</strong>
              <p>한국어 TTS 음성팩을 설치해주세요. 시스템 설정에서 추가 언어 음성을 다운로드할 수 있습니다.</p>
            </div>
            <div v-else class="solution success">
              <strong>✅ TTS 정상 작동 가능</strong>
              <p>TTS가 정상적으로 설정되어 있습니다. 위의 테스트 버튼으로 확인해보세요.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const showDebugger = ref(true)
const ttsSupported = ref(false)
const voicesCount = ref(0)
const koreanVoices = ref<any[]>([])
const englishVoices = ref<any[]>([])
const browserInfo = ref('')
const testText = ref('안녕하세요. TTS 테스트입니다.')
const isTesting = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)

onMounted(() => {
  checkTTSSupport()
  getBrowserInfo()
})

const checkTTSSupport = async () => {
  ttsSupported.value = 'speechSynthesis' in window
  
  if (!ttsSupported.value) return

  // 음성 로딩 대기
  await waitForVoices()
  
  const voices = speechSynthesis.getVoices()
  voicesCount.value = voices.length
  
  koreanVoices.value = voices.filter(voice => 
    voice.lang.startsWith('ko') || 
    voice.name.toLowerCase().includes('korean') ||
    voice.name.toLowerCase().includes('yuna') ||
    voice.name.toLowerCase().includes('nayoung')
  )
  
  englishVoices.value = voices.filter(voice => 
    voice.lang.startsWith('en')
  )
}

const waitForVoices = (): Promise<void> => {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve()
    } else {
      const handleVoicesChanged = () => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
        resolve()
      }
      speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged)
      
      // 2초 후 타임아웃
      setTimeout(() => {
        speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged)
        resolve()
      }, 2000)
    }
  })
}

const getBrowserInfo = () => {
  const ua = navigator.userAgent
  if (ua.includes('Chrome')) {
    browserInfo.value = 'Chrome'
  } else if (ua.includes('Safari')) {
    browserInfo.value = 'Safari'
  } else if (ua.includes('Firefox')) {
    browserInfo.value = 'Firefox'
  } else if (ua.includes('Edge')) {
    browserInfo.value = 'Edge'
  } else {
    browserInfo.value = 'Unknown'
  }
}

const testTTS = async () => {
  if (!ttsSupported.value) {
    testResult.value = { success: false, message: 'TTS가 지원되지 않습니다.' }
    return
  }

  isTesting.value = true
  testResult.value = null

  try {
    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(testText.value)
      let hasCompleted = false

      const handleComplete = () => {
        if (hasCompleted) return
        hasCompleted = true
        resolve()
      }

      // 한국어 음성 설정
      const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(testText.value)
      if (isKorean && koreanVoices.value.length > 0) {
        utterance.voice = koreanVoices.value[0]
        utterance.lang = 'ko-KR'
      } else if (!isKorean && englishVoices.value.length > 0) {
        utterance.voice = englishVoices.value[0]
        utterance.lang = 'en-US'
      }

      utterance.rate = 0.8
      utterance.volume = 0.8

      utterance.onend = handleComplete
      utterance.onerror = (error) => {
        console.error('TTS Error:', error)
        handleComplete()
      }

      // 타임아웃 설정
      setTimeout(() => {
        if (!hasCompleted) {
          speechSynthesis.cancel()
          handleComplete()
        }
      }, 10000)

      speechSynthesis.speak(utterance)
    })

    testResult.value = { success: true, message: '✅ TTS 테스트 성공! 음성이 재생되었습니다.' }
  } catch (error) {
    testResult.value = { success: false, message: '❌ TTS 테스트 실패: ' + error }
  } finally {
    isTesting.value = false
  }
}
</script>

<style scoped>
.tts-debugger {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  max-width: 400px;
  max-height: 80vh;
  overflow-y: auto;
}

.debug-panel {
  background: white;
  border: 2px solid #ddd;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  font-size: 14px;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8f9fa;
  padding: 12px 16px;
  border-bottom: 1px solid #ddd;
  border-radius: 12px 12px 0 0;
}

.debug-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #000;
}

.debug-info {
  padding: 16px;
}

.info-section {
  margin-bottom: 20px;
}

.info-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #555;
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.label {
  font-weight: 500;
  color: #666;
}

.value {
  font-weight: 600;
}

.value.supported {
  color: #22c55e;
}

.value.unsupported {
  color: #ef4444;
}

.voices-list {
  font-size: 13px;
}

.voice-group {
  margin-bottom: 12px;
}

.voice-group ul {
  margin: 8px 0 0 0;
  padding-left: 16px;
}

.voice-group li {
  margin-bottom: 4px;
}

.default-badge {
  background: #3b82f6;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  margin-left: 8px;
}

.no-voices {
  color: #f59e0b;
  font-style: italic;
}

.test-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.test-input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
}

.test-btn {
  padding: 8px 16px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.test-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.test-result {
  padding: 8px;
  border-radius: 6px;
  font-size: 13px;
}

.test-result.success {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.test-result.error {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.solutions {
  font-size: 13px;
}

.solution {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
}

.solution.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
}

.solution.warning {
  background: #fffbeb;
  border: 1px solid #fed7aa;
  color: #d97706;
}

.solution.success {
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.solution-steps ol {
  margin: 8px 0;
  padding-left: 16px;
}

.solution-steps li {
  margin-bottom: 4px;
}

.solution strong {
  display: block;
  margin-bottom: 8px;
}
</style>