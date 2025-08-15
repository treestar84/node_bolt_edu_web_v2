<template>
  <nav class="navbar">
    <ul class="nav-links">
      <li><router-link to="/">{{t('navigation.home')}}</router-link></li>
      <li><router-link to="/books">{{t('navigation.books')}}</router-link></li>
      <li><router-link to="/words">{{t('navigation.words')}}</router-link></li>
      <li><router-link to="/badges">{{t('navigation.badges')}}</router-link></li>
      <li><router-link to="/music">{{t('navigation.music')}}</router-link></li>
      <li><router-link to="/achievements">{{t('navigation.achievements')}}</router-link></li>
    </ul>
    <div class="nav-controls">
      <button @click="toggleLang">{{ $i18n.locale === 'ko' ? 'ENG' : '한글' }}</button>
      <!-- 다크 모드 토글 버튼은 여기에 추가될 수 있습니다. -->
    </div>
  </nav>
</template>

<script setup>
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
function toggleLang() {
  locale.value = locale.value === 'ko' ? 'en' : 'ko';
}
</script>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: var(--color-bg-primary);
  border-bottom: 1px solid var(--color-border);
}

.nav-links {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
  gap: 1.5rem;
}

.nav-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--color-text-primary);
  font-weight: 500;
  transition: color 0.3s ease;
}

.nav-links a:hover,
.nav-links a.router-link-exact-active {
  color: var(--color-primary);
}

button {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

button:hover {
  background-color: var(--color-bg-secondary);
  border-color: var(--color-primary);
}
</style> 