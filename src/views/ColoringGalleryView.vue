<template>
  <div class="coloring-gallery-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <!-- 페이지 헤더 -->
        <div class="page-header">
          <h1 class="page-title">🎨 나의 색칠 갤러리</h1>
          <p class="page-description">
            내가 색칠한 예쁜 작품들을 구경해보세요!
          </p>
        </div>

        <!-- 로그인 필요 메시지 -->
        <div v-if="!gallery.isAuthenticated.value" class="auth-required">
          <div class="auth-icon">🔐</div>
          <h3>로그인이 필요해요</h3>
          <p>색칠한 작품을 저장하고 보려면 먼저 로그인해주세요.</p>
          <router-link to="/auth/login" class="btn btn-primary">
            로그인하기
          </router-link>
        </div>

        <!-- 갤러리 콘텐츠 -->
        <div v-else>
          <!-- 통계 섹션 -->
          <div v-if="gallery.stats.value" class="stats-section">
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-icon">🖼️</div>
                <div class="stat-info">
                  <div class="stat-number">{{ gallery.stats.value.totalArtworks }}</div>
                  <div class="stat-label">총 작품 수</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">🎯</div>
                <div class="stat-info">
                  <div class="stat-number">{{ gallery.stats.value.avgCompletionRate }}%</div>
                  <div class="stat-label">평균 완성도</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">🎨</div>
                <div class="stat-info">
                  <div class="stat-number">{{ gallery.stats.value.uniqueWordsColored }}</div>
                  <div class="stat-label">색칠한 단어</div>
                </div>
              </div>
              
              <div class="stat-card">
                <div class="stat-icon">💾</div>
                <div class="stat-info">
                  <div class="stat-number">{{ gallery.remainingSlots.value }}/10</div>
                  <div class="stat-label">저장 가능</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 작품 갤러리 -->
          <div class="gallery-section">
            <!-- 로딩 상태 -->
            <div v-if="gallery.isLoading.value" class="loading-state">
              <div class="loading-spinner"></div>
              <p>작품을 불러오는 중...</p>
            </div>

            <!-- 에러 상태 -->
            <div v-else-if="gallery.error.value" class="error-state">
              <div class="error-icon">⚠️</div>
              <h3>오류가 발생했어요</h3>
              <p>{{ gallery.error.value }}</p>
              <button @click="gallery.refresh()" class="btn btn-secondary">
                다시 시도
              </button>
            </div>

            <!-- 빈 상태 -->
            <div v-else-if="gallery.isEmpty.value" class="empty-state">
              <div class="empty-icon">🎨</div>
              <h3>아직 색칠한 작품이 없어요</h3>
              <p>색칠공부를 시작해서 예쁜 작품을 만들어보세요!</p>
              <router-link to="/coloring" class="btn btn-primary">
                색칠하러 가기
              </router-link>
            </div>

            <!-- 작품 그리드 -->
            <div v-else class="artworks-grid">
              <div 
                v-for="artwork in gallery.artworks.value" 
                :key="artwork.id"
                class="artwork-card"
                @click="selectArtwork(artwork)"
              >
                <div class="artwork-image">
                  <img 
                    :src="artwork.artworkData" 
                    :alt="`${artwork.wordName} 색칠 작품`"
                    loading="lazy"
                  />
                  <div class="artwork-overlay">
                    <button @click.stop="deleteArtwork(artwork)" class="delete-btn">
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div class="artwork-info">
                  <h3 class="artwork-title">{{ artwork.wordName }}</h3>
                  <div class="artwork-meta">
                    <div class="completion-badge" :class="getCompletionClass(artwork.completionPercentage)">
                      {{ artwork.completionPercentage }}% 완성
                    </div>
                    <div class="artwork-date">
                      {{ formatDate(artwork.createdAt) }}
                    </div>
                  </div>
                  <div class="artwork-stats">
                    <span class="stat-item">
                      🎨 {{ artwork.colorsUsed.length }}색
                    </span>
                    <span class="stat-item">
                      🖌️ {{ artwork.brushStrokes }}획
                    </span>
                    <span class="stat-item">
                      ⏰ {{ formatTime(artwork.timeSpentSeconds) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 페이지네이션 -->
            <div v-if="gallery.totalPages.value > 1" class="pagination">
              <button 
                @click="gallery.prevPage()" 
                :disabled="!gallery.hasPrevPage.value"
                class="pagination-btn"
              >
                ← 이전
              </button>
              
              <div class="page-numbers">
                <button
                  v-for="page in getVisiblePages()"
                  :key="page"
                  @click="gallery.goToPage(page)"
                  :class="['page-btn', { active: page === gallery.currentPage.value }]"
                >
                  {{ page }}
                </button>
              </div>
              
              <button 
                @click="gallery.nextPage()" 
                :disabled="!gallery.hasNextPage.value"
                class="pagination-btn"
              >
                다음 →
              </button>
            </div>
          </div>
        </div>

        <!-- 작품 상세 모달 -->
        <div v-if="selectedArtwork" class="artwork-modal" @click="closeModal">
          <div class="modal-content" @click.stop>
            <button @click="closeModal" class="modal-close">×</button>
            
            <div class="modal-header">
              <h2>{{ selectedArtwork.wordName }} 작품</h2>
              <div class="modal-meta">
                <span class="completion-badge" :class="getCompletionClass(selectedArtwork.completionPercentage)">
                  {{ selectedArtwork.completionPercentage }}% 완성
                </span>
                <span class="creation-date">
                  {{ formatDate(selectedArtwork.createdAt) }}
                </span>
              </div>
            </div>
            
            <div class="modal-artwork">
              <img 
                :src="selectedArtwork.artworkData" 
                :alt="`${selectedArtwork.wordName} 색칠 작품`"
              />
            </div>
            
            <div class="modal-stats">
              <div class="stat-row">
                <span class="stat-label">사용한 색상:</span>
                <div class="color-swatches">
                  <div 
                    v-for="color in selectedArtwork.colorsUsed" 
                    :key="color"
                    class="color-swatch"
                    :style="{ backgroundColor: color }"
                    :title="color"
                  ></div>
                </div>
              </div>
              <div class="stat-row">
                <span class="stat-label">브러쉬 획 수:</span>
                <span class="stat-value">{{ selectedArtwork.brushStrokes }}획</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">색칠 시간:</span>
                <span class="stat-value">{{ formatTime(selectedArtwork.timeSpentSeconds) }}</span>
              </div>
            </div>
            
            <div class="modal-actions">
              <button @click="downloadArtwork(selectedArtwork)" class="btn btn-secondary">
                다운로드
              </button>
              <button @click="shareArtwork(selectedArtwork)" class="btn btn-primary">
                공유하기
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import Navigation from '@/components/Navigation.vue';
import { useColoringGallery } from '@/composables/useColoringGallery';
import type { ColoringArtwork } from '@/types';

const gallery = useColoringGallery();
const selectedArtwork = ref<ColoringArtwork | null>(null);

// 작품 선택
const selectArtwork = (artwork: ColoringArtwork) => {
  selectedArtwork.value = artwork;
};

// 모달 닫기
const closeModal = () => {
  selectedArtwork.value = null;
};

// 작품 삭제
const deleteArtwork = async (artwork: ColoringArtwork) => {
  if (!confirm(`"${artwork.wordName}" 작품을 정말 삭제하시겠어요?`)) {
    return;
  }
  
  const success = await gallery.deleteArtwork(artwork.id);
  if (success) {
    console.log('✅ Artwork deleted successfully');
  }
};

// 완성도에 따른 CSS 클래스
const getCompletionClass = (percentage: number): string => {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 50) return 'good';
  if (percentage >= 20) return 'fair';
  return 'basic';
};

// 날짜 포매팅
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return '오늘';
  if (days === 1) return '어제';
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
};

