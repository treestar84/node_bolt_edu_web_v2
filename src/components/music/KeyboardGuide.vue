<template>
  <div class="keyboard-guide">
    <h4>⌨️ 키보드로도 연주할 수 있어요!</h4>
    <div class="key-mappings">
      <div class="key-group">
        <span class="key-title">드럼:</span>
        <span class="key-item">Space (킥)</span>
        <span class="key-item">S (스네어)</span>
        <span class="key-item">H (하이햇)</span>
        <span class="key-item">C (심벌)</span>
      </div>
      <div class="key-group">
        <span class="key-title">톰/라이드:</span>
        <span class="key-item">T (하이톰)</span>
        <span class="key-item">Y (미드톰)</span>
        <span class="key-item">F (플로어톰)</span>
        <span class="key-item">R (라이드)</span>
      </div>
      <div class="key-group">
        <span class="key-title">재미소리:</span>
        <span class="key-item">1~8 (효과음)</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 다크모드 키보드 가이드 */
.keyboard-guide {
  background: 
    linear-gradient(135deg, 
      #1a1a1a, 
      #2d2d2d, 
      #1a1a1a
    );
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.4),
    0 4px 15px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.keyboard-guide h4 {
  margin-bottom: 18px;
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 600;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 4px rgba(255, 255, 255, 0.3);
}

.key-mappings {
  display: flex;
  justify-content: center;
  gap: 40px;
  flex-wrap: wrap;
}

.key-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.key-title {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.85rem;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.7),
    0 0 3px rgba(255, 255, 255, 0.2);
}

.key-item {
  background: 
    linear-gradient(135deg, #2a2a2a, #1a1a1a, #0d0d0d);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 6px 12px;
  font-size: 0.75rem;
  color: #ffffff;
  font-family: 'Comic Sans MS', cursive, sans-serif;
  font-weight: 500;
  box-shadow: 
    0 4px 8px rgba(0, 0, 0, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.1),
    inset 0 -2px 4px rgba(0, 0, 0, 0.2);
  text-shadow: 
    0 1px 2px rgba(0, 0, 0, 0.8),
    0 0 3px rgba(255, 255, 255, 0.2);
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .key-mappings {
    gap: 20px;
  }
}
</style>