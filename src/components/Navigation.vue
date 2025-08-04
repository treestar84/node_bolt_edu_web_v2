<template>
  <nav class="navigation" role="navigation" :aria-label="$t('navigation.mainNavigation')">
    <div class="container">
      <div class="nav-content">
        <div class="nav-left">
          <router-link 
            to="/" 
            class="nav-brand"
            :aria-label="$t('navigation.goToHome')"
          >
            <span class="brand-text">{{ authStore.siteName }}</span>
          </router-link>
          
          <ul class="nav-menu desktop-menu" role="menubar" :aria-label="$t('navigation.desktopMenu')">
            <li role="none" v-for="item in menuItems" :key="item.path">
              <router-link 
                :to="item.path" 
                class="nav-item"
                :class="{ active: $route.path === item.path }"
                role="menuitem"
                :aria-current="$route.path === item.path ? 'page' : undefined"
              >
                <span class="nav-text">{{$t('navigation.'+item.key)}}</span>
              </router-link>
            </li>
          </ul>
        </div>
        
        <div class="nav-right">
          <!-- Mobile menu button -->
          <button 
            @click="toggleMobileMenu"
            @keydown.escape="closeMobileMenu"
            class="mobile-menu-btn"
            :class="{ active: mobileMenuOpen }"
            :aria-label="mobileMenuOpen ? $t('navigation.closeMenu') : $t('navigation.openMenu')"
            :aria-expanded="mobileMenuOpen"
            aria-controls="mobile-menu"
            type="button"
          >
            <span class="hamburger-line" aria-hidden="true"></span>
            <span class="hamburger-line" aria-hidden="true"></span>
            <span class="hamburger-line" aria-hidden="true"></span>
          </button>

          <div class="nav-controls desktop-controls">
            <div class="age-indicator" v-if="authStore.userProfile" role="status" :aria-label="$t('ui.childAge')">
              <span class="age-badge">{{ authStore.childAge }}세</span>
            </div>
            
            <div class="theme-toggle">
              <button 
                @click="toggleTheme"
                class="theme-btn"
                :aria-label="isDark ? $t('ui.theme.switchToLight') : $t('ui.theme.switchToDark')"
                :title="isDark ? $t('ui.theme.switchToLight') : $t('ui.theme.switchToDark')"
                type="button"
              >
                <span class="theme-icon" aria-hidden="true">{{ isDark ? '☀️' : '🌙' }}</span>
              </button>
            </div>
            
            <div class="language-selector">
              <button 
                @click="toggleLanguage"
                class="language-toggle-btn"
                :aria-label="$t('ui.language.select')"
                :title="$t('ui.language.select')"
                type="button"
              >
                <span class="current-language">
                  {{ store.currentLanguage === 'ko' ? '한글' : 'ENG' }}
                </span>
                <span class="language-icon" aria-hidden="true">🌐</span>
              </button>
            </div>
            
            <nav class="user-menu" v-if="authStore.isAuthenticated" :aria-label="$t('navigation.userMenu')">
              <router-link 
                to="/settings" 
                class="btn btn-sm btn-secondary"
                :aria-label="$t('navigation.goToSettings')"
              >
                {{$t('navigation.settings')}}
              </router-link>
              <router-link 
                to="/admin" 
                class="btn btn-sm btn-secondary"
                :aria-label="$t('navigation.goToAdmin')"
              >
                {{$t('navigation.admin')}}
              </router-link>
            </nav>
            
            <div class="auth-buttons" v-else>
              <router-link 
                to="/login" 
                class="btn btn-sm btn-primary"
                :aria-label="$t('navigation.goToLogin')"
              >
                {{$t('navigation.login')}}
              </router-link>
              <router-link 
                to="/admin" 
                class="btn btn-sm btn-secondary"
                :aria-label="$t('navigation.goToAdmin')"
              >
                {{$t('navigation.admin')}}
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
      
    <!-- Mobile menu overlay -->
    <div 
      v-if="mobileMenuOpen" 
      class="mobile-menu-overlay"
      @click="closeMobileMenu"
      @keydown.escape="closeMobileMenu"
      aria-hidden="true"
    ></div>
    
    <!-- Mobile menu -->
    <aside 
      id="mobile-menu"
      class="mobile-menu" 
      :class="{ open: mobileMenuOpen }"
      :aria-hidden="!mobileMenuOpen"
      :aria-label="$t('navigation.mobileMenu')"
    >
      <div class="mobile-menu-content">
        <div class="mobile-menu-header">
          <div class="age-indicator" v-if="authStore.userProfile" role="status" :aria-label="$t('ui.childAge')">
            <span class="age-badge">{{ authStore.childAge }}세</span>
          </div>
          
          <div class="mobile-controls">
            <div class="theme-toggle">
              <button 
                @click="toggleTheme"
                class="theme-btn"
                :aria-label="isDark ? $t('ui.theme.switchToLight') : $t('ui.theme.switchToDark')"
                :title="isDark ? $t('ui.theme.switchToLight') : $t('ui.theme.switchToDark')"
                type="button"
              >
                <span class="theme-icon" aria-hidden="true">{{ isDark ? '☀️' : '🌙' }}</span>
                <span class="theme-text">{{ isDark ? $t('ui.theme.light') : $t('ui.theme.dark') }}</span>
              </button>
            </div>
            
            <fieldset class="language-toggle" :aria-label="$t('ui.language.select')">
              <legend class="sr-only">{{ $t('ui.language.select') }}</legend>
              <button 
                @click="() => setLanguage('ko')"
                class="btn btn-secondary btn-sm"
                :class="{ active: store.currentLanguage === 'ko' }"
                :aria-pressed="store.currentLanguage === 'ko'"
                :aria-label="$t('ui.language.switchToKorean')"
                type="button"
              >
                한글
              </button>
              <button 
                @click="() => setLanguage('en')"
                class="btn btn-secondary btn-sm"
                :class="{ active: store.currentLanguage === 'en' }"
                :aria-pressed="store.currentLanguage === 'en'"
                :aria-label="$t('ui.language.switchToEnglish')"
                type="button"
              >
                ENG
              </button>
            </fieldset>
          </div>
        </div>
        
        <nav class="mobile-menu-items" :aria-label="$t('navigation.mobileMenuItems')">
          <router-link 
            v-for="item in menuItems" 
            :key="item.path"
            :to="item.path" 
            class="mobile-nav-item"
            :class="{ active: $route.path === item.path }"
            :aria-current="$route.path === item.path ? 'page' : undefined"
            @click="closeMobileMenu"
            @keydown.escape="closeMobileMenu"
          >
            <span class="nav-text">{{$t('navigation.'+item.key)}}</span>
          </router-link>
        </nav>
        
        <div class="mobile-menu-footer">
          <nav class="mobile-auth-buttons" v-if="authStore.isAuthenticated" :aria-label="$t('navigation.userMenu')">
            <router-link 
              to="/settings" 
              class="btn btn-sm btn-secondary" 
              @click="closeMobileMenu"
              :aria-label="$t('navigation.goToSettings')"
            >
              {{$t('navigation.settings')}}
            </router-link>
            <router-link 
              to="/admin" 
              class="btn btn-sm btn-secondary" 
              @click="closeMobileMenu"
              aria-label="관리자 페이지로 이동"
            >
              {{$t('navigation.admin')}}
            </router-link>
          </nav>
          
          <div class="mobile-auth-buttons" v-else>
            <router-link 
              to="/login" 
              class="btn btn-sm btn-primary" 
              @click="closeMobileMenu"
              :aria-label="$t('navigation.goToLogin')"
            >
              {{$t('navigation.login')}}
            </router-link>
            <router-link 
              to="/admin" 
              class="btn btn-sm btn-secondary" 
              @click="closeMobileMenu"
              aria-label="관리자 페이지로 이동"
            >
              {{$t('navigation.admin')}}
            </router-link>
          </div>
        </div>
      </div>
    </aside>
  </nav>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { getNextLanguage } from '@/utils/i18n';

