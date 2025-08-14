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
              <span class="age-badge">{{ $t('settings.age' + authStore.childAge) }}</span>
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
              <div class="language-dropdown" :class="{ open: languageDropdownOpen }">
                <button 
                  ref="languageButtonRef"
                  @click="toggleLanguageDropdown"
                  class="language-toggle-btn"
                  :aria-label="$t('ui.language.select')"
                  :title="`${$t('ui.language.select')} (${readyLanguages.length} ${$t('multiLang.languages')})`"
                  :aria-expanded="languageDropdownOpen"
                  type="button"
                >
                  <span class="language-flag">{{ currentLanguageInfo.flag }}</span>
                  <span class="current-language">{{ currentLanguageInfo.name }}</span>
                  <span class="dropdown-icon" :class="{ rotated: languageDropdownOpen }">▼</span>
                  <span v-if="readyLanguages.length > 2" class="language-count">{{ readyLanguages.length }}</span>
                </button>
                
                <!-- Teleport를 사용해서 드롭다운을 body 직하에 렌더링 -->
                <Teleport to="body">
                  <div 
                    v-if="languageDropdownOpen" 
                    class="language-dropdown-menu"
                    :style="dropdownPosition"
                  >
                    <button
                      v-for="lang in readyLanguages"
                      :key="lang"
                      @click="selectLanguage(lang)"
                      class="language-option"
                      :class="{ active: store.currentLanguage === lang }"
                      :aria-pressed="store.currentLanguage === lang"
                    >
                      <span class="option-flag">{{ getLanguageFlag(lang) }}</span>
                      <span class="option-name">{{ getLanguageDisplayName(lang) }}</span>
                      <span class="option-completeness">{{ getLanguageCompleteness(lang) }}%</span>
                      <span v-if="store.currentLanguage === lang" class="current-indicator">✓</span>
                    </button>
                  </div>
                </Teleport>
              </div>
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
            <span class="age-badge">{{ authStore.childAge }}{{ $t('settings.age') }}</span>
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
            
            <div class="mobile-language-selector">
              <h4 class="mobile-section-title">🌍 {{ $t('ui.language.select') }} ({{ readyLanguages.length }}{{ $t('multiLang.languages') }})</h4>
              <div class="mobile-language-grid">
                <button
                  v-for="lang in readyLanguages"
                  :key="lang"
                  @click="() => setLanguage(lang)"
                  class="mobile-language-btn"
                  :class="{ active: store.currentLanguage === lang }"
                  :aria-pressed="store.currentLanguage === lang"
                  type="button"
                >
                  <span class="mobile-lang-flag">{{ getLanguageFlag(lang) }}</span>
                  <span class="mobile-lang-name">{{ getLanguageDisplayName(lang) }}</span>
                  <span class="mobile-lang-completeness">{{ getLanguageCompleteness(lang) }}%</span>
                  <span v-if="store.currentLanguage === lang" class="mobile-current-indicator">✓</span>
                </button>
              </div>
            </div>
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
              :aria-label="$t('navigation.goToAdmin')"
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
              :aria-label="$t('navigation.goToAdmin')"
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
import { computed, ref, nextTick, onMounted, onUnmounted, Teleport } from 'vue';
import { useAppStore } from '@/stores/app';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { useAvailableLanguages } from '@/composables/useAvailableLanguages';
import type { Language } from '@/types';

const store = useAppStore();
const authStore = useAuthStore();
const { isDark, toggleTheme } = useTheme();
const { availableLanguages, readyLanguages, getLanguageDisplayName, getLanguageFlag, getNextLanguage, getLanguageCompleteness } = useAvailableLanguages();

// 디버깅: 언어 상태 모니터링
onMounted(() => {
  console.log('🔍 네비게이션 마운트됨 - 언어 상태 확인:');
  console.log('사용 가능한 언어:', availableLanguages.value);
  console.log('준비된 언어:', readyLanguages.value);
  console.log('현재 단어 수:', store.currentWords.length);
});

const mobileMenuOpen = ref(false);
const languageDropdownOpen = ref(false);
const lastFocusedElement = ref<HTMLElement | null>(null);
const languageButtonRef = ref<HTMLElement | null>(null);

// 드롭다운 위치 계산
const dropdownPosition = computed(() => {
  if (!languageButtonRef.value || !languageDropdownOpen.value) {
    return { display: 'none' };
  }
  
  const rect = languageButtonRef.value.getBoundingClientRect();
  return {
    position: 'fixed',
    top: `${rect.bottom + 8}px`,
    left: `${rect.right - 220}px`, // 드롭다운 너비에 맞춰 오른쪽 정렬
    zIndex: 9999,
    minWidth: '220px'
  };
});

