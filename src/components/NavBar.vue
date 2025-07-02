<template>
  <nav>
    <ul>
      <li><router-link to="/">{{$t('menu.home')}}</router-link></li>
      <li><router-link to="/books">{{$t('menu.books')}}</router-link></li>
      <li><router-link to="/words">{{$t('menu.words')}}</router-link></li>
      <li><router-link to="/badges">{{$t('menu.badges')}}</router-link></li>
      <!-- 기타 메뉴도 동일하게 $t 사용 -->
    </ul>
    <!-- 언어 토글 버튼 예시 -->
    <button @click="toggleLang">{{ $i18n.locale === 'ko' ? 'ENG' : '한글' }}</button>
  </nav>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
const { locale } = useI18n();
function toggleLang() {
  locale.value = locale.value === 'ko' ? 'en' : 'ko';
}
</script> 