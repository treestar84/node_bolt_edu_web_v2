<template>
  <div class="admin-books">
    <AdminHeader />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">책 관리</h1>
          <div class="header-actions">
            <div class="admin-type-indicator" v-if="isSystemAdmin">
              <span class="admin-badge">시스템 관리자</span>
            </div>
            <button @click="showAddModal = true" class="btn btn-primary">
              <span>➕</span>
              새 책 추가
            </button>
            <button @click="generateTestVideo" class="btn btn-secondary" :disabled="isGeneratingTest">
              <span>🎬</span>
              {{ isGeneratingTest ? '생성 중...' : '테스트 비디오 생성' }}
            </button>
          </div>
        </div>

        <div class="books-grid" v-if="store.currentBooks.length > 0">
          <div 
            v-for="book in store.currentBooks" 
            :key="book.id"
            class="book-card"
          >
            <div class="book-cover">
              <!-- 비디오 모드인 경우 비디오 미리보기 -->
              <template v-if="book.isVideoMode && book.videoUrl">
                <video 
                  :ref="'admin-video-' + book.id"
                  :data-video-id="book.id"
                  :src="getImageUrl(book.videoUrl)" 
                  :poster="book.coverImage ? getImageUrl(book.coverImage) : undefined"
                  class="book-video"
                  muted
                  loop
                  preload="metadata"
                  @canplay="onVideoCanPlay"
                  @error="onVideoError"  
                  @mouseenter="handleAdminVideoHover(book, true)"
                  @mouseleave="handleAdminVideoHover(book, false)"
                >
                  비디오를 지원하지 않는 브라우저입니다.
                </video>
                <div class="video-overlay">
                  <span class="video-icon">🎬</span>
                  <span class="video-label">영상</span>
                </div>
              </template>
              <!-- 일반 이미지 모드 -->
              <template v-else>
                <img 
                  v-if="book.coverImage" 
                  :src="getImageUrl(book.coverImage)" 
                  :alt="book.title" 
                />
                <div v-else class="no-cover-placeholder">
                  <span class="placeholder-icon">📖</span>
                  <p class="placeholder-text">{{ book.title }}</p>
                </div>
              </template>
              
              <div class="book-overlay">
                <div class="book-meta">
                  <span v-if="book.isVideoMode" class="page-count video-mode">영상</span>
                  <span v-else class="page-count">{{ book.pages.length }}장</span>
                  <span class="age-range">{{ book.minAge }}-{{ book.maxAge }}세</span>
                  <span v-if="isSystemAdmin" class="owner-tag" :class="book.ownerType">
                    {{ book.ownerType === 'global' ? '공용' : '개인' }}
                  </span>
                </div>
              </div>
            </div>
            <div class="book-info">
              <h3 class="book-title">{{ book.title }}</h3>
              <div class="book-actions">
                <button @click="editBook(book)" class="btn btn-sm btn-secondary">
                  수정
                </button>
                <button @click="deleteBookConfirm(book)" class="btn btn-sm btn-danger">
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📖</div>
          <h3>등록된 책이 없습니다</h3>
          <p>첫 번째 그림책을 추가해보세요</p>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ showAddModal ? '새 책 추가' : '책 수정' }}</h2>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <form @submit.prevent="saveBook" class="modal-form">
          <div class="basic-info-section">
            <h3 class="section-title">기본 정보</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">책 제목</label>
                <input 
                  v-model="formData.title" 
                  type="text" 
                  class="form-input" 
                  placeholder="예: 동물 친구들"
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">적정 나이</label>
                <div class="age-inputs">
                  <select v-model.number="formData.minAge" class="form-input" required>
                    <option value="3">3세</option>
                    <option value="4">4세</option>
                    <option value="5">5세</option>
                    <option value="6">6세</option>
                  </select>
                  <span class="age-separator">~</span>
                  <select v-model.number="formData.maxAge" class="form-input" required>
                    <option value="3">3세</option>
                    <option value="4">4세</option>
                    <option value="5">5세</option>
                    <option value="6">6세</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">
                표지 이미지
                <span v-if="uploadMode === 'video'" class="optional-label">(선택사항 - 영상에서 자동 생성됨)</span>
              </label>
              <FileUploadInput
                v-model="formData.coverImage"
                label="표지 이미지"
                placeholder="https://example.com/cover.jpg"
                file-type="image"
                :required="uploadMode !== 'video'"
              />
            </div>

            <!-- 시스템 관리자만 소유권 선택 가능 -->
            <div v-if="isSystemAdmin" class="form-group">
              <label class="form-label">소유권 설정</label>
              <div class="ownership-options">
                <label class="radio-option">
                  <input 
                    type="radio" 
                    v-model="formData.ownerType" 
                    value="global"
                    name="ownerType"
                  />
                  <span class="radio-text">
                    <strong>공용</strong> - 모든 사용자에게 표시
                  </span>
                </label>
                <label class="radio-option">
                  <input 
                    type="radio" 
                    v-model="formData.ownerType" 
                    value="user"
                    name="ownerType"
                  />
                  <span class="radio-text">
                    <strong>개인</strong> - 나만 볼 수 있음
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div class="upload-mode-section">
            <h3 class="section-title">콘텐츠 입력 방식</h3>
            <div class="upload-mode-options">
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="uploadMode" 
                  value="traditional"
                  name="uploadMode"
                />
                <span class="radio-text">
                  <strong>개별 업로드</strong> - 각 페이지의 이미지와 음성을 개별 등록
                </span>
              </label>
              <label class="radio-option">
                <input 
                  type="radio" 
                  v-model="uploadMode" 
                  value="video"
                  name="uploadMode"
                />
                <span class="radio-text">
                  <strong>영상 업로드</strong> - 전체 스토리를 하나의 영상으로 등록
                </span>
              </label>
            </div>
          </div>

          <!-- Traditional Upload Mode -->
          <div v-if="uploadMode === 'traditional'" class="pages-section">
            <h3 class="section-title">책 페이지 (4장)</h3>
            
            <div class="pages-container">
              <div 
                v-for="(page, index) in formData.pages" 
                :key="index"
                class="page-form-card"
              >
                <h4 class="page-title">{{ index + 1 }}장</h4>
                
                <div class="page-form-content">
                  <div class="page-form-row">
                    <div class="form-group">
                      <label class="form-label">이미지</label>
                      <FileUploadInput
                        v-model="page.imageUrl"
                        label="페이지 이미지"
                        placeholder="https://example.com/page1.jpg"
                        file-type="image"
                        :required="false"
                      />
                    </div>

                    <div class="form-group">
                      <label class="form-label">음성</label>
                      <FileUploadInput
                        v-model="page.audioUrl"
                        label="페이지 음성"
                        placeholder="/audio/book1-page1.mp3"
                        file-type="audio"
                        :required="false"
                      />
                    </div>
                  </div>

                  <div class="form-group">
                    <label class="form-label">텍스트 (선택사항)</label>
                    <textarea 
                      v-model="page.textContent" 
                      class="form-input textarea"
                      placeholder="예: 귀여운 고양이가 있어요"
                      rows="2"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Video Upload Mode -->
          <div v-else-if="uploadMode === 'video'" class="video-section">
            <h3 class="section-title">스토리 영상</h3>
            <div class="video-upload-area">
              <FileUploadInput
                v-model="formData.videoUrl"
                label="스토리 영상"
                placeholder="MP4, AVI, MOV 파일을 업로드하세요"
                file-type="video"
                :required="true"
              />
              
              <!-- 썸네일 생성 상태 표시 -->
              <div v-if="isThumbnailGenerating" class="thumbnail-generating">
                <div class="generating-indicator">
                  <div class="spinner"></div>
                  <p>영상에서 썸네일을 자동 생성하는 중...</p>
                </div>
              </div>
              
              <!-- 썸네일 생성 완료 표시 -->
              <div v-else-if="formData.videoUrl && formData.coverImage" class="thumbnail-generated">
                <div class="success-indicator">
                  <span class="success-icon">✅</span>
                  <p>썸네일이 자동으로 생성되었습니다!</p>
                </div>
                <div class="thumbnail-preview">
                  <img :src="getImageUrl(formData.coverImage)" alt="생성된 썸네일" class="generated-thumbnail" />
                </div>
              </div>
              
              <div class="video-description">
                <p class="upload-tip">💡 <strong>영상 업로드 팁:</strong></p>
                <ul class="tip-list">
                  <li>전체 스토리를 포함한 하나의 영상 파일을 업로드하세요</li>
                  <li>영상 업로드 시 첫 번째 프레임에서 <strong>썸네일이 자동 생성</strong>됩니다</li>
                  <li>권장 해상도: 1280x720 (HD) 이상</li>
                  <li>지원 형식: MP4, AVI, MOV, WMV, WebM</li>
                  <li>최대 파일 크기: 200MB</li>
                </ul>
              </div>
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              취소
            </button>
            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? '저장 중...' : (showAddModal ? '추가' : '수정') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>책 삭제</h2>
          <button @click="showDeleteModal = false" class="modal-close">×</button>
        </div>
        
        <div class="delete-content">
          <p>정말로 "<strong>{{ bookToDelete?.title }}</strong>" 책을 삭제하시겠습니까?</p>
          <p class="delete-warning">이 작업은 되돌릴 수 없습니다.</p>
        </div>

        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            취소
          </button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="isLoading">
            {{ isLoading ? '삭제 중...' : '삭제' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import AdminHeader from '@/components/AdminHeader.vue';
import FileUploadInput from '@/components/FileUploadInput.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useVideoThumbnail } from '@/composables/useVideoThumbnail';
import type { Book } from '@/types';

const store = useAppStore();
const authStore = useAuthStore();
const { generateThumbnail, uploadThumbnail, isGenerating: isThumbnailGenerating } = useVideoThumbnail();

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const editingBook = ref<Book | null>(null);
const bookToDelete = ref<Book | null>(null);
const isLoading = ref(false);
const error = ref('');
const isGeneratingTest = ref(false);

// 시스템 관리자 여부 확인
const isSystemAdmin = computed(() => {
  return authStore.userProfile?.userType === 'teacher' || authStore.userProfile?.userType === 'director';
});

const createEmptyPage = () => reactive({
  imageUrl: '',
  audioUrl: '',
  textContent: ''
});

const uploadMode = ref<'traditional' | 'video'>('traditional');

const formData = reactive({
  title: '',
  coverImage: '',
  minAge: 3,
  maxAge: 6,
  ownerType: 'user' as 'global' | 'user',
  videoUrl: '', // 영상 모드용
  pages: reactive([
    createEmptyPage(),
    createEmptyPage(),
    createEmptyPage(),
    createEmptyPage()
  ])
});


const resetForm = () => {
  uploadMode.value = 'traditional';
  formData.title = '';
  formData.coverImage = '';
  formData.minAge = 3;
  formData.maxAge = 6;
  formData.ownerType = isSystemAdmin.value ? 'global' : 'user';
  formData.videoUrl = '';
  formData.pages = reactive([
    createEmptyPage(),
    createEmptyPage(),
    createEmptyPage(),
    createEmptyPage()
  ]);
  error.value = '';
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  editingBook.value = null;
  resetForm();
};

const editBook = (book: Book) => {
  editingBook.value = book;
  formData.title = book.title;
  formData.coverImage = book.coverImage;
  formData.minAge = book.minAge;
  formData.maxAge = book.maxAge;
  formData.ownerType = book.ownerType;
  
  // 영상 모드인지 개별 페이지 모드인지 판단
  if (book.videoUrl) {
    uploadMode.value = 'video';
    formData.videoUrl = book.videoUrl;
  } else {
    uploadMode.value = 'traditional';
    formData.pages = book.pages.map(page =>
      reactive({
        imageUrl: page.imageUrl,
        audioUrl: page.audioUrl,
        textContent: page.textContent || ''
      })
    );
    while (formData.pages.length < 4) {
      formData.pages.push(createEmptyPage());
    }
  }
  
  error.value = '';
  showEditModal.value = true;
};

// 테스트 비디오 생성 함수
const generateTestVideo = async () => {
  if (isGeneratingTest.value) return;
  
  try {
    isGeneratingTest.value = true;
    error.value = '';
    
    const response = await fetch('/api/test/video', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': import.meta.env.VITE_API_KEY
      },
      body: JSON.stringify({
        title: `테스트 비디오 ${new Date().toLocaleTimeString()}`,
        createBook: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ 테스트 비디오 생성 성공:', result.data);
      
      // 책 목록 새로고침
      await store.loadBooks();
      
      // 성공 메시지 표시 (간단한 alert)
      alert(`테스트 비디오가 생성되었습니다!
제목: ${result.data.video.title}
크기: ${result.data.video.size} bytes
URL: ${result.data.video.url}`);
    } else {
      throw new Error(result.message || '테스트 비디오 생성 실패');
    }
  } catch (err) {
    console.error('❌ 테스트 비디오 생성 에러:', err);
    const errorMessage = err instanceof Error ? err.message : String(err);
    error.value = `테스트 비디오 생성 실패: ${errorMessage}`;
  } finally {
    isGeneratingTest.value = false;
  }
};

const saveBook = async () => {
  if (formData.minAge > formData.maxAge) {
    error.value = '최소 나이는 최대 나이보다 작거나 같아야 합니다.';
    return;
  }

  // 영상 모드에서는 영상 파일이 필수
  if (uploadMode.value === 'video' && !formData.videoUrl) {
    error.value = '영상 파일을 업로드해주세요.';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    let bookData;

    if (uploadMode.value === 'video') {
      // 영상 모드
      bookData = {
        title: formData.title,
        coverImage: formData.coverImage,
        minAge: formData.minAge,
        maxAge: formData.maxAge,
        ownerType: formData.ownerType,
        ownerId: formData.ownerType === 'user' ? authStore.user?.id : undefined,
        videoUrl: formData.videoUrl,
        isVideoMode: true,
        pages: [] // 영상 모드에서는 빈 페이지 배열
      };
    } else {
      // 개별 업로드 모드
      // undefined/null → '' 강제 보정
      formData.pages.forEach(page => {
        if (page.imageUrl == null) page.imageUrl = '';
        if (page.audioUrl == null) page.audioUrl = '';
      });

      const pagesData = formData.pages.map((page, index) => ({
        id: `${Date.now()}-${index}`,
        bookId: '', // Will be set by the store
        pageNumber: index + 1,
        imageUrl: page.imageUrl,
        audioUrl: page.audioUrl,
        textContent: page.textContent || null
      }));

      bookData = {
        title: formData.title,
        coverImage: formData.coverImage,
        minAge: formData.minAge,
        maxAge: formData.maxAge,
        ownerType: formData.ownerType,
        ownerId: formData.ownerType === 'user' ? authStore.user?.id : undefined,
        isVideoMode: false,
        pages: pagesData
      };
    }

    if (showAddModal.value) {
      await store.addBook(bookData as Omit<Book, 'id'>);
      console.log('✅ Book added successfully');
    } else if (showEditModal.value && editingBook.value) {
      await store.updateBook(editingBook.value.id, bookData as Partial<Book>);
      console.log('✅ Book updated successfully');
    }
    
    closeModals();
  } catch (err: any) {
    console.error('❌ Error saving book:', err);
    error.value = err.message || '저장 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const deleteBookConfirm = (book: Book) => {
  bookToDelete.value = book;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!bookToDelete.value) return;

  isLoading.value = true;
  
  try {
    await store.deleteBook(bookToDelete.value.id);
    console.log('✅ Book deleted successfully');
    showDeleteModal.value = false;
    bookToDelete.value = null;
  } catch (err: any) {
    console.error('❌ Error deleting book:', err);
    error.value = err.message || '삭제 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // 페이지 로드 시 최신 데이터 가져오기
  console.log('🔄 Loading books data...');
  await store.loadBooks();
  
  // 폼 초기값 설정
  resetForm();
});

// 영상에서 썸네일을 생성하는 함수
const generateThumbnailFromVideo = async (videoUrl: string) => {
  if (!videoUrl || videoUrl.trim() === '') return;
  
  try {
    console.log('🎬 Generating thumbnail from video:', videoUrl);
    
    // 서버 URL을 절대 URL로 변환
    const fullVideoUrl = videoUrl.startsWith('/uploads/') 
      ? `${window.location.origin}/server${videoUrl}`
      : videoUrl;
    
    // 썸네일 생성 (1초 지점에서 320x240 크기로)
    const thumbnailDataUrl = await generateThumbnail(fullVideoUrl, 1, 320, 240);
    
    // 생성된 썸네일을 서버에 업로드
    const videoFilename = videoUrl.split('/').pop()?.split('.')[0] || 'video';
    const thumbnailUrl = await uploadThumbnail(thumbnailDataUrl, videoFilename);
    
    // 폼 데이터의 coverImage를 업데이트
    formData.coverImage = thumbnailUrl;
    
    console.log('✅ Thumbnail generated and uploaded:', thumbnailUrl);
  } catch (error) {
    console.error('❌ Failed to generate thumbnail:', error);
    // 에러가 발생해도 폼 제출을 막지 않음 (사용자가 수동으로 커버 이미지 업로드 가능)
  }
};

// 영상 URL 변경 시 자동으로 썸네일 생성
watch(() => formData.videoUrl, async (newVideoUrl, oldVideoUrl) => {
  if (newVideoUrl && newVideoUrl !== oldVideoUrl && uploadMode.value === 'video') {
    // 영상 URL이 실제로 변경되었고, 아직 커버 이미지가 없는 경우에만 생성
    if (!formData.coverImage || formData.coverImage.trim() === '') {
      await generateThumbnailFromVideo(newVideoUrl);
    }
  }
});

watch(
  () => formData.pages.map(page => page.imageUrl),
  (newVals, oldVals) => {
    newVals.forEach((val, idx) => {
      if (val !== oldVals[idx]) {
        console.log(`Page ${idx + 1} imageUrl changed:`, val);
      }
    });
  }
);

// 이미지 URL 처리 함수
const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

// 비디오 이벤트 핸들러들
const onVideoCanPlay = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  console.log('📹 Admin video is ready to play:', video.src);
};

const onVideoError = (event: Event) => {
  const video = event.target as HTMLVideoElement;
  console.error('❌ Admin video loading error:', video.src, event);
};

const handleAdminVideoHover = async (book: any, isHovering: boolean) => {
  if (!book.isVideoMode || !book.videoUrl) return;
  
  const videoElement = document.querySelector(`[data-video-id="${book.id}"]`) as HTMLVideoElement;
  if (!videoElement) return;

  try {
    if (isHovering) {
      await videoElement.play();
      console.log(`✅ Admin video preview started for book: ${book.title}`);
    } else {
      videoElement.pause();
      videoElement.currentTime = 0;
      console.log(`⏸️ Admin video preview stopped for book: ${book.title}`);
    }
  } catch (error) {
    console.log(`ℹ️ Admin video autoplay blocked for book: ${book.title}`, error);
  }
};

watch(
  () => formData.pages.map(page => page.audioUrl),
  (newVals, oldVals) => {
    newVals.forEach((val, idx) => {
      if (val !== oldVals[idx]) {
        console.log(`Page ${idx + 1} audioUrl changed:`, val);
      }
    });
  }
);
</script>

<style scoped>
.admin-books {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.main-content {
  padding: var(--spacing-2xl) 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-2xl);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.admin-type-indicator {
  display: flex;
  align-items: center;
}

.admin-badge {
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  color: var(--color-text-white);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-xl);
}

.book-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  overflow: hidden;
  transition: all 0.3s ease;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-border-light);
}

