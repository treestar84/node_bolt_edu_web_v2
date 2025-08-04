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
            <button @click="startAddWord" class="btn btn-primary">
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

    <!-- Step-by-Step Modal -->
    <div v-if="showStepModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content step-modal" @click.stop>
        <div class="modal-header">
          <div class="step-header">
            <h2>{{ showAddModal ? '새 단어 추가' : '단어 수정' }}</h2>
            <div class="step-indicator">
              <div class="steps">
                <div 
                  v-for="(step, index) in steps" 
                  :key="index"
                  class="step-item"
                  :class="{ 
                    'active': currentStep === index + 1, 
                    'completed': currentStep > index + 1 
                  }"
                >
                  <div class="step-number">{{ index + 1 }}</div>
                  <div class="step-title">{{ step.title }}</div>
                </div>
              </div>
            </div>
          </div>
          <button @click="closeModals" class="modal-close">×</button>
        </div>
        
        <form @submit.prevent="handleStepSubmit" class="modal-form">
          <!-- Step 1: 기본 정보 -->
          <div v-if="currentStep === 1" class="step-content">
            <div class="step-description">
              <h3>기본 정보</h3>
              <p>단어의 기본 정보를 입력해주세요</p>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  한국어 이름
                  <button 
                    type="button" 
                    class="info-tooltip" 
                    @click="showTooltip('korean-name')"
                    @blur="hideTooltip"
                  >
                    ℹ️
                  </button>
                  <div v-if="activeTooltip === 'korean-name'" class="tooltip">
                    아이들이 학습할 한국어 단어를 입력하세요
                  </div>
                </label>
                <input 
                  v-model="formData.name" 
                  type="text" 
                  class="form-input" 
                  placeholder="예: 고양이"
                  required
                  ref="firstInput"
                />
              </div>
              <div class="form-group">
                <label class="form-label">
                  영어 이름
                  <button 
                    type="button" 
                    class="info-tooltip" 
                    @click="showTooltip('english-name')"
                    @blur="hideTooltip"
                  >
                    ℹ️
                  </button>
                  <div v-if="activeTooltip === 'english-name'" class="tooltip">
                    해당하는 영어 단어를 입력하세요
                  </div>
                </label>
                <input 
                  v-model="formData.nameEn" 
                  type="text" 
                  class="form-input" 
                  placeholder="예: Cat"
                  required 
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  카테고리
                  <button 
                    type="button" 
                    class="info-tooltip" 
                    @click="showTooltip('category')"
                    @blur="hideTooltip"
                  >
                    ℹ️
                  </button>
                  <div v-if="activeTooltip === 'category'" class="tooltip">
                    단어가 속할 분류를 선택하세요
                  </div>
                </label>
                <select v-model="formData.category" class="form-input" required>
                  <option value="">카테고리 선택</option>
                  <option v-for="key in categoryKeys" :key="key" :value="key">
                    {{ getCategoryName(key) }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">
                  적정 나이
                  <button 
                    type="button" 
                    class="info-tooltip" 
                    @click="showTooltip('age')"
                    @blur="hideTooltip"
                  >
                    ℹ️
                  </button>
                  <div v-if="activeTooltip === 'age'" class="tooltip">
                    이 단어를 학습하기 적절한 나이 범위를 설정하세요
                  </div>
                </label>
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
          </div>

          <!-- Step 2: 파일 업로드 -->
          <div v-if="currentStep === 2" class="step-content">
            <div class="step-description">
              <h3>파일 업로드</h3>
              <p>이미지와 음성 파일을 업로드해주세요</p>
            </div>

            <div class="form-group">
              <label class="form-label">
                이미지
                <button 
                  type="button" 
                  class="info-tooltip" 
                  @click="showTooltip('image')"
                  @blur="hideTooltip"
                >
                  ℹ️
                </button>
                <div v-if="activeTooltip === 'image'" class="tooltip">
                  이미지를 업로드하거나 비워두면 단어명으로 자동 검색합니다
                </div>
              </label>
              <FileUploadInput
                v-model="formData.imageUrl"
                label="이미지"
                placeholder="https://example.com/image.jpg"
                file-type="image"
                :required="false"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">
                  한국어 음성
                  <button 
                    type="button" 
                    class="info-tooltip" 
                    @click="showTooltip('audio-ko')"
                    @blur="hideTooltip"
                  >
                    ℹ️
                  </button>
                  <div v-if="activeTooltip === 'audio-ko'" class="tooltip">
                    선택사항: 업로드하지 않으면 자동 음성으로 발음됩니다
                  </div>
                </label>
                <FileUploadInput
                  v-model="formData.audioKo"
                  :label="$t('admin.audioKoLabel')"
                  placeholder="/audio/cat-ko.mp3"
                  file-type="audio"
                  :required="false"
                />
              </div>
              <div class="form-group">
                <label class="form-label">
                  영어 음성
                  <button 
                    type="button" 
                    class="info-tooltip" 
                    @click="showTooltip('audio-en')"
                    @blur="hideTooltip"
                  >
                    ℹ️
                  </button>
                  <div v-if="activeTooltip === 'audio-en'" class="tooltip">
                    선택사항: 업로드하지 않으면 자동 음성으로 발음됩니다
                  </div>
                </label>
                <FileUploadInput
                  v-model="formData.audioEn"
                  :label="$t('admin.audioEnLabel')"
                  placeholder="/audio/cat-en.mp3"
                  file-type="audio"
                  :required="false"
                />
              </div>
            </div>

            <div class="auto-fetch-info">
              <div class="info-icon">🖼️</div>
              <span>이미지가 없으면 Pexels에서 자동으로 검색하여 가져옵니다</span>
            </div>

            <div class="tts-info">
              <div class="info-icon">💡</div>
              <span>음성 파일이 없으면 브라우저 TTS로 자동 발음됩니다</span>
            </div>
          </div>

          <!-- Step 3: 추가 설정 -->
          <div v-if="currentStep === 3" class="step-content">
            <div class="step-description">
              <h3>추가 설정</h3>
              <p>소유권 및 기타 설정을 완료해주세요</p>
            </div>

            <!-- 시스템 관리자만 소유권 선택 가능 -->
            <div v-if="isSystemAdmin" class="form-group">
              <label class="form-label">
                소유권 설정
                <button 
                  type="button" 
                  class="info-tooltip" 
                  @click="showTooltip('ownership')"
                  @blur="hideTooltip"
                >
                  ℹ️
                </button>
                <div v-if="activeTooltip === 'ownership'" class="tooltip">
                  공용: 모든 사용자가 볼 수 있음<br>
                  개인: 본인만 볼 수 있음
                </div>
              </label>
              <div class="ownership-options">
                <label class="radio-option">
                  <input 
                    type="radio" 
                    v-model="formData.ownerType" 
                    value="global"
                    name="ownerType"
                  />
                  <div class="radio-content">
                    <div class="radio-icon">🌍</div>
                    <div class="radio-text">
                      <strong>공용</strong>
                      <span>모든 사용자에게 표시</span>
                    </div>
                  </div>
                </label>
                <label class="radio-option">
                  <input 
                    type="radio" 
                    v-model="formData.ownerType" 
                    value="user"
                    name="ownerType"
                  />
                  <div class="radio-content">
                    <div class="radio-icon">👤</div>
                    <div class="radio-text">
                      <strong>개인</strong>
                      <span>나만 볼 수 있음</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div v-else class="form-group">
              <div class="ownership-info">
                <div class="info-icon">👤</div>
                <div class="info-text">
                  <strong>개인 단어</strong>
                  <span>이 단어는 본인만 볼 수 있습니다</span>
                </div>
              </div>
            </div>

            <!-- 요약 정보 -->
            <div class="summary-card">
              <h4>입력 정보 요약</h4>
              <div class="summary-grid">
                <div class="summary-item">
                  <span class="label">한국어:</span>
                  <span class="value">{{ formData.name || '-' }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">영어:</span>
                  <span class="value">{{ formData.nameEn || '-' }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">카테고리:</span>
                  <span class="value">{{ formData.category ? getCategoryName(formData.category) : '-' }}</span>
                </div>
                <div class="summary-item">
                  <span class="label">나이:</span>
                  <span class="value">{{ formData.minAge }}~{{ formData.maxAge }}세</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button 
              v-if="currentStep > 1" 
              type="button" 
              @click="previousStep" 
              class="btn btn-secondary"
            >
              이전
            </button>
            <button type="button" @click="closeModals" class="btn btn-secondary">
              취소
            </button>
            <button 
              v-if="currentStep < 3" 
              type="submit" 
              class="btn btn-primary"
            >
              다음
            </button>
            <button 
              v-else 
              type="submit" 
              class="btn btn-primary" 
              :disabled="isLoading || isSearching"
            >
              {{ getLoadingText() }}
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
import { useAutoImageFetch } from '@/composables/useAutoImageFetch';
import type { WordItem } from '@/types';
import { useI18n } from 'vue-i18n';

const store = useAppStore();
const authStore = useAuthStore();
const { t, messages } = useI18n();
const { isSearching, searchError, fetchAndUploadImage, clearError } = useAutoImageFetch();

const showAddModal = ref(false);
const showEditModal = ref(false);
const showStepModal = ref(false);
const showDeleteModal = ref(false);
const editingWord = ref<WordItem | null>(null);
const wordToDelete = ref<WordItem | null>(null);
const isLoading = ref(false);
const error = ref('');
const currentStep = ref(1);
const activeTooltip = ref<string | null>(null);
const firstInput = ref<HTMLInputElement | null>(null);

// 단계별 구성
const steps = [
  { title: '기본정보', description: '단어 이름과 카테고리' },
  { title: '파일업로드', description: '이미지와 음성 파일' },
  { title: '추가설정', description: '소유권 및 최종 확인' }
];

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

const categoryKeys = computed(() => Object.keys(messages.value[store.currentLanguage].categories).filter(key => key !== 'all'));

const getCategoryName = (category: string) => {
  return t('categories.' + category);
};

const getImageUrl = (url: string): string => {
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  return url;
};

const getLoadingText = (): string => {
  if (isSearching.value) {
    return '이미지 검색 중...';
  }
  if (isLoading.value) {
    return '저장 중...';
  }
  return showAddModal.value ? '단어 추가' : '수정 완료';
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
  currentStep.value = 1;
  activeTooltip.value = null;
};

const startAddWord = () => {
  resetForm();
  showAddModal.value = true;
  showStepModal.value = true;
  currentStep.value = 1;
};

const showTooltip = (type: string) => {
  activeTooltip.value = activeTooltip.value === type ? null : type;
};

const hideTooltip = () => {
  activeTooltip.value = null;
};

const nextStep = () => {
  if (currentStep.value < 3) {
    currentStep.value++;
  }
};

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const validateCurrentStep = (): boolean => {
  error.value = '';
  
  if (currentStep.value === 1) {
    if (!formData.name.trim()) {
      error.value = '한국어 이름을 입력해주세요.';
      return false;
    }
    if (!formData.nameEn.trim()) {
      error.value = '영어 이름을 입력해주세요.';
      return false;
    }
    if (!formData.category) {
      error.value = '카테고리를 선택해주세요.';
      return false;
    }
    if (formData.minAge > formData.maxAge) {
      error.value = '최소 나이는 최대 나이보다 작거나 같아야 합니다.';
      return false;
    }
  } else if (currentStep.value === 2) {
    // 이미지가 없어도 자동으로 가져올 수 있으므로 선택사항으로 변경
    // 이미지 검증은 저장 시점에서 처리
  }
  
  return true;
};

const handleStepSubmit = async () => {
  if (!validateCurrentStep()) {
    return;
  }
  
  if (currentStep.value < 3) {
    nextStep();
  } else {
    await saveWord();
  }
};

const closeModals = () => {
  showAddModal.value = false;
  showEditModal.value = false;
  showStepModal.value = false;
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
  showStepModal.value = true;
  currentStep.value = 1;
};

const saveWord = async () => {
  if (!validateCurrentStep()) {
    return;
  }

  isLoading.value = true;
  error.value = '';
  clearError();

  try {
    let imageUrl = formData.imageUrl;

    // 이미지가 없을 경우 Pexels에서 자동으로 가져오기
    if (!imageUrl.trim() && formData.name.trim() && formData.nameEn.trim()) {
      console.log('🔍 No image provided, auto-fetching from Pexels...');
      
      const fetchedImageUrl = await fetchAndUploadImage(formData.name, formData.nameEn);
      
      if (fetchedImageUrl) {
        imageUrl = fetchedImageUrl;
        console.log('✅ Auto-fetched image successfully:', imageUrl);
      } else {
        // 이미지를 가져올 수 없는 경우 사용자에게 알림
        if (searchError.value) {
          error.value = `이미지 자동 가져오기 실패: ${searchError.value} 직접 이미지를 업로드해주세요.`;
        } else {
          error.value = '이미지를 자동으로 가져올 수 없습니다. 직접 이미지를 업로드해주세요.';
        }
        return;
      }
    } else if (!imageUrl.trim()) {
      error.value = '이미지를 업로드하거나 한국어/영어 이름을 입력해주세요.';
      return;
    }

    const wordData = {
      name: formData.name,
      nameEn: formData.nameEn,
      imageUrl: imageUrl,
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
  color: var(--color-bg-primary);
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
  color: var(--color-text-white);
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

.form-hint {
  margin-top: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
}

.tts-guide {
  color: var(--color-text-secondary);
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

/* 단계별 모달 스타일 */
.step-modal {
  max-width: 700px;
}

.step-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.step-header h2 {
  margin: 0;
}

.step-indicator {
  display: flex;
  justify-content: center;
}

.steps {
  display: flex;
  gap: var(--spacing-xl);
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  opacity: 0.4;
  transition: all 0.3s ease;
}

.step-item.active {
  opacity: 1;
  color: var(--color-primary);
}

.step-item.completed {
  opacity: 0.8;
  color: var(--color-success);
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  border: 2px solid currentColor;
  background: var(--color-bg-card);
}

.step-item.active .step-number {
  background: var(--color-primary);
  color: var(--color-bg-primary);
}

.step-item.completed .step-number {
  background: var(--color-success);
  color: var(--color-text-white);
}

.step-title {
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.step-content {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.step-description {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--color-primary);
}

.step-description h3 {
  font-size: 1.25rem;
  margin-bottom: var(--spacing-sm);
  color: var(--color-text-primary);
}

.step-description p {
  color: var(--color-text-secondary);
  margin: 0;
}

/* 툴팁 스타일 */
.info-tooltip {
  background: none;
  border: none;
  color: var(--color-text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
  margin-left: var(--spacing-xs);
  padding: 2px;
  border-radius: 50%;
  transition: all 0.2s ease;
  position: relative;
}

.info-tooltip:hover {
  color: var(--color-primary);
  background: var(--color-bg-hover);
}

.tooltip {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: var(--spacing-xs);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  white-space: nowrap;
  z-index: 1000;
  box-shadow: var(--shadow-lg);
  animation: tooltipFadeIn 0.2s ease;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.tooltip::before {
  content: '';
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid var(--color-border);
}

.tooltip::after {
  content: '';
  position: absolute;
  top: -3px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-bottom: 4px solid var(--color-bg-card);
}

/* Auto-fetch 정보 스타일 */
.auto-fetch-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-top: var(--spacing-md);
}

/* TTS 정보 스타일 */
.tts-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: var(--color-bg-secondary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-top: var(--spacing-md);
}

.info-icon {
  font-size: 1rem;
}

@media (max-width: 768px) {
  .steps {
    gap: var(--spacing-md);
  }
  
  .step-item {
    gap: var(--spacing-xs);
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .step-title {
    font-size: 0.6rem;
  }
  
  .step-content {
    min-height: 300px;
  }
  
  .tooltip {
    position: fixed;
    left: 50% !important;
    top: 50% !important;
    transform: translate(-50%, -50%) !important;
    margin-top: 0;
    white-space: normal;
    max-width: 80vw;
  }
}
</style>