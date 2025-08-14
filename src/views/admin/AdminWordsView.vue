<template>
  <div class="admin-words">
    <AdminHeader />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">{{ $t('admin.words') }}</h1>
          <div class="header-actions">
            <div class="admin-type-indicator" v-if="isSystemAdmin">
              <span class="admin-badge">{{ $t('admin.systemAdmin') }}</span>
            </div>
            <div class="add-word-controls">
              <button @click="startAddWord" class="btn btn-primary btn-add-word">
                <span>➕</span>
                {{ $t('admin.addNewWord') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Words Table Component -->
        <WordsTable
          :words="wordsForTable"
          :show-ownership="isSystemAdmin"
          @edit="editWord"
          @delete="deleteWordConfirm"
        />
      </div>
    </main>

    <!-- Simple Word Modal Component -->
    <SimpleWordModal
      :show="showStepModal"
      :word="editingWord"
      :is-system-admin="isSystemAdmin"
      @close="closeModals"
      @save="saveWord"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="showDeleteModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ $t('admin.deleteWord') }}</h2>
          <button @click="showDeleteModal = false" class="modal-close">×</button>
        </div>
        
        <div class="delete-content">
          <p>{{ $t('admin.confirmDelete') }} "<strong>{{ wordToDelete?.name }}</strong>"?</p>
          <p class="delete-warning">{{ $t('admin.deleteWarning') }}</p>
        </div>

        <div class="modal-actions">
          <button @click="showDeleteModal = false" class="btn btn-secondary">
            {{ $t('common.cancel') }}
          </button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="isLoading">
            {{ isLoading ? $t('admin.deleting') : $t('common.delete') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import AdminHeader from '@/components/AdminHeader.vue';
import WordsTable from '@/components/admin/WordsTable.vue';
import SimpleWordModal from '@/components/admin/SimpleWordModal.vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useAutoImageFetch } from '@/composables/useAutoImageFetch';
import type { WordItem } from '@/types';

const store = useAppStore();
const authStore = useAuthStore();
const { searchError, fetchAndUploadImage, clearError } = useAutoImageFetch();

const showStepModal = ref(false);
const showDeleteModal = ref(false);
const editingWord = ref<WordItem | null>(null);
const wordToDelete = ref<WordItem | null>(null);
const isLoading = ref(false);
const error = ref('');

// 시스템 관리자 여부 확인
const isSystemAdmin = computed(() => {
  return authStore.userProfile?.userType === 'teacher' || authStore.userProfile?.userType === 'director';
});

// 테이블에 표시할 단어 목록 (컴포넌트 구조에 맞게 변환)
const wordsForTable = computed(() => {
  return store.currentWords.map(word => ({
    id: word.id,
    name: word.name,
    nameEn: word.nameEn,
    imageUrl: word.imageUrl,
    audioUrl: word.audioKo || word.audioEn || '',
    category: word.category,
    ageGroup: word.minAge, // minAge를 ageGroup으로 매핑
    ownerType: word.ownerType === 'global' ? 'admin' as const : 'teacher' as const
  }));
});


const startAddWord = () => {
  editingWord.value = null;
  showStepModal.value = true;
  console.log('🎨 Starting word creation');
};

const editWord = (word: any) => {
  // 테이블 컴포넌트에서 받은 word를 원래 구조로 변환
  const originalWord = store.currentWords.find(w => w.id === word.id);
  if (originalWord) {
    editingWord.value = originalWord;
    // 다국어 데이터가 있으면 다국어 모드, 없으면 전통 모드
    modalMode.value = WordCompatibilityHelper.hasMultilingualData(originalWord) ? 'multilang' : 'traditional';
    showStepModal.value = true;
    console.log(`📝 Editing word in ${modalMode.value} mode:`, originalWord.name);
  }
};

const closeModals = () => {
  showStepModal.value = false;
  editingWord.value = null;
  error.value = '';
};

const saveWord = async (wordData: any) => {
  console.log('💾 AdminWordsView received save request:', wordData);
  
  isLoading.value = true;
  error.value = '';
  clearError();

  try {
    let imageUrl = wordData.imageUrl;

    // 이미지가 없을 경우 Pexels에서 자동으로 가져오기
    if (!imageUrl.trim() && wordData.name.trim() && wordData.nameEn.trim()) {
      console.log('🔍 No image provided, auto-fetching from Pexels...');
      
      const fetchedImageUrl = await fetchAndUploadImage(wordData.name, wordData.nameEn);
      
      if (fetchedImageUrl) {
        imageUrl = fetchedImageUrl;
        console.log('✅ Auto-fetched image successfully:', imageUrl);
      } else {
        // 이미지를 가져올 수 없는 경우 경고만 하고 계속 진행
        console.warn('⚠️ Could not auto-fetch image, proceeding without image');
        if (searchError.value) {
          console.warn('Pexels error:', searchError.value);
        }
        imageUrl = ''; // 빈 이미지로 진행
      }
    }

    // 기본 단어 데이터 구성
    const finalWordData = {
      name: wordData.name,
      nameEn: wordData.nameEn,
      imageUrl: imageUrl,
      audioKo: wordData.audioKo || '',
      audioEn: wordData.audioEn || '',
      category: wordData.category,
      minAge: wordData.minAge || 3,
      maxAge: wordData.maxAge || 6,
      ownerType: wordData.ownerType,
      ownerId: wordData.ownerType === 'user' ? authStore.user?.id : undefined
    };

    // 다국어 데이터가 있으면 추가 (JSON으로 저장)
    if (wordData.translations) {
      finalWordData.translations = JSON.stringify(wordData.translations);
      finalWordData.autoTranslated = wordData.autoTranslated || false;
      finalWordData.primaryLanguage = wordData.primaryLanguage || 'ko';
      finalWordData.secondaryLanguage = wordData.secondaryLanguage || 'en';
      finalWordData.autoTranslatedLanguages = JSON.stringify(wordData.autoTranslatedLanguages || []);
    }

    if (editingWord.value) {
      await store.updateWord(editingWord.value.id, finalWordData);
      console.log('✅ Word updated successfully');
    } else {
      await store.addWord(finalWordData);
      console.log('✅ Word added successfully');
    }
    
    closeModals();
  } catch (err: any) {
    console.error('❌ Error saving word:', err);
    error.value = err.message || $t('admin.saveError');
  } finally {
    isLoading.value = false;
  }
};


const deleteWordConfirm = (word: any) => {
  // 테이블 컴포넌트에서 받은 word를 원래 구조로 변환
  const originalWord = store.currentWords.find(w => w.id === word.id);
  if (originalWord) {
    wordToDelete.value = originalWord;
    showDeleteModal.value = true;
  }
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
    error.value = err.message || $t('admin.deleteError');
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // 페이지 로드 시 최신 데이터 가져오기
  console.log('🔄 Loading words data...');
  await store.loadWords();
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

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
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

.add-word-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.mode-selector {
  display: flex;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.mode-button {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.mode-button:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.mode-button.active {
  background: var(--color-primary);
  color: white;
}

.mode-button span {
  font-size: 1rem;
}

.mode-text {
  font-size: 0.875rem;
}

.btn-add-word {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  white-space: nowrap;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
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
  
  .add-word-controls {
    flex-direction: column;
    align-items: stretch;
    gap: var(--spacing-sm);
  }
  
  .mode-selector {
    width: 100%;
  }
  
  .mode-button {
    flex: 1;
    justify-content: center;
    padding: var(--spacing-md);
  }
  
  .btn-add-word {
    width: 100%;
    justify-content: center;
  }
  
  .modal-content {
    margin: var(--spacing-md);
    max-width: none;
  }
}
</style>