// 시간 포매팅
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${seconds}초`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}분 ${remainingSeconds}초` : `${minutes}분`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}시간 ${remainingMinutes}분`;
};

// 표시할 페이지 번호들
const getVisiblePages = (): number[] => {
  const totalPages = gallery.totalPages.value;
  const currentPage = gallery.currentPage.value;
  const pages: number[] = [];
  
  if (totalPages <= 7) {
    // 총 페이지가 7개 이하면 모든 페이지 표시
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // 현재 페이지 기준으로 앞뒤 2페이지씩 표시
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
  }
  
  return pages;
};

// 작품 다운로드
const downloadArtwork = (artwork: ColoringArtwork) => {
  const link = document.createElement('a');
  link.download = `${artwork.wordName}_색칠작품_${formatDate(artwork.createdAt)}.png`;
  link.href = artwork.artworkData;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  console.log('📥 Artwork downloaded:', artwork.wordName);
};

// 작품 공유
const shareArtwork = async (artwork: ColoringArtwork) => {
  // Web Share API 사용 (모바일에서 지원)
  if (navigator.share) {
    try {
      const response = await fetch(artwork.artworkData);
      const blob = await response.blob();
      const file = new File([blob], `${artwork.wordName}_색칠작품.png`, { 
        type: 'image/png' 
      });
      
      await navigator.share({
        title: `${artwork.wordName} 색칠 작품`,
        text: `내가 색칠한 ${artwork.wordName} 작품을 봐주세요! ${artwork.completionPercentage}% 완성했어요.`,
        files: [file]
      });
      
      console.log('📤 Artwork shared successfully');
    } catch (error) {
      console.error('Share failed:', error);
      downloadArtwork(artwork); // 공유 실패시 다운로드로 대체
    }
  } else {
    downloadArtwork(artwork); // Web Share API 미지원시 다운로드로 대체
  }
};

// 초기화
onMounted(async () => {
  console.log('🖼️ ColoringGalleryView mounted');
  await gallery.initialize();
});
</script>

<style scoped>
.coloring-gallery-view {
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

.page-title {
  font-size: 2.25rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--color-text-primary);
  letter-spacing: -0.025em;
}

.page-description {
  font-size: 1rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* 인증 필요 섹션 */
.auth-required {
  text-align: center;
  padding: 60px 20px;
  background: var(--color-bg-card);
  border-radius: 16px;
  border: 1px solid var(--color-border);
  max-width: 500px;
  margin: 0 auto;
}

.auth-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.auth-required h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}

.auth-required p {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}

/* 통계 섹션 */
.stats-section {
  margin-bottom: 40px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-card);
}

.stat-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-primary);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* 로딩/에러/빈 상태 */
.loading-state,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 20px;
  background: var(--color-bg-card);
  border-radius: 16px;
  border: 1px solid var(--color-border);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon,
.empty-icon {
  font-size: 4rem;
  margin-bottom: 20px;
}

.error-state h3,
.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 12px;
  color: var(--color-text-primary);
}

.error-state p,
.empty-state p {
  color: var(--color-text-secondary);
  margin-bottom: 24px;
  line-height: 1.6;
}

/* 작품 그리드 */
.artworks-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.artwork-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: var(--shadow-card);
}

.artwork-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-dark);
}

.artwork-image {
  position: relative;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.artwork-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s ease;
}

.artwork-card:hover .artwork-image img {
  transform: scale(1.05);
}

.artwork-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.artwork-card:hover .artwork-overlay {
  opacity: 1;
}

.delete-btn {
  background: rgba(239, 68, 68, 0.9);
  border: none;
  border-radius: 8px;
  color: white;
  padding: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 1);
  transform: scale(1.1);
}

.artwork-info {
  padding: 16px;
}

.artwork-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.artwork-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.completion-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.completion-badge.excellent {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
}

.completion-badge.good {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.completion-badge.fair {
  background: rgba(245, 158, 11, 0.1);
  color: var(--color-warning);
}

.completion-badge.basic {
  background: rgba(107, 114, 128, 0.1);
  color: var(--color-text-secondary);
}

.artwork-date {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.artwork-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stat-item {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  background: var(--color-bg-secondary);
  padding: 2px 6px;
  border-radius: 6px;
}

/* 페이지네이션 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin-top: 40px;
}

.pagination-btn,
.page-btn {
  padding: 8px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-card);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.pagination-btn:hover:not(:disabled),
.page-btn:hover {
  border-color: var(--color-primary);
  background: rgba(59, 130, 246, 0.1);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-btn.active {
  background: var(--color-primary);
  color: var(--color-bg-primary);
  border-color: var(--color-primary);
}

.page-numbers {
  display: flex;
  gap: 4px;
}

/* 작품 상세 모달 */
.artwork-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: 16px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  z-index: 1;
}

.modal-close:hover {
  color: var(--color-text-primary);
}

.modal-header {
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
  padding-right: 40px;
}

.modal-meta {
  display: flex;
  gap: 12px;
  align-items: center;
}

.creation-date {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.modal-artwork {
  padding: 16px 24px;
}

.modal-artwork img {
  width: 100%;
  border-radius: 8px;
  box-shadow: var(--shadow-md);
}

.modal-stats {
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
}

.stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--color-border-light);
}

.stat-row:last-child {
  border-bottom: none;
}

.stat-label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.stat-value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.color-swatches {
  display: flex;
  gap: 4px;
}

.color-swatch {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 1px solid var(--color-border);
}

.modal-actions {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .main-content {
    padding: 20px 0;
  }
  
  .page-title {
    font-size: 1.75rem;
  }
  
  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
  }
  
  .stat-card {
    flex-direction: column;
    text-align: center;
    gap: 8px;
  }
  
  .stat-icon {
    font-size: 2rem;
  }
  
  .artworks-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }
  
  .artwork-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .modal-actions {
    flex-direction: column;
  }
}

@media (max-width: 480px) {
  .artworks-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr 1fr;
  }
  
  .pagination {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .page-numbers {
    order: -1;
    width: 100%;
    justify-content: center;
  }
}
</style>