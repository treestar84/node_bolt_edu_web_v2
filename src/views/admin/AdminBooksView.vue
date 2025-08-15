<template>
  <div class="admin-books">
    <AdminHeader />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">{{ t('admin.bookManagement') }}</h1>
          <div class="header-actions">
            <div class="admin-type-indicator" v-if="isSystemAdmin">
              <span class="admin-badge">{{ t('admin.systemAdmin') }}</span>
            </div>
            <button @click="openAddModal" class="btn btn-primary">
              <span>➕</span>
              {{ t('admin.addNewBook') }}
            </button>
            <button @click="generateTestVideo" class="btn btn-secondary" :disabled="isGeneratingTest">
              <span>🎬</span>
              {{ isGeneratingTest ? t('admin.generating') : t('admin.testVideoGeneration') }}
            </button>
          </div>
        </div>

        <div class="books-grid" v-if="store.currentBooks.length > 0">
          <BookCard
            v-for="book in store.currentBooks" 
            :key="book.id"
            :book="book"
            :show-ownership="isSystemAdmin"
            @edit="editBook"
            @delete="deleteBookConfirm"
            @video-can-play="handleVideoCanPlay"
            @video-error="handleVideoError"
          />
        </div>

        <div v-else class="empty-state">
          <div class="empty-icon">📖</div>
          <h3>{{ t('admin.noData') }}</h3>
          <p>{{ t('admin.addFirst') }}</p>
        </div>
      </div>
    </main>

    <!-- Book Modal -->
    <BookModal
      :show="showModal"
      :book="selectedBook"
      :is-system-admin="isSystemAdmin"
      @close="closeModal"
      @save="saveBook"
    />

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content delete-modal" @click.stop>
        <div class="modal-header">
          <h3>{{ t('admin.deleteBook') }}</h3>
          <button @click="closeDeleteModal" class="modal-close">×</button>
        </div>
        <div class="modal-body">
          <p>{{ t('admin.confirmDelete') }}</p>
          <p class="book-title-confirm">"{{ bookToDelete?.title }}"</p>
        </div>
        <div class="modal-footer">
          <button @click="closeDeleteModal" class="btn btn-secondary">
            {{ t('common.cancel') }}
          </button>
          <button @click="confirmDelete" class="btn btn-danger" :disabled="isDeleting">
            {{ isDeleting ? t('admin.deleting') : t('common.delete') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading/Success Toast -->
    <div v-if="showToastMessage" class="toast" :class="toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import AdminHeader from '@/components/AdminHeader.vue';
import BookCard from '@/components/admin/BookCard.vue';
import BookModal from '@/components/admin/BookModal.vue';
import type { Book } from '@/types';

// Stores
const store = useAppStore();
const authStore = useAuthStore();
const { t } = useI18n();

// State
const showModal = ref(false);
const showDeleteModal = ref(false);
const selectedBook = ref<Book | null>(null);
const bookToDelete = ref<Book | null>(null);
const isGeneratingTest = ref(false);
const isDeleting = ref(false);
const showToastMessage = ref(false);
const toastMessage = ref('');
const toastType = ref<'success' | 'error'>('success');

// Computed
const isSystemAdmin = computed(() => {
  return authStore.userProfile?.userType === 'director';
});

// Methods
const openAddModal = () => {
  selectedBook.value = null;
  showModal.value = true;
};

const editBook = (book: Book) => {
  selectedBook.value = book;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedBook.value = null;
};

const deleteBookConfirm = (book: Book) => {
  bookToDelete.value = book;
  showDeleteModal.value = true;
};

const closeDeleteModal = () => {
  showDeleteModal.value = false;
  bookToDelete.value = null;
};

const confirmDelete = async () => {
  if (!bookToDelete.value) return;
  
  isDeleting.value = true;
  try {
    await store.deleteBook(bookToDelete.value.id);
    showToast(t('admin.bookDeleted'), 'success');
    closeDeleteModal();
  } catch (error) {
    console.error('Delete book error:', error);
    showToast(t('admin.deleteError'), 'error');
  } finally {
    isDeleting.value = false;
  }
};

const saveBook = async (bookData: any) => {
  try {
    if (selectedBook.value) {
      // Edit existing book
      await store.updateBook(selectedBook.value.id, bookData);
      showToast(t('admin.bookUpdated'), 'success');
    } else {
      // Add new book
      await store.addBook(bookData);
      showToast(t('admin.bookAdded'), 'success');
    }
    closeModal();
  } catch (error) {
    console.error('Save book error:', error);
    showToast(t('admin.saveError'), 'error');
  }
};

const generateTestVideo = async () => {
  isGeneratingTest.value = true;
  try {
    const response = await fetch('/api/video/generate-test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': import.meta.env.VITE_API_KEY
      }
    });
    
    if (response.ok) {
      showToast(t('admin.videoGenerated'), 'success');
    } else {
      throw new Error('Video generation failed');
    }
  } catch (error) {
    console.error('Test video generation error:', error);
    showToast(t('admin.videoGenerationFailed'), 'error');
  } finally {
    isGeneratingTest.value = false;
  }
};

const handleVideoCanPlay = (bookId: string) => {
  console.log('Video can play:', bookId);
};

const handleVideoError = (bookId: string) => {
  console.error('Video error for book:', bookId);
};

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  toastMessage.value = message;
  toastType.value = type;
  showToastMessage.value = true;
  
  setTimeout(() => {
    showToastMessage.value = false;
  }, 3000);
};

// Lifecycle
onMounted(() => {
  store.loadBooks();
});
</script>

<style scoped>
.admin-books {
  min-height: 100vh;
  background: var(--color-bg-primary);
}

.main-content {
  padding: 32px 0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.admin-type-indicator {
  padding: 8px 16px;
  background: var(--color-primary);
  border-radius: var(--radius-full);
  color: white;
  font-size: 0.875rem;
  font-weight: 500;
}

.btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: var(--color-danger-dark);
}

.books-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: var(--color-text-muted);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin: 0;
}

/* Delete Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.delete-modal {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 100%;
  max-width: 400px;
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 24px 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--color-text-primary);
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
}

.modal-body {
  padding: 24px;
  text-align: center;
}

.modal-body p {
  margin: 0 0 8px 0;
  color: var(--color-text-secondary);
}

.book-title-confirm {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 1.125rem;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 0 24px 24px;
  justify-content: flex-end;
}

/* Toast Styles */
.toast {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 500;
  z-index: 1100;
  animation: slideIn 0.3s ease;
}

.toast.success {
  background: var(--color-success);
}

.toast.error {
  background: var(--color-danger);
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .books-grid {
    grid-template-columns: 1fr;
  }
}
</style>