.book-cover {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.book-cover img,
.book-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.book-video {
  background: var(--color-bg-secondary);
}

.no-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-secondary);
  text-align: center;
  padding: 20px;
}

.placeholder-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
  opacity: 0.6;
}

.placeholder-text {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: 500;
  line-height: 1.3;
  margin: 0;
}

.video-overlay {
  position: absolute;
  top: var(--spacing-sm);
  left: var(--spacing-sm);
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-text-white);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.video-icon {
  font-size: 0.9rem;
}

.video-mode {
  background: var(--color-accent);
  color: var(--color-text-white);
}

.book-overlay {
  position: absolute;
  top: var(--spacing-sm);
  right: var(--spacing-sm);
}

.book-meta {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.page-count,
.age-range {
  background: rgba(0, 0, 0, 0.7);
  color: var(--color-text-white);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-align: center;
}

.owner-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.owner-tag.global {
  background: var(--color-success);
  color: var(--color-text-white);
}

.owner-tag.user {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.book-info {
  padding: var(--spacing-lg);
}

.book-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.book-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.upload-mode-section {
  margin-bottom: var(--spacing-xl);
}

.upload-mode-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.ownership-options {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
}

.radio-option {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  cursor: pointer;
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
  transition: background-color 0.2s ease;
}

.radio-option:hover {
  background: var(--color-bg-hover);
}

.radio-option input[type="radio"] {
  width: 16px;
  height: 16px;
  accent-color: var(--color-primary);
}

.radio-text {
  color: var(--color-text-primary);
  font-size: 0.875rem;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: 1px solid var(--color-border);
  max-width: 500px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-lg);
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: var(--spacing-md);
  color: var(--color-text-primary);
}

.empty-state p {
  color: var(--color-text-secondary);
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-content {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.large-modal {
  max-width: 900px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  background: var(--color-bg-card);
  z-index: 10;
}

.modal-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  padding: var(--spacing-sm);
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.modal-form {
  padding: var(--spacing-xl);
}

.basic-info-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.age-inputs {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.age-separator {
  color: var(--color-text-secondary);
  font-weight: 500;
}

.pages-section {
  margin-bottom: var(--spacing-xl);
}

.pages-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-lg);
}

.page-form-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
}

.page-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.page-title::before {
  content: '📄';
  font-size: 1.2rem;
}

.page-form-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.page-form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-sm);
}

.textarea {
  resize: vertical;
  min-height: 60px;
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
  position: sticky;
  bottom: 0;
  background: var(--color-bg-card);
}

.delete-content {
  padding: var(--spacing-xl);
  text-align: center;
}

.delete-content p {
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.delete-warning {
  color: var(--color-danger);
  font-size: 0.875rem;
}

.video-section {
  margin-bottom: var(--spacing-xl);
}

.video-upload-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.video-description {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
}

.upload-tip {
  color: var(--color-text-primary);
  font-size: 1rem;
  margin: 0 0 var(--spacing-md) 0;
}

.tip-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.tip-list li {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-bottom: var(--spacing-xs);
  padding-left: var(--spacing-lg);
  position: relative;
}

.tip-list li:before {
  content: '•';
  color: var(--color-primary);
  font-weight: bold;
  position: absolute;
  left: var(--spacing-sm);
}

/* 썸네일 생성 관련 스타일 */
.thumbnail-generating {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin: var(--spacing-md) 0;
}

.generating-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  color: var(--color-text-secondary);
}

.thumbnail-generating .spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary);
  border-radius: 50%;
  animation: thumbnailSpin 1s linear infinite;
}

@keyframes thumbnailSpin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.thumbnail-generated {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid var(--color-success);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin: var(--spacing-md) 0;
}

.success-indicator {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  color: var(--color-success);
  font-weight: 500;
  margin-bottom: var(--spacing-md);
}

.success-icon {
  font-size: 1.2rem;
}

.thumbnail-preview {
  display: flex;
  justify-content: center;
}

.generated-thumbnail {
  max-width: 200px;
  max-height: 150px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  object-fit: cover;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-lg);
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .books-grid {
    grid-template-columns: 1fr;
    gap: var(--spacing-lg);
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .pages-container {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .page-form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: var(--spacing-md);
    max-width: none;
  }
  
  .large-modal {
    max-width: none;
  }
  
  .modal-header {
    padding: var(--spacing-lg);
  }
  
  .modal-form {
    padding: var(--spacing-lg);
  }
  
  .page-form-card {
    padding: var(--spacing-sm);
  }
}

.optional-label {
  font-size: 0.8rem;
  color: var(--color-text-secondary);
  font-weight: normal;
  margin-left: 8px;
}

/* 호버 효과 */
.book-card:hover .book-cover img,
.book-card:hover .book-video {
  transform: scale(1.05);
}

.book-card:hover .video-overlay {
  opacity: 0.9;
}
</style>