<template>
  <div class="words-table-container">
    <div v-if="words.length === 0" class="empty-state">
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
        <div class="header-cell" v-if="showOwnership">소유권</div>
        <div class="header-cell">작업</div>
      </div>
      
      <div 
        v-for="word in words" 
        :key="word.id"
        class="table-row"
      >
        <div class="cell image-cell">
          <img :src="getImageUrl(word.imageUrl || '')" :alt="word.name" />
        </div>
        <div class="cell word-cell">
          <div class="word-names">
            <div class="word-ko">{{ word.name }}</div>
            <div class="word-en">{{ word.nameEn }}</div>
          </div>
        </div>
        <div class="cell category-cell">
          <span class="category-badge">{{ getCategoryName(word.category) }}</span>
        </div>
        <div class="cell age-cell">
          <span class="age-badge">{{ word.ageGroup }}세</span>
        </div>
        <div class="cell ownership-cell" v-if="showOwnership">
          <span class="ownership-badge" :class="word.ownerType === 'admin' ? 'admin' : 'teacher'">
            {{ word.ownerType === 'admin' ? '시스템' : '개인' }}
          </span>
        </div>
        <div class="cell actions-cell">
          <div class="action-buttons">
            <button @click="handleEdit(word)" class="action-btn edit-btn">
              ✏️ 수정
            </button>
            <button @click="handleDelete(word)" class="action-btn delete-btn">
              🗑️ 삭제
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import type { WordTableItem } from '@/types';

interface Props {
  words: WordTableItem[];
  showOwnership: boolean;
}

defineProps<Props>();
const emit = defineEmits<{
  edit: [word: WordTableItem];
  delete: [word: WordTableItem];
}>();

const { t } = useI18n();

const getCategoryName = (category: string) => {
  if (!category) return '';
  return t('categories.' + category);
};

const getImageUrl = (path: string) => {
  if (!path) return '/placeholder-image.png';
  if (path.startsWith('http')) return path;
  return `/server${path}`;
};

const handleEdit = (word: WordTableItem) => {
  emit('edit', word);
};

const handleDelete = (word: WordTableItem) => {
  emit('delete', word);
};
</script>

<style scoped>
.words-table-container {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
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

.words-table {
  min-width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 1fr 120px 80px 100px 150px;
  background: var(--color-bg-secondary);
  border-bottom: 2px solid var(--color-border);
  font-weight: 600;
  color: var(--color-text-primary);
}

.table-header.show-ownership {
  grid-template-columns: 100px 1fr 120px 80px 100px 150px;
}

.header-cell {
  padding: 16px 12px;
  text-align: center;
  font-size: 0.9rem;
  border-right: 1px solid var(--color-border);
}

.header-cell:last-child {
  border-right: none;
}

.table-row {
  display: grid;
  grid-template-columns: 100px 1fr 120px 80px 100px 150px;
  border-bottom: 1px solid var(--color-border);
  transition: all 0.2s ease;
}

.table-row.show-ownership {
  grid-template-columns: 100px 1fr 120px 80px 100px 150px;
}

.table-row:hover {
  background: var(--color-bg-hover);
}

.cell {
  padding: 16px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid var(--color-border);
}

.cell:last-child {
  border-right: none;
}

.image-cell img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.word-cell {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.word-names {
  width: 100%;
}

.word-ko {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

.word-en {
  font-size: 0.9rem;
  color: var(--color-text-secondary);
  font-style: italic;
}

.category-badge {
  background: var(--color-primary);
  color: white;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 500;
}

.age-badge {
  background: var(--color-success);
  color: white;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
}

.ownership-badge {
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  font-weight: 500;
}

.ownership-badge.admin {
  background: var(--color-warning);
  color: white;
}

.ownership-badge.teacher {
  background: var(--color-info);
  color: white;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.edit-btn {
  background: var(--color-primary);
  color: white;
}

.edit-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
}

.delete-btn {
  background: var(--color-danger);
  color: white;
}

.delete-btn:hover {
  background: var(--color-danger-dark);
  transform: translateY(-1px);
}

@media (max-width: 1024px) {
  .table-header,
  .table-row {
    grid-template-columns: 80px 1fr 100px 70px 140px;
    font-size: 0.9rem;
  }
  
  .table-header.show-ownership,
  .table-row.show-ownership {
    grid-template-columns: 80px 1fr 100px 70px 90px 120px;
  }
  
  .image-cell img {
    width: 50px;
    height: 50px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 4px;
  }
  
  .action-btn {
    padding: 4px 8px;
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .cell {
    border-right: none;
    border-bottom: 1px solid var(--color-border-light);
    justify-content: flex-start;
    padding: 8px 16px;
  }
  
  .header-cell {
    display: none;
  }
  
  .table-row {
    background: var(--color-bg-secondary);
    margin-bottom: 16px;
    border-radius: var(--radius-lg);
    border: 1px solid var(--color-border);
  }
  
  .image-cell {
    justify-content: center;
  }
  
  .word-cell {
    text-align: center;
    align-items: center;
  }
  
  .category-cell,
  .age-cell,
  .ownership-cell {
    justify-content: center;
  }
  
  .actions-cell {
    justify-content: center;
  }
  
  .action-buttons {
    flex-direction: row;
  }
}
</style>