<template>
  <nav class="navigation">
    <div class="container">
      <div class="nav-content">
        <router-link to="/" class="nav-brand">
          <span class="brand-text">{{ authStore.siteName }}</span>
        </router-link>
        
        <div class="nav-menu">
          <router-link 
            v-for="item in menuItems" 
            :key="item.path"
            :to="item.path" 
            class="nav-item"
            :class="{ active: $route.path === item.path }"
          >
            <span class="nav-text">{{$t('menu.'+item.key)}}</span>
          </router-link>
        </div>

        <div class="nav-controls">
          <div class="age-indicator" v-if="authStore.userProfile">
            <span class="age-badge">{{ authStore.childAge }}세</span>
          </div>
          
          <div class="language-toggle">
            <button 
              @click="toggleLanguage"
              class="btn btn-secondary btn-sm"
              :class="{ active: store.currentLanguage === 'ko' }"
            >
              한글
            </button>
            <button 
              @click="toggleLanguage"
              class="btn btn-secondary btn-sm"
              :class="{ active: store.currentLanguage === 'en' }"
            >
              ENG
            </button>
          </div>
          
          <div class="user-menu" v-if="authStore.isAuthenticated">
            <router-link to="/settings" class="btn btn-sm btn-secondary">
              {{$t('menu.settings')}}
            </router-link>
            <router-link to="/admin" class="btn btn-sm btn-secondary">
              {{$t('menu.admin')}}
            </router-link>
          </div>
          
          <div class="auth-buttons" v-else>
            <router-link to="/login" class="btn btn-sm btn-primary">
              {{$t('menu.login')}}
            </router-link>
            <router-link to="/admin" class="btn btn-sm btn-secondary">
              {{$t('menu.admin')}}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const store = useAppStore();
const authStore = useAuthStore();

const menuItems = computed(() => [
  { key: 'words', path: '/words' },
  { key: 'quiz', path: '/quiz' },
  { key: 'puzzle', path: '/puzzle' },
  { key: 'storybook', path: '/books' },
  { key: 'achievements', path: '/achievements' }
]);

const toggleLanguage = () => {
  store.setLanguage(store.currentLanguage === 'ko' ? 'en' : 'ko');
};
</script>

<style scoped>
.navigation {
  background: var(--color-bg-card);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-md) 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(10px);
  font-family: 'Pretendard', 'Noto Sans KR', Arial, sans-serif !important;
  letter-spacing: -0.01em;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-lg);
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}

.brand-text {
  color: var(--color-text-primary);
}

.nav-menu {
  display: flex;
  gap: var(--spacing-md);
  flex: 1;
  justify-content: center;
  font-family: 'Pretendard', 'Noto Sans KR', Arial, sans-serif !important;
  letter-spacing: -0.01em;
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
  min-width: 100px;
  justify-content: center;
  font-family: 'Pretendard', 'Noto Sans KR', Arial, sans-serif !important;
  letter-spacing: -0.01em;
}

.nav-item:hover,
.nav-item.active {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  transform: translateY(-2px);
}

.nav-text {
  color: inherit;
  font-weight: inherit;
  font-family: 'Pretendard', 'Noto Sans KR', Arial, sans-serif !important;
  letter-spacing: -0.01em;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.age-indicator {
  display: flex;
  align-items: center;
}

.age-badge {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 700;
}

.language-toggle {
  display: flex;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: 2px;
  gap: 2px;
}

.language-toggle .btn {
  border: none;
  background: transparent;
  min-height: 36px;
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--color-text-primary);
  font-weight: 600;
}

.language-toggle .btn.active {
  background: var(--color-primary);
  color: white;
}

.auth-buttons {
  display: flex;
  gap: var(--spacing-sm);
}

@media (max-width: 1024px) {
  .nav-content {
    flex-wrap: wrap;
    justify-content: center;
  }
  .nav-menu {
    order: 3;
    width: 100%;
    justify-content: center;
    margin-top: var(--spacing-md);
  }
  .nav-brand {
    order: 1;
  }
  .nav-controls {
    order: 2;
  }
}

@media (max-width: 768px) {
  .nav-content {
    flex-direction: column;
    gap: var(--spacing-md);
  }
  
  .nav-menu {
    order: 2;
    width: 100%;
    flex-wrap: wrap;
  }
  
  .nav-controls {
    order: 1;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-item {
    flex: 1;
    min-width: auto;
  }
  
  .nav-text {
    font-size: 0.875rem;
  }
}
</style>