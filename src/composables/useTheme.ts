import { ref, computed, watchEffect } from 'vue'

export type Theme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'app-theme'

// 기본값은 다크모드
const currentTheme = ref<Theme>('dark')

// 로컬 스토리지에서 테마 불러오기
const loadTheme = (): Theme => {
  if (typeof window === 'undefined') return 'dark'
  
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') {
    return stored
  }
  
  // 시스템 설정 확인 (다크모드가 기본이므로 시스템 설정은 참고만)
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

// 초기화
currentTheme.value = loadTheme()

export const useTheme = () => {
  const isDark = computed(() => currentTheme.value === 'dark')
  const isLight = computed(() => currentTheme.value === 'light')

  const setTheme = (theme: Theme) => {
    currentTheme.value = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }

  const toggleTheme = () => {
    setTheme(isDark.value ? 'light' : 'dark')
  }

  // 시스템 테마 변경 감지
  const watchSystemTheme = () => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      // 사용자가 수동으로 설정한 경우가 아니라면 시스템 설정 따르기
      const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (!storedTheme) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }

  // HTML 클래스 적용
  watchEffect(() => {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(currentTheme.value)
    
    // CSS 변수 업데이트를 위한 data 속성 설정
    root.setAttribute('data-theme', currentTheme.value)
  })

  return {
    theme: computed(() => currentTheme.value),
    isDark,
    isLight,
    setTheme,
    toggleTheme,
    watchSystemTheme
  }
}