const store = useAppStore();
const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();

const mobileMenuOpen = ref(false);
const lastFocusedElement = ref<HTMLElement | null>(null);

const menuItems = computed(() => [
  { key: 'words', path: '/words' },
  { key: 'quiz', path: '/quiz' },
  { key: 'puzzle', path: '/puzzle' },
  { key: 'coloring', path: '/coloring' },
  { key: 'music', path: '/music' },
  { key: 'storybook', path: '/books' },
  { key: 'achievements', path: '/achievements' }
]);

const setLanguage = async (lang: 'ko' | 'en') => {
  await store.setLanguage(lang);
};

// 언어 토글 함수 (한글 ↔ 영어)
const toggleLanguage = async () => {
  const nextLang = getNextLanguage(store.currentLanguage);
  await setLanguage(nextLang as 'ko' | 'en');
};

const toggleMobileMenu = () => {
  if (!mobileMenuOpen.value) {
    // Store the currently focused element
    lastFocusedElement.value = document.activeElement as HTMLElement;
  }
  
  mobileMenuOpen.value = !mobileMenuOpen.value;
  
  // Prevent body scroll when menu is open
  if (mobileMenuOpen.value) {
    document.body.style.overflow = 'hidden';
    
    // Focus the first menu item after the menu opens
    nextTick(() => {
      const firstMenuItem = document.querySelector('.mobile-nav-item') as HTMLElement;
      if (firstMenuItem) {
        firstMenuItem.focus();
      }
    });
  } else {
    document.body.style.overflow = '';
    
    // Return focus to the menu button
    nextTick(() => {
      if (lastFocusedElement.value) {
        lastFocusedElement.value.focus();
      }
    });
  }
};

