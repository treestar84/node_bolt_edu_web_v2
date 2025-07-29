<template>
  <header class="admin-header">
    <div class="container">
      <div class="header-content">
        <div class="admin-brand">
          <span class="brand-text">관리자 패널</span>
        </div>
        
        <nav class="admin-nav">
          <router-link 
            v-for="item in navItems" 
            :key="item.path"
            :to="item.path" 
            class="nav-item"
            :class="{ active: $route.path === item.path }"
          >
            <span class="nav-text">{{ item.name }}</span>
          </router-link>
        </nav>

        <div class="header-actions">
          <router-link to="/api-guide" class="btn btn-sm btn-secondary">
            API 가이드
          </router-link>
          <router-link to="/" class="btn btn-sm btn-secondary">
            사용자 화면
          </router-link>
          <button @click="handleLogout" class="btn btn-sm btn-danger">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';

const router = useRouter();
const store = useAppStore();

const navItems = computed(() => [
  { name: '대시보드', path: '/admin/dashboard' },
  { name: '단어 관리', path: '/admin/words' },
  { name: '책 관리', path: '/admin/books' },
  { name: '뱃지 관리', path: '/admin/badges' },
  { name: 'API 키', path: '/admin/api-keys' }
]);

const handleLogout = async () => {
  await store.adminLogout();
  router.push('/admin');
};
</script>

<style scoped>
.admin-header {
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-weight: 800;
  font-size: 1.5rem;
  color: var(--color-text-primary);
}

.brand-text {
  color: var(--color-text-primary);
}

.admin-nav {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  justify-content: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 600;
  transition: all 0.2s ease;
  min-width: 120px;
  justify-content: center;
}

.nav-item:hover,
.nav-item.active {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  transform: translateY(-1px);
}

.nav-item.active {
  background: var(--color-primary);
  color: var(--color-bg-primary);
}

.nav-text {
  color: inherit;
  font-weight: inherit;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .admin-nav {
    order: 1;
    width: 100%;
    justify-content: space-around;
    flex-wrap: wrap;
  }
  
  .nav-item {
    flex: 1;
    min-width: auto;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .nav-text {
    font-size: 0.875rem;
  }
  
  .header-actions {
    order: 0;
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}
</style>