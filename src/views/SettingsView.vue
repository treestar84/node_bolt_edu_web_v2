<template>
  <div class="settings-view">
    <Navigation />
    
    <main class="main-content">
      <div class="container">
        <div class="page-header">
          <h1 class="page-title">{{$t('settings.title')}}</h1>
          <p class="page-description">
            {{$t('settings.desc')}}
          </p>
        </div>

        <div class="settings-container">
          <div class="settings-card">
            <div class="card-header">
              <h2>기본 정보</h2>
            </div>
            
            <form @submit.prevent="saveSettings" class="settings-form">
              <div class="form-group">
                <label class="form-label">{{$t('settings.username')}}</label>
                <input 
                  v-model="formData.username" 
                  type="text" 
                  class="form-input" 
                  placeholder="{{$t('settings.usernamePlaceholder')}}"
                  required 
                  disabled
                />
                <div class="form-hint">
                  아이디는 변경할 수 없습니다
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">{{$t('settings.userType')}}</label>
                <select v-model="formData.userType" class="form-input" required>
                  <option value="parent">{{$t('settings.parent')}}</option>
                  <option value="teacher">{{$t('settings.teacher')}}</option>
                  <option value="director">{{$t('settings.director')}}</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">{{$t('settings.siteName')}}</label>
                <input 
                  v-model="formData.siteName" 
                  type="text" 
                  class="form-input" 
                  placeholder="{{$t('settings.siteNamePlaceholder')}}"
                  required 
                />
              </div>

              <div class="form-group">
                <label class="form-label">{{$t('settings.childAge')}}</label>
                <select v-model.number="formData.childAge" class="form-input" required>
                  <option value="3">{{$t('settings.age3')}}</option>
                  <option value="4">{{$t('settings.age4')}}</option>
                  <option value="5">{{$t('settings.age5')}}</option>
                  <option value="6">{{$t('settings.age6')}}</option>
                </select>
                <div class="form-hint">
                  {{$t('settings.childAgeHint')}}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">{{$t('settings.mainImage')}}</label>
                <FileUploadInput
                  v-model="formData.mainImageUrl"

                  :placeholder="$t('settings.mainImagePlaceholder')"
                  file-type="image"
                  :required="false"
                />
                <div class="form-hint">
                  {{$t('settings.mainImageHint')}}
                </div>
                <div v-if="currentImagePreview" class="current-image-preview">
                  <h4>{{$t('settings.currentImage')}}</h4>
                  <img :src="currentImagePreview" :alt="$t('settings.currentImageAlt')" class="preview-image" />
                </div>
              </div>

              <div v-if="authStore.error" class="error-message">
                {{ authStore.error }}
              </div>

              <div v-if="saveSuccess" class="success-message">
                {{$t('settings.saveSuccess')}}
              </div>

              <div class="form-actions">
                <button 
                  type="submit" 
                  class="btn btn-primary"
                  :disabled="authStore.isLoading"
                >
                  {{ authStore.isLoading ? '저장 중...' : '설정 저장' }}
                </button>
                
                <button 
                  type="button" 
                  @click="resetForm"
                  class="btn btn-secondary"
                >
                  취소
                </button>
              </div>
            </form>
          </div>

          <div class="settings-card">
            <div class="card-header">
              <h2>학습 통계</h2>
            </div>
            
            <div class="stats-grid" v-if="authStore.userProgress">
              <div class="stat-item">
                <div class="stat-icon">🧩</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.quiz_score }}</div>
                  <div class="stat-label">퀴즈 점수</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon">🎯</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.quiz_streak }}</div>
                  <div class="stat-label">연속 정답</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon">🧩</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.puzzle_completions }}</div>
                  <div class="stat-label">퍼즐 완성</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon">📚</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.words_learned }}</div>
                  <div class="stat-label">학습한 단어</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon">📖</div>
                <div class="stat-content">
                  <div class="stat-value">{{ authStore.userProgress.books_read }}</div>
                  <div class="stat-label">읽은 책</div>
                </div>
              </div>
              
              <div class="stat-item">
                <div class="stat-icon">🏆</div>
                <div class="stat-content">
                  <div class="stat-value">{{ contentStore.availableBadges.length }}</div>
                  <div class="stat-label">획득 뱃지</div>
                </div>
              </div>
            </div>
          </div>

          <div class="settings-card">
            <div class="card-header">
              <h2>계정 관리</h2>
            </div>
            
            <div class="account-actions">
              <button @click="handleLogout" class="btn btn-danger">
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Navigation from '@/components/Navigation.vue';
import FileUploadInput from '@/components/FileUploadInput.vue';
import { useAuthStore } from '@/stores/auth';
import { useContentStore } from '@/stores/content';
import { useFileUpload } from '@/composables/useFileUpload';