const closeMobileMenu = () => {
  if (mobileMenuOpen.value) {
    mobileMenuOpen.value = false;
    document.body.style.overflow = '';
    
    // Return focus to the last focused element (usually the menu button)
    nextTick(() => {
      if (lastFocusedElement.value) {
        lastFocusedElement.value.focus();
      }
    });
  }
};

// Handle keyboard navigation
const handleKeydown = (event: KeyboardEvent) => {
  if (!mobileMenuOpen.value) return;
  
  if (event.key === 'Escape') {
    closeMobileMenu();
    event.preventDefault();
  } else if (event.key === 'Tab') {
    // Trap focus within the mobile menu
    const focusableElements = document.querySelectorAll(
      '#mobile-menu button, #mobile-menu a, #mobile-menu [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  // Cleanup: restore body scroll if component is unmounted while menu is open
  if (mobileMenuOpen.value) {
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.navigation {
  background: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(16px);
  font-family: 'Inter', 'Pretendard', Arial, sans-serif !important;
  font-weight: 500;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 48px;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-brand {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: 700;
  font-size: 1.25rem;
  letter-spacing: -0.025em;
  z-index: 101;
  transition: opacity 0.15s ease;
}

.nav-brand:hover {
  opacity: 0.8;
}

.nav-brand:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
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

.mobile-menu-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
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
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 48px;
}

.nav-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--color-text-muted);
  font-weight: 500;
  font-size: 0.875rem;
  transition: color 0.15s ease;
  position: relative;
}

.nav-item:hover {
  color: var(--color-text-primary);
}

.nav-item:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
  color: var(--color-text-primary);
}

.nav-item.active {
  color: var(--color-text-primary);
}

.nav-item.active::after {
  content: '';
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-primary);
  border-radius: 1px;
}

.nav-text {
  color: inherit;
  font-weight: inherit;
}

.desktop-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.age-indicator {
  display: flex;
  align-items: center;
}

.age-badge {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  border: 1px solid var(--color-border);
}

/* Language selector */
.language-selector {
  display: flex;
  align-items: center;
}

.language-toggle-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 70px;
  justify-content: center;
}

.language-toggle-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
  transform: translateY(-1px);
}

.language-toggle-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-md);
}

.language-toggle-btn:active {
  transform: translateY(0);
}

.current-language {
  font-weight: 600;
  letter-spacing: 0.025em;
}

.language-icon {
  font-size: 0.875rem;
  opacity: 0.7;
}

.theme-toggle {
  display: flex;
  align-items: center;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
  min-height: 36px;
}

.theme-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-dark);
  color: var(--color-text-primary);
}

.theme-btn:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.theme-icon {
  font-size: 1rem;
  display: flex;
  align-items: center;
}

.theme-text {
  font-weight: 500;
  display: none;
}