const menuItems = computed(() => [
  { key: 'words', path: '/words' },
  { key: 'quiz', path: '/quiz' },
  { key: 'puzzle', path: '/puzzle' },
  { key: 'coloring', path: '/coloring' },
  { key: 'music', path: '/music' },
  { key: 'storybook', path: '/books' },
  { key: 'achievements', path: '/achievements' }
]);

const setLanguage = async (lang: Language) => {
  await store.setLanguage(lang);
};

// 언어 드롭다운 토글
const toggleLanguageDropdown = () => {
  languageDropdownOpen.value = !languageDropdownOpen.value;
};

// 언어 선택
const selectLanguage = async (lang: Language) => {
  await setLanguage(lang);
  languageDropdownOpen.value = false;
};

// 언어 토글 함수 (동적 다국어 지원) - 호환성을 위해 유지
const toggleLanguage = async () => {
  const nextLang = getNextLanguage(store.currentLanguage);
  await setLanguage(nextLang);
};

// 현재 언어의 표시 정보
const currentLanguageInfo = computed(() => {
  const lang = store.currentLanguage;
  return {
    flag: getLanguageFlag(lang),
    name: getLanguageDisplayName(lang),
    completeness: getLanguageCompleteness(lang)
  };
});

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

// 드롭다운 외부 클릭 시 닫기
const handleClickOutside = (event: Event) => {
  if (!languageDropdownOpen.value) return;
  
  const target = event.target as Node;
  const dropdown = document.querySelector('.language-dropdown');
  const dropdownMenu = document.querySelector('.language-dropdown-menu');
  
  // 언어 버튼이나 드롭다운 메뉴 내부 클릭이 아닌 경우 닫기
  if (dropdown && !dropdown.contains(target) && 
      dropdownMenu && !dropdownMenu.contains(target)) {
    languageDropdownOpen.value = false;
  }
};

// 창 크기 변경 시 드롭다운 위치 업데이트
const handleResize = () => {
  if (languageDropdownOpen.value) {
    // 위치 재계산을 위해 computed를 다시 트리거
    nextTick();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown);
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('resize', handleResize);
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
  overflow: visible; /* 드롭다운 메뉴가 영역을 벗어날 수 있도록 허용 */
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  overflow: visible; /* 컨테이너도 드롭다운을 허용 */
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  overflow: visible; /* nav-content도 드롭다운을 허용 */
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
  overflow: visible; /* nav-right도 드롭다운을 허용 */
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
  overflow: visible; /* desktop-controls도 드롭다운을 허용 */
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
  position: relative;
  z-index: 1000; /* 언어 선택기 자체의 z-index */
}

.language-dropdown {
  position: relative;
  z-index: 1001; /* 드롭다운 컨테이너의 z-index */
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
  position: relative;
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

.language-flag {
  font-size: 1.2rem;
}

.language-count {
  position: absolute;
  top: -4px;
  right: -4px;
  background: var(--color-primary);
  color: white;
  font-size: 0.6rem;
  font-weight: 600;
  padding: 1px 4px;
  border-radius: 50%;
  min-width: 16px;
  text-align: center;
  line-height: 1.2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.dropdown-icon {
  font-size: 0.75rem;
  transition: transform 0.2s ease;
  color: var(--color-text-secondary);
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

/* 언어 드롭다운 메뉴 (Teleport로 body에 렌더링됨) */
.language-dropdown-menu {
  background: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
  /* 스크롤바 스타일링 */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border) transparent;
}

.language-dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.language-dropdown-menu::-webkit-scrollbar-track {
  background: transparent;
}

.language-dropdown-menu::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 3px;
}

.language-dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-dark);
}

.language-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.875rem;
}

.language-option:hover {
  background: var(--color-bg-secondary);
}

.language-option.active {
  background: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.option-flag {
  font-size: 1.1rem;
  width: 20px;
  text-align: center;
}

.option-name {
  flex: 1;
  font-weight: 500;
}

.option-completeness {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  padding: 2px 6px;
  background: var(--color-bg-tertiary);
  border-radius: 4px;
}

.current-indicator {
  color: var(--color-primary);
  font-weight: 600;
}

/* 모바일 언어 선택 */
.mobile-language-selector {
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 12px;
  margin-bottom: 12px;
}

.mobile-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
}

.mobile-language-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.mobile-language-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.75rem;
}

.mobile-language-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.mobile-language-btn.active {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
  color: var(--color-primary-dark);
}

.mobile-lang-flag {
  font-size: 1rem;
}

.mobile-lang-name {
  flex: 1;
  text-align: left;
  margin-left: 6px;
  font-weight: 500;
}

.mobile-lang-completeness {
  font-size: 0.6rem;
  color: var(--color-text-secondary);
  background: var(--color-bg-tertiary);
  padding: 1px 4px;
  border-radius: 3px;
}

.mobile-current-indicator {
  color: var(--color-primary);
  font-weight: 600;
  margin-left: 4px;
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