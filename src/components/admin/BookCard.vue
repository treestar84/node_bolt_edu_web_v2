<template>
  <div class="book-card">
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
          <span v-if="showOwnership" class="owner-tag" :class="book.ownerType">
            {{ book.ownerType === 'global' ? '공용' : '개인' }}
          </span>
        </div>
      </div>
    </div>
    <div class="book-info">
      <h3 class="book-title">{{ book.title }}</h3>
      <div class="book-actions">
        <button @click="$emit('edit', book)" class="btn btn-sm btn-secondary">
          수정
        </button>
        <button @click="$emit('delete', book)" class="btn btn-sm btn-danger">
          삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Book } from '@/types';

interface Props {
  book: Book;
  showOwnership?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  edit: [book: Book];
  delete: [book: Book];
  videoCanPlay: [bookId: string];
  videoError: [bookId: string];
}>();

const getImageUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/uploads/')) {
    return '/server' + url;
  }
  if (url.startsWith('/server/uploads/')) {
    return url;
  }
  return url;
};

const onVideoCanPlay = () => {
  emit('videoCanPlay', props.book.id);
};

const onVideoError = () => {
  emit('videoError', props.book.id);
};
</script>

<style scoped>
.book-card {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
}

.book-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--color-primary);
}

.book-cover {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: var(--color-bg-tertiary);
}

.book-cover img,
.book-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-overlay {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  gap: 4px;
}

.no-cover-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-muted);
  text-align: center;
  padding: 16px;
}

.placeholder-icon {
  font-size: 2rem;
  margin-bottom: 8px;
}

.placeholder-text {
  font-size: 0.875rem;
  margin: 0;
}

.book-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  color: white;
  padding: 12px;
}

.book-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.page-count,
.age-range,
.owner-tag {
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 500;
}

.owner-tag.global {
  background: rgba(34, 197, 94, 0.8);
}

.owner-tag.user {
  background: rgba(59, 130, 246, 0.8);
}

.book-info {
  padding: 16px;
}

.book-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.book-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 0.875rem;
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.btn-danger {
  background: var(--color-danger);
  color: white;
}

.btn-danger:hover {
  background: var(--color-danger-dark);
}
</style>