<template>
  <div class="tts-test-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1>🔊 TTS 테스트 페이지</h1>
          <p>크롬에서 TTS가 작동하지 않을 때 이 페이지에서 진단해보세요</p>
        </div>

        <div class="test-section">
          <h2>빠른 TTS 테스트</h2>
          <div class="quick-test">
            <input 
              v-model="quickTestText" 
              placeholder="테스트할 텍스트를 입력하세요"
              class="test-input"
              @keyup.enter="quickTest"
            />
            <button @click="quickTest" :disabled="isQuickTesting" class="test-btn">
              {{ isQuickTesting ? '테스트 중...' : 'TTS 테스트' }}
            </button>
          </div>
          
          <div v-if="quickTestResult" class="test-result" :class="quickTestResult.type">
            {{ quickTestResult.message }}
          </div>
        </div>

        <div class="audio-test-section">
          <h2>오디오 시스템 테스트</h2>
          <div class="audio-controls">
            <button @click="testAudioUnlock" class="audio-btn">
              오디오 잠금 해제 테스트
            </button>
            <button @click="diagnoseTTS" class="audio-btn">
              TTS 진단 실행
            </button>
            <button @click="showDebugPanel = !showDebugPanel" class="audio-btn">
              {{ showDebugPanel ? '디버그 패널 숨기기' : '디버그 패널 보기' }}
            </button>
          </div>
        </div>

        <div class="common-issues">
          <h2>크롬에서 TTS가 안 될 때 해결방법</h2>
          <div class="issue-list">
            <div class="issue-item">
              <h3>1. 시스템 TTS 음성 설치</h3>
              <div class="issue-content">
                <p><strong>Windows:</strong></p>
                <ol>
                  <li>설정 → 시간 및 언어 → 음성</li>
                  <li>"음성 추가" 클릭</li>
                  <li>한국어(대한민국) 선택하여 다운로드</li>
                </ol>
                <p><strong>Mac:</strong></p>
                <ol>
                  <li>시스템 환경설정 → 손쉬운 사용 → 음성</li>
                  <li>"시스템 음성" 클릭</li>
                  <li>한국어 음성 다운로드</li>
                </ol>
              </div>
            </div>

            <div class="issue-item">
              <h3>2. 크롬 TTS 설정 확인</h3>
              <div class="issue-content">
                <ol>
                  <li>chrome://settings/accessibility 접속</li>
                  <li>"텍스트 음성 변환 사용" 체크</li>
                  <li>크롬 재시작</li>
                </ol>
              </div>
            </div>

            <div class="issue-item">
              <h3>3. 사용자 상호작용 필요</h3>
              <div class="issue-content">
                <p>크롬은 사용자가 클릭/터치한 후에만 TTS 실행을 허용합니다.</p>
                <p>페이지를 로드한 후 반드시 화면을 한 번 클릭해야 합니다.</p>
              </div>
            </div>

            <div class="issue-item">
              <h3>4. 대안 솔루션</h3>
              <div class="issue-content">
                <p>TTS가 계속 작동하지 않으면:</p>
                <ul>
                  <li>Edge 브라우저 사용 (Windows TTS 엔진 직접 지원)</li>
                  <li>Safari 사용 (Mac에서 가장 안정적)</li>
                  <li>외부 TTS API 사용 (Google Cloud TTS, AWS Polly 등)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- TTS 디버거 컴포넌트 -->
    <TTSDebugger v-if="showDebugPanel" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Navigation from '@/components/Navigation.vue'
import TTSDebugger from '@/components/TTSDebugger.vue'
import { useAudio } from '@/composables/useAudio'

const { diagnoseTTS, testTTS, unlockAudio, activateTTSOnUserInteraction } = useAudio()

const quickTestText = ref('안녕하세요! TTS 테스트입니다.')
const isQuickTesting = ref(false)
const quickTestResult = ref<{ type: string; message: string } | null>(null)
const showDebugPanel = ref(false)

const quickTest = async () => {
  if (!quickTestText.value.trim()) return

  isQuickTesting.value = true
  quickTestResult.value = null

  try {
    await testTTS(quickTestText.value)
    quickTestResult.value = {
      type: 'success',
      message: '✅ TTS 테스트 성공! 음성이 재생되었습니다.'
    }
  } catch (error) {
    quickTestResult.value = {
      type: 'error',
      message: `❌ TTS 테스트 실패: ${error}`
    }
  } finally {
    isQuickTesting.value = false
  }
}

const testAudioUnlock = async () => {
  try {
    await unlockAudio()
    quickTestResult.value = {
      type: 'success',
      message: '✅ 오디오 잠금 해제 성공!'
    }
  } catch (error) {
    quickTestResult.value = {
      type: 'error',
      message: `❌ 오디오 잠금 해제 실패: ${error}`
    }
  }
}

// 페이지 로드 시 TTS 활성화 리스너 설정
activateTTSOnUserInteraction()
</script>

<style scoped>
.tts-test-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  padding: 40px 0;
}

.page-header {
  text-align: center;
  margin-bottom: 40px;
}

.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

.page-header p {
  font-size: 1.1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.test-section,
.audio-test-section {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: var(--shadow-card);
}

.test-section h2,
.audio-test-section h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 20px;
}

.quick-test {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.test-input {
  flex: 1;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
}

.test-btn,
.audio-btn {
  padding: 12px 24px;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 500;
  transition: background 0.2s;
  white-space: nowrap;
}

.test-btn:hover,
.audio-btn:hover {
  background: var(--color-primary-hover);
}

.test-btn:disabled {
  background: var(--color-border);
  cursor: not-allowed;
}

.audio-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.test-result {
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
}

.test-result.success {
  background: var(--color-success-bg);
  color: var(--color-success);
  border: 1px solid var(--color-success-border);
}

.test-result.error {
  background: var(--color-error-bg);
  color: var(--color-error);
  border: 1px solid var(--color-error-border);
}

.common-issues {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-card);
}

.common-issues h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 24px;
}

.issue-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.issue-item {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}

.issue-item h3 {
  background: var(--color-bg-secondary);
  padding: 16px;
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--color-text-primary);
  border-bottom: 1px solid var(--color-border);
}

.issue-content {
  padding: 16px;
  color: var(--color-text-secondary);
}

.issue-content p {
  margin-bottom: 12px;
  font-weight: 500;
}

.issue-content ol,
.issue-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.issue-content li {
  margin-bottom: 8px;
  line-height: 1.5;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 20px 0;
  }
  
  .page-header h1 {
    font-size: 2rem;
  }
  
  .quick-test {
    flex-direction: column;
  }
  
  .audio-controls {
    flex-direction: column;
  }
  
  .test-btn,
  .audio-btn {
    width: 100%;
  }
}
</style>