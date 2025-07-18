<template>
  <nav class="navigation">
    <div class="container">
      <div class="nav-content">
        <router-link to="/" class="nav-brand">
          <span class="brand-text">{{ authStore.siteName }}</span>
        </router-link>
        
        <!-- Mobile menu button -->
        <button 
          @click="toggleMobileMenu"
          class="mobile-menu-btn"
          :class="{ active: mobileMenuOpen }"
          aria-label="메뉴 열기/닫기"
        >
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
          <span class="hamburger-line"></span>
        </button>
        
        <!-- Desktop menu -->
        <div class="nav-menu desktop-menu">
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

        <div class="nav-controls desktop-controls">
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
      
      <!-- Mobile menu overlay -->
      <div 
        v-if="mobileMenuOpen" 
        class="mobile-menu-overlay"
        @click="closeMobileMenu"
      ></div>
      
      <!-- Mobile menu -->
      <div class="mobile-menu" :class="{ open: mobileMenuOpen }">
        <div class="mobile-menu-content">
          <div class="mobile-menu-header">
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
          </div>
          
          <div class="mobile-menu-items">
            <router-link 
              v-for="item in menuItems" 
              :key="item.path"
              :to="item.path" 
              class="mobile-nav-item"
              :class="{ active: $route.path === item.path }"
              @click="closeMobileMenu"
            >
              <span class="nav-text">{{$t('menu.'+item.key)}}</span>
            </router-link>
          </div>
          
          <div class="mobile-menu-footer">
            <div class="mobile-auth-buttons" v-if="authStore.isAuthenticated">
              <router-link to="/settings" class="btn btn-sm btn-secondary" @click="closeMobileMenu">
                {{$t('menu.settings')}}
              </router-link>
              <router-link to="/admin" class="btn btn-sm btn-secondary" @click="closeMobileMenu">
                {{$t('menu.admin')}}
              </router-link>
            </div>
            
            <div class="mobile-auth-buttons" v-else>
              <router-link to="/login" class="btn btn-sm btn-primary" @click="closeMobileMenu">
                {{$t('menu.login')}}
              </router-link>
              <router-link to="/admin" class="btn btn-sm btn-secondary" @click="closeMobileMenu">
                {{$t('menu.admin')}}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';

const store = useAppStore();
const authStore = useAuthStore();

const mobileMenuOpen = ref(false);

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

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
  
  // Prevent body scroll when menu is open
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
};

const closeMobileMenu = () => {
  mobileMenuOpen.value = false;
  document.body.style.overflow = '';
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
  position: relative;
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
  z-index: 101;
}

.brand-text {
  color: var(--color-text-primary);
}

/* Mobile menu button */
.mobile-menu-btn {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 101;
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background: var(--color-text-primary);
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-btn.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(7px, 7px);
}

.mobile-menu-btn.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-btn.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -7px);
}

/* Desktop menu */
.desktop-menu {
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

.desktop-controls {
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

/* Mobile menu overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  opacity: 0;
  animation: fadeIn 0.3s ease forwards;
}

@keyframes fadeIn {
  to {
    opacity: 1;
  }
}

/* Mobile menu */
.mobile-menu {
  position: fixed;
  top: 0;
  right: -100%;
  width: 80%;
  max-width: 320px;
  height: 100vh;
  background: var(--color-bg-card);
  border-left: 1px solid var(--color-border);
  z-index: 100;
  transition: right 0.3s ease;
  overflow-y: auto;
}

.mobile-menu.open {
  right: 0;
}

.mobile-menu-content {
  padding: var(--spacing-xl);
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--spacing-xl);
}

.mobile-menu-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
  padding-top: var(--spacing-2xl);
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--spacing-lg);
}

.mobile-menu-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  padding: var(--spacing-lg) var(--spacing-md);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 600;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  font-size: 1.1rem;
  font-family: 'Pretendard', 'Noto Sans KR', Arial, sans-serif !important;
  letter-spacing: -0.01em;
}

.mobile-nav-item:hover,
.mobile-nav-item.active {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
  border-color: var(--color-primary);
}

.mobile-menu-footer {
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-lg);
}

.mobile-auth-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.mobile-auth-buttons .btn {
  width: 100%;
  justify-content: center;
  padding: var(--spacing-md);
  font-size: 1rem;
}

/* Responsive breakpoints */
@media (max-width: 1024px) {
  .desktop-menu {
    gap: var(--spacing-sm);
  }
  
  .nav-item {
    padding: var(--spacing-sm) var(--spacing-md);
    min-width: 80px;
  }
  
  .nav-text {
    font-size: 0.9rem;
  }
}

@media (max-width: 768px) {
  .mobile-menu-btn {
    display: flex;
  }
  
  .desktop-menu,
  .desktop-controls {
    display: none;
  }
  
  .nav-content {
    justify-content: space-between;
  }
  
  .nav-brand {
    font-size: 1.25rem;
  }
  
  .mobile-menu {
    width: 85%;
    max-width: 280px;
  }
  
  .mobile-menu-content {
    padding: var(--spacing-lg);
  }
  
  .mobile-menu-header {
    padding-top: var(--spacing-lg);
  }
  
  .mobile-nav-item {
    font-size: 1rem;
    padding: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .navigation {
    padding: var(--spacing-sm) 0;
  }
  
  .nav-brand {
    font-size: 1.1rem;
  }
  
  .mobile-menu {
    width: 90%;
    max-width: 260px;
  }
  
  .mobile-menu-content {
    padding: var(--spacing-md);
  }
  
  .mobile-nav-item {
    font-size: 0.95rem;
    padding: var(--spacing-sm) var(--spacing-md);
  }
  
  .age-badge {
    font-size: 0.7rem;
    padding: var(--spacing-xs);
  }
  
  .language-toggle .btn {
    font-size: 0.8rem;
    padding: var(--spacing-xs) var(--spacing-sm);
    min-height: 32px;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .nav-item:hover {
    transform: none;
  }
  
  .mobile-nav-item {
    padding: var(--spacing-lg);
    font-size: 1.1rem;
  }
  
  .mobile-menu-btn {
    width: 40px;
    height: 40px;
  }
  
  .hamburger-line {
    height: 4px;
  }
}
</style>