.auth-buttons {
  display: flex;
  gap: 8px;
}

/* Mobile menu overlay */
.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 99;
  opacity: 0;
  animation: fadeIn 0.2s ease forwards;
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
  width: 280px;
  height: 100vh;
  height: 100dvh; /* 동적 뷰포트 높이 사용 */
  background: var(--color-bg-primary);
  border-left: 1px solid var(--color-border);
  z-index: 100;
  transition: right 0.25s ease;
  overflow: hidden; /* 스크롤 제거 */
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
}

.mobile-menu.open {
  right: 0;
}

.mobile-menu-content {
  padding: 16px 24px 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  overflow: hidden;
}

.mobile-menu-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 60px; /* 네비게이션 높이만큼 여백 */
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
  flex-shrink: 0; /* 고정 크기 */
}

.mobile-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-controls .theme-btn {
  justify-content: flex-start;
}

.mobile-controls .theme-text {
  display: block;
}

.mobile-menu-items {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  min-height: 0; /* flexbox 스크롤 fix */
}

.mobile-nav-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  text-decoration: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: color 0.15s ease;
  font-size: 1rem;
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0; /* 고정 크기 */
}

.mobile-nav-item:hover,
.mobile-nav-item.active {
  color: var(--color-text-primary);
}

.mobile-nav-item:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 4px;
  background: var(--color-bg-secondary);
}

.mobile-menu-footer {
  border-top: 1px solid var(--color-border);
  padding-top: 16px;
  flex-shrink: 0; /* 고정 크기 */
}

.mobile-auth-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mobile-auth-buttons .btn {
  width: 100%;
  justify-content: center;
  padding: 10px 16px;
  font-size: 0.875rem;
}

/* Responsive breakpoints */
@media (max-width: 1024px) {
  .desktop-menu {
    gap: 24px;
  }
  
  .nav-content {
    padding: 18px 22px;
  }
  
  .desktop-controls {
    gap: 12px;
  }
}

@media (max-width: 900px) {
  .mobile-menu-btn {
    display: flex;
  }
  
  .desktop-menu,
  .desktop-controls {
    display: none;
  }
}

@media (max-width: 768px) {
  .nav-content {
    padding: 16px 20px;
  }
  
  .nav-brand {
    font-size: 1.125rem;
  }
  
  .mobile-menu {
    width: 100%;
  }
  
  .mobile-menu-content {
    padding: 16px 20px 20px;
  }
  
  .mobile-menu-header {
    padding-top: 56px; /* 더 작은 네비게이션 높이 */
  }
}

@media (max-width: 480px) {
  .nav-content {
    padding: 12px 16px;
  }
  
  .nav-brand {
    font-size: 1rem;
  }
  
  .mobile-menu {
    width: 100%;
  }
  
  .mobile-menu-content {
    padding: 12px 16px 16px;
  }
  
  .mobile-menu-header {
    padding-top: 52px; /* 더 작은 화면에서 네비게이션 높이 */
    gap: 8px;
  }
  
  .mobile-nav-item {
    padding: 10px 0;
    font-size: 0.875rem;
  }
}

/* Touch-friendly improvements */
@media (hover: none) and (pointer: coarse) {
  .mobile-nav-item {
    padding: 14px 0;
    min-height: 44px; /* 터치 친화적 최소 높이 */
  }
  
  .mobile-menu-btn {
    width: 44px;
    height: 44px;
  }
  
  .hamburger-line {
    height: 3px;
  }
  
  .mobile-auth-buttons .btn {
    min-height: 44px;
    padding: 12px 16px;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .nav-item:focus,
  .nav-brand:focus,
  .mobile-menu-btn:focus,
  .theme-btn:focus,
  .language-toggle .btn:focus,
  .mobile-nav-item:focus {
    outline: 3px solid currentColor;
    outline-offset: 2px;
  }
  
  .mobile-menu {
    border-left: 2px solid var(--color-border-dark);
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .nav-brand,
  .nav-item,
  .theme-btn,
  .language-toggle .btn,
  .mobile-menu,
  .mobile-menu-overlay,
  .hamburger-line {
    transition: none;
  }
  
  .mobile-menu-overlay {
    animation: none;
  }
}
</style>