const router = useRouter();
const authStore = useAuthStore();
const contentStore = useContentStore();
const { getUploadedFileUrl } = useFileUpload();

const saveSuccess = ref(false);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const formData = reactive({
  username: '',
  userType: 'parent' as 'parent' | 'teacher' | 'director',
  siteName: '',
  childAge: 4,
  mainImageUrl: ''
});

// 현재 이미지 미리보기 계산
const currentImagePreview = computed(() => {
  const imageUrl = formData.mainImageUrl || authStore.userProfile?.mainImageUrl;
  
  if (!imageUrl) return null;
  
  if (imageUrl.startsWith('/uploads/')) {
    return '/server' + imageUrl;
  }
  
  return imageUrl;
});

const loadCurrentSettings = () => {
  if (authStore.userProfile) {
    formData.username = authStore.userProfile.username;
    formData.userType = authStore.userProfile.userType;
    formData.siteName = authStore.userProfile.siteName;
    formData.childAge = authStore.userProfile.childAge;
    formData.mainImageUrl = authStore.userProfile.mainImageUrl || '';
  }
};

const saveSettings = async () => {
  console.log('💾 Saving settings with mainImageUrl:', formData.mainImageUrl);
  
  const success = await authStore.updateSettings({
    userType: formData.userType,
    siteName: formData.siteName,
    childAge: formData.childAge,
    mainImageUrl: formData.mainImageUrl || undefined
  });

  if (success) {
    console.log('✅ Settings saved successfully');
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3000);
    await contentStore.loadContent();
    // 프로필 즉시 갱신 (홈 메인 이미지 바로 반영)
    await authStore.loadUserProfile();
    // 홈페이지로 리다이렉트하지 않고 현재 페이지에 머물기
    console.log('🔄 Settings updated, staying on settings page');
  }
};

const resetForm = () => {
  loadCurrentSettings();
  saveSuccess.value = false;
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

onMounted(() => {
  loadCurrentSettings();
});
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%);
}

.main-content {
  padding: var(--spacing-2xl) 0;
}

.page-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-description {
  font-size: 1.125rem;
  color: var(--color-text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

.settings-container {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.settings-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-header {
  background: var(--color-bg-secondary);
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.card-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0;
}

.settings-form {
  padding: var(--spacing-xl);
}

.form-hint {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

.form-input:disabled {
  background: var(--color-bg-secondary);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.current-image-preview {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  text-align: center;
}

.current-image-preview h4 {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.preview-image {
  max-width: 200px;
  max-height: 150px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  object-fit: cover;
}

.form-actions {
  display: flex;
  gap: var(--spacing-md);
  margin-top: var(--spacing-xl);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  font-weight: 500;
}

.success-message {
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid var(--color-success);
  color: var(--color-success);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  text-align: center;
  font-weight: 500;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: var(--spacing-lg);
  padding: var(--spacing-xl);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
}

.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

.account-actions {
  padding: var(--spacing-xl);
}

@media (max-width: 768px) {
  .settings-container {
    margin: 0 var(--spacing-md);
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--spacing-md);
  }
  
  .stat-item {
    flex-direction: column;
    text-align: center;
    gap: var(--spacing-sm);
  }
  
  .stat-icon {
    font-size: 1.5rem;
  }
  
  .stat-value {
    font-size: 1.25rem;
  }
}
</style>