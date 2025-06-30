<template>
  <div class="admin-words">
    <AdminHeader />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">단어 관리</h1>
          <div class="header-actions">
            <div class="admin-type-indicator" v-if="isSystemAdmin">
              <span class="admin-badge">시스템 관리자</span>
            </div>
            <button @click="showAddModal = true" class="btn btn-primary">
              <span>➕</span>
              새 단어 추가
            </button>
          </div>
        </div>

        <div class="words-table-container">
          <div v-if="store.currentWords.length === 0" class="empty-state">
            <div class="empty-icon">📚</div>
            <h3>등록된 단어가 없습니다</h3>
            <p>첫 번째 단어를 추가해보세요</p>
          </div>

          <div v-else class="words-table">
            <div class="table-header">
              <div class="header-cell">이미지</div>
              <div class="header-cell">단어</div>
              <div class="header-cell">카테고리</div>
              <div class="header-cell">나이</div>
              <div class="header-cell" v-if="isSystemAdmin">소유권</div>
              <div class="header-cell">작업</div>
            </div>
            
            <div 
              v-for="word in store.currentWords" 
              :key="word.id"
              class="table-row"
            >
              <div class="cell image-cell">
                <img :src="getImageUrl(word.imageUrl)" :alt="word.name" />
              </div>
              <div class="cell word-cell">
                <div class="word-names">
                  <div class="word-ko">{{ word.name }}</div>
                  <div class="word-en">{{ word.nameEn }}</div>
                </div>
              </div>
              <div class="cell category-cell">
                <span class="category-tag">{{ getCategoryName(word.category) }}</span>
              </div>
              <div class="cell age-cell">
                <span class="age-range">{{ word.minAge }}-{{ word.maxAge }}세</span>
              </div>
              <div class="cell owner-cell" v-if="isSystemAdmin">
                <span class="owner-tag" :class="word.ownerType">
                  {{ word.ownerType === 'global' ? '공용' : '개인' }}
                </span>
              </div>
              <div class="cell actions-cell">
                <button @click="editWord(word)" class="btn btn-sm btn-secondary">
                  수정
                </button>
                <button @click="deleteWordConfirm(word)" class="btn btn-sm btn-danger">
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content large-modal" @click.stop>
        <div class="modal-header">
          <h2>{{ showAddModal ? '새 단어 추가' : '단어 수정' }}</h2>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <form @submit.prevent="saveWord" class="modal-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">한국어 이름</label>
              <input 
                v-model="formData.name" 
                type="text" 
                class="form-input" 
                placeholder="예: 고양이"
                required 
              />
            </div>
            <div class="form-group">
              <label class="form-label">영어 이름</label>
              <input 
                v-model="formData.nameEn" 
                type="text" 
                class="form-input" 
                placeholder="예: Cat"
                required 
              />
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">이미지</label>
            <FileUploadInput
              v-model="formData.imageUrl"
              label="이미지"
              placeholder="https://example.com/image.jpg"
              file-type="image"
              :required="true"
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">한국어 음성</label>
              <FileUploadInput
                v-model="formData.audioKo"
                label="한국어 음성"
                placeholder="/audio/cat-ko.mp3"
                file-type="audio"
                :required="true"
              />
            </div>
            <div class="form-group">
              <label class="form-label">영어 음성</label>
              <FileUploadInput
                v-model="formData.audioEn"
                label="영어 음성"
                placeholder="/audio/cat-en.mp3"
                file-type="audio"
                :required="true"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">카테고리</label>
              <select v-model="formData.category" class="form-input" required>
                <option value="">카테고리 선택</option>
                <option value="animals">동물</option>
                <option value="fruits">과일</option>
                <option value="vehicles">탈것</option>
                <option value="objects">사물</option>
                <option value="nature">자연</option>
                <option value="toys">장난감</option>
                <option value="clothes">옷</option>
              </select>
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
          <h2>단어 삭제</h2>
          <button @click="showDeleteModal = false" class="modal-close">×</button>
        </div>
        
        <div class="delete-content">
          <p>정말로 "<strong>{{ wordToDelete?.name }}</strong>" 단어를 삭제하시겠습니까?</p>
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
import { ref, reactive, computed, onMounted } from 'vue';
import AdminHeader from '@/components/AdminHeader.vue';
import FileUploadInput from '@/components/FileUploadInput.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useFileUpload } from '@/composables/useFileUpload';
import type { WordItem } from '@/types';

const store = useAppStore();
const authStore = useAuthStore();
const { getUploadedFileUrl } = useFileUpload();

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDeleteModal = ref(false);
const editingWord = ref<WordItem | null>(null);
const wordToDelete = ref<WordItem | null>(null);
const isLoading = ref(false);
const error = ref('');

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

// 시스템 관리자 여부 확인
const isSystemAdmin = computed(() => {
  return authStore.userProfile?.userType === 'teacher' || authStore.userProfile?.userType === 'director';
});

const formData = reactive({
  name: '',
  nameEn: '',
  imageUrl: '',
  audioKo: '',
  audioEn: '',
  category: '',
  minAge: 3,
  maxAge: 6,
  ownerType: 'user' as 'global' | 'user'
});

const getCategoryName = (category: string) => {
  const categoryNames: Record<string, string> = {
    'animals': '동물',
    'fruits': '과일',
    'vehicles': '탈것',
    'objects': '사물',
    'nature': '자연',
    'toys': '장난감',
    'clothes': '옷'
  };
  return categoryNames[category] || category;
};

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const getAudioUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const resetForm = () => {
  formData.name = '';
  formData.nameEn = '';
  formData.imageUrl = '';
  formData.audioKo = '';
  formData.audioEn = '';
  formData.category = '';
  formData.minAge = 3;
  formData.maxAge = 6;
  // 시스템 관리자는 기본적으로 공용으로, 일반 사용자는 개인으로 설정
  formData.ownerType = isSystemAdmin.value ? 'global' : 'user';
  error.value = '';
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  editingWord.value = null;
  resetForm();
};

const editWord = (word: WordItem) => {
  editingWord.value = word;
  formData.name = word.name;
  formData.nameEn = word.nameEn;
  formData.imageUrl = word.imageUrl;
  formData.audioKo = word.audioKo;
  formData.audioEn = word.audioEn;
  formData.category = word.category;
  formData.minAge = word.minAge;
  formData.maxAge = word.maxAge;
  formData.ownerType = word.ownerType;
  showEditModal.value = true;
};

const saveWord = async () => {
  if (formData.minAge > formData.maxAge) {
    error.value = '최소 나이는 최대 나이보다 작거나 같아야 합니다.';
    return;
  }

  isLoading.value = true;
  error.value = '';

  try {
    const wordData = {
      name: formData.name,
      nameEn: formData.nameEn,
      imageUrl: formData.imageUrl,
      audioKo: formData.audioKo,
      audioEn: formData.audioEn,
      category: formData.category,
      minAge: formData.minAge,
      maxAge: formData.maxAge,
      ownerType: formData.ownerType,
      ownerId: formData.ownerType === 'user' ? authStore.user?.id : undefined
    };

    if (showAddModal.value) {
      await store.addWord(wordData);
      console.log('✅ Word added successfully');
    } else if (showEditModal.value && editingWord.value) {
      await store.updateWord(editingWord.value.id, wordData);
      console.log('✅ Word updated successfully');
    }
    
    closeModals();
  } catch (err: any) {
    console.error('❌ Error saving word:', err);
    error.value = err.message || '저장 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

const deleteWordConfirm = (word: WordItem) => {
  wordToDelete.value = word;
  showDeleteModal.value = true;
};

const confirmDelete = async () => {
  if (!wordToDelete.value) return;

  isLoading.value = true;
  
  try {
    await store.deleteWord(wordToDelete.value.id);
    console.log('✅ Word deleted successfully');
    showDeleteModal.value = false;
    wordToDelete.value = null;
  } catch (err: any) {
    console.error('❌ Error deleting word:', err);
    error.value = err.message || '삭제 중 오류가 발생했습니다.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // 페이지 로드 시 최신 데이터 가져오기
  console.log('🔄 Loading words data...');
  await store.loadWords();
  
  // 폼 초기값 설정
  resetForm();
});
</script>

<style scoped>
.admin-words {
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
  color: white;
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

.words-table-container {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-3xl);
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

.words-table {
  display: flex;
  flex-direction: column;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 150px 100px 100px 200px;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
}

.table-header.with-owner {
  grid-template-columns: 100px 1fr 150px 100px 100px 200px;
}

.header-cell {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 150px 100px 100px 200px;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  transition: background-color 0.2s ease;
}

.table-row.with-owner {
  grid-template-columns: 100px 1fr 150px 100px 100px 200px;
}

.table-row:hover {
  background: var(--color-bg-hover);
}

.table-row:last-child {
  border-bottom: none;
}

.cell {
  display: flex;
  align-items: center;
}

.image-cell img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.word-names {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.word-ko {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1rem;
}

.word-en {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.category-tag {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.age-range {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
}

.owner-tag {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.owner-tag.global {
  background: var(--color-success);
  color: white;
}

.owner-tag.user {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
}

.actions-cell {
  gap: var(--spacing-sm);
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
  max-width: 800px;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: var(--spacing-lg);
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: space-between;
  }
  
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: var(--spacing-sm);
  }
  
  .header-cell {
    display: none;
  }
  
  .table-row {
    padding: var(--spacing-md);
    border-radius: var(--radius-md);
    margin-bottom: var(--spacing-sm);
    background: var(--color-bg-secondary);
  }
  
  .cell {
    justify-content: space-between;
    padding: var(--spacing-sm) 0;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    margin: var(--spacing-md);
    max-width: none;
  }
  
  .large-modal {
    max-width: none;
  }
}
</style>