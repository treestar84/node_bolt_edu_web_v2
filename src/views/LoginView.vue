<template>
  <div class="login-view">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>{{ isRegister ? t('auth.registerTitle') : t('auth.loginTitle') }}</h1>
          <p>{{ isRegister ? t('auth.registerDesc') : t('auth.loginDesc') }}</p>
        </div>

        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-group">
            <label for="username" class="form-label">{{ t('auth.username') }}</label>
            <input
              id="username"
              type="text"
              v-model="formData.username"
              class="form-input"
              :placeholder="t('auth.usernamePlaceholder')"
              required
            />
            <div class="form-hint">
              {{ t('auth.usernameHint') }}
            </div>
          </div>

          <div class="form-group">
            <label for="password" class="form-label">{{ t('auth.password') }}</label>
            <input
              id="password"
              type="password"
              v-model="formData.password"
              class="form-input"
              :placeholder="t('auth.passwordPlaceholder')"
              required
            />
            <div class="form-hint">
              {{ t('auth.passwordHint') }}
            </div>
          </div>

          <div v-if="isRegister" class="register-fields">
            <div class="form-group">
              <label for="userType" class="form-label">{{ t('auth.userType') }}</label>
              <select
                id="userType"
                v-model="formData.userType"
                class="form-input"
                required
              >
                <option value="">{{ t('auth.selectUserType') }}</option>
                <option value="parent">{{ t('auth.parentUser') }}</option>
                <option value="teacher">{{ t('auth.teacherUser') }}</option>
                <option value="director">{{ t('auth.directorUser') }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="childName" class="form-label">{{ t('auth.childName') }}</label>
              <input
                id="childName"
                type="text"
                v-model="formData.childName"
                class="form-input"
                :placeholder="t('auth.childNamePlaceholder')"
                required
              />
            </div>

            <div class="form-group">
              <label for="childBirthDate" class="form-label">{{ t('auth.childBirthDate') }}</label>
              <input
                id="childBirthDate"
                type="date"
                v-model="formData.childBirthDate"
                class="form-input"
                :max="maxDate"
                required
              />
              <div class="form-hint">
                {{ t('auth.birthDateHint') }}
              </div>
            </div>

            <div v-if="formData.childBirthDate" class="child-age-display">
              <div class="age-info">
                <span class="age-label">{{ t('auth.currentAge') }}:</span>
                <span class="age-value">{{ calculatedAge.years }}{{ t('settings.age') }} {{ calculatedAge.months }}{{ t('auth.months') }}</span>
                <span class="age-months">({{ calculatedAge.totalMonths }}{{ t('auth.months') }})</span>
              </div>
            </div>
          </div>

          <div v-if="authStore.error" class="error-message">
            {{ authStore.error }}
            <div v-if="authStore.error.includes('데이터베이스 권한')" class="error-details">
              <p><strong>{{ t('auth.solutionTitle') }}</strong></p>
              <ol>
                <li>{{ t('auth.checkRLSPolicy') }}</li>
                <li>{{ t('auth.clickConnectionTest') }}</li>
                <li>{{ t('auth.contactAdmin') }}</li>
              </ol>
            </div>
            <div v-if="authStore.error.includes('rate limit') || authStore.error.includes('너무 많습니다')" class="error-details">
              <p><strong>{{ t('auth.emailLimitError') }}</strong></p>
              <ol>
                <li>Supabase 대시보드 → Authentication → Settings</li>
                <li>{{ t('auth.disableEmailConfirm') }}</li>
                <li>{{ t('auth.waitAndRetry') }}</li>
              </ol>
            </div>
            <div v-if="authStore.error.includes('계정이 생성되었습니다')" class="success-details">
              <p><strong>{{ t('auth.registerSuccess') }}</strong></p>
              <p>{{ t('auth.switchToLogin') }}</p>
              <button @click="switchToLogin" class="btn btn-sm btn-primary" type="button">
                {{ t('auth.switchToLoginBtn') }}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            class="btn btn-primary w-full btn-lg" 
            :disabled="authStore.isLoading"
          >
            {{ authStore.isLoading ? t('auth.processing') : (isRegister ? t('auth.registerButton') : t('auth.loginButton')) }}
          </button>
        </form>

        <div class="login-footer">
          <button 
            @click="toggleMode" 
            class="toggle-button"
            type="button"
          >
            {{ isRegister ? t('auth.alreadyHaveAccount') : t('auth.noAccount') }}
          </button>
          
          <div class="demo-accounts">
            <h4>{{ t('auth.testAccounts') }}</h4>
            <div class="demo-buttons">
              <button 
                @click="fillDemoAccount('parent')" 
                class="demo-btn"
                type="button"
              >
                {{ t('auth.parentAccount') }}
              </button>
              <button 
                @click="fillDemoAccount('teacher')" 
                class="demo-btn"
                type="button"
              >
                {{ t('auth.teacherAccount') }}
              </button>
            </div>
          </div>
          
          <!-- Enhanced Debug Information -->
          <div v-if="showDebugInfo" class="debug-info">
            <h4>🔍 {{ t('auth.debugInfo') }}</h4>
            <div class="debug-content">
              <div class="debug-section">
                <h5>{{ t('auth.environment') }}</h5>
                <p><strong>{{ t('auth.supabaseUrl') }}:</strong> {{ debugInfo.supabaseUrl ? t('auth.configured') : t('auth.notConfigured') }}</p>
                <p><strong>{{ t('auth.supabaseKey') }}:</strong> {{ debugInfo.supabaseKey ? t('auth.configured') : t('auth.notConfigured') }}</p>
              </div>
              
              <div class="debug-section">
                <h5>{{ t('auth.authStatus') }}</h5>
                <p><strong>{{ t('auth.currentUser') }}:</strong> {{ debugInfo.currentUser || t('auth.noUser') }}</p>
                <p><strong>{{ t('auth.authStatus') }}:</strong> {{ authStore.isAuthenticated ? t('auth.authenticated') : t('auth.notAuthenticated') }}</p>
              </div>
              
              <div class="debug-section">
                <h5>{{ t('auth.errorInfo') }}</h5>
                <p><strong>{{ t('auth.lastError') }}:</strong> {{ authStore.error || t('auth.noUser') }}</p>
              </div>
              
              <div v-if="connectionTestResult" class="debug-section">
                <h5>{{ t('auth.connectionTestResult') }}</h5>
                <p><strong>{{ t('auth.overallStatus') }}:</strong> {{ connectionTestResult.success ? '✅ 성공' : '❌ 실패' }}</p>
                <p><strong>{{ t('auth.basicConnection') }}:</strong> {{ connectionTestResult.tests?.basic ? '✅ 성공' : '❌ 실패' }}</p>
                <p><strong>{{ t('auth.publicTable') }}:</strong> {{ connectionTestResult.tests?.public ? '✅ ' + t('auth.accessible') : '❌ ' + t('auth.notAccessible') }}</p>
                <p><strong>{{ t('auth.userTable') }}:</strong> {{ 
                  connectionTestResult.tests?.user === true ? '✅ ' + t('auth.accessible') : 
                  connectionTestResult.tests?.user === false ? '❌ ' + t('auth.notAccessible') : 
                  '⚠️ ' + t('auth.unauthenticated') 
                }}</p>
              </div>
            </div>
            
            <div class="debug-actions">
              <button @click="testConnection" class="debug-btn" type="button" :disabled="isTestingConnection">
                {{ isTestingConnection ? t('auth.testingConnection') : '🔍 ' + t('auth.connectionTest') }}
              </button>
              <button @click="clearDebugData" class="debug-btn secondary" type="button">
                {{ t('auth.clearDebugData') }}
              </button>
            </div>
          </div>
          
          <button 
            @click="showDebugInfo = !showDebugInfo" 
            class="debug-toggle"
            type="button"
          >
            {{ showDebugInfo ? t('auth.hideDebug') : t('auth.showDebug') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useSupabase } from '@/composables/useSupabase';

const router = useRouter();
const authStore = useAuthStore();
const { testDatabaseConnection } = useSupabase();
const { t } = useI18n();

const isRegister = ref(false);
const showDebugInfo = ref(false);
const isTestingConnection = ref(false);
const connectionTestResult = ref<any>(null);

const formData = reactive({
  username: '',
  password: '',
  userType: '',
  childName: '',
  childBirthDate: ''
});

// 오늘 날짜 (최대 날짜)
const maxDate = computed(() => {
  const today = new Date();
  return today.toISOString().split('T')[0];
});

// 나이 계산
const calculatedAge = computed(() => {
  if (!formData.childBirthDate) {
    return { years: 0, months: 0, totalMonths: 0 };
  }
  
  const birthDate = new Date(formData.childBirthDate);
  const today = new Date();
  
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0) {
    years--;
    months += 12;
  }
  
  const totalMonths = years * 12 + months;
  
  return { years, months, totalMonths };
});

const debugInfo = computed(() => ({
  supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
  supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  currentUser: authStore.user?.id || null
}));

const handleSubmit = async () => {
  console.log('🚀 Form submitted:', { 
    isRegister: isRegister.value, 
    username: formData.username,
    userType: formData.userType,
    childName: formData.childName,
    childBirthDate: formData.childBirthDate,
    calculatedAge: calculatedAge.value
  });
  
  let success = false;

  if (isRegister.value) {
    success = await authStore.register(
      formData.username,
      formData.password,
      formData.userType as any,
      formData.childName,
      formData.childBirthDate,
      calculatedAge.value.totalMonths
    );
  } else {
    success = await authStore.login(formData.username, formData.password);
  }

  if (success) {
    console.log('✅ Form submission successful, redirecting...');
    router.push('/');
  } else {
    console.error('❌ Form submission failed');
    // Auto-run connection test if there's a database error
    if (authStore.error.includes('데이터베이스') || authStore.error.includes('권한')) {
      setTimeout(() => {
        testConnection();
      }, 1000);
    }
  }
};

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  authStore.error = '';
  resetForm();
};

const switchToLogin = () => {
  isRegister.value = false;
  authStore.error = '';
  // Keep the username and password for easy login
};

const resetForm = () => {
  formData.username = '';
  formData.password = '';
  formData.userType = '';
  formData.childName = '';
  formData.childBirthDate = '';
};

const fillDemoAccount = (type: 'parent' | 'teacher') => {
  if (type === 'parent') {
    formData.username = 'demo_mom';
    formData.password = '123456';
    if (isRegister.value) {
      formData.userType = 'parent';
      formData.childName = t('auth.demoChild');
      formData.childBirthDate = '2021-07-19';
    }
  } else {
    formData.username = 'demo_teacher';
    formData.password = '123456';
    if (isRegister.value) {
      formData.userType = 'teacher';
      formData.childName = t('auth.demoTeacher');
      formData.childBirthDate = '2020-07-19';
    }
  }
};

const testConnection = async () => {
  try {
    isTestingConnection.value = true;
    console.log('🔍 Starting comprehensive connection test...');
    
    const result = await testDatabaseConnection();
    connectionTestResult.value = result;
    
    if (result.success) {
      console.log('✅ Connection test successful:', result);
      alert(t('auth.connectionSuccess') + '\n\n' +
            `${t('auth.basicConnection')}: ${result.tests?.basic ? t('common.success') : t('common.error')}\n` +
            `${t('auth.publicTable')}: ${result.tests?.public ? t('auth.accessible') : t('auth.notAccessible')}\n` +
            `${t('auth.userTable')}: ${result.tests?.user === true ? t('auth.accessible') : result.tests?.user === false ? t('auth.notAccessible') : t('auth.unauthenticated')}`);
    } else {
      console.error('❌ Connection test failed:', result);
      alert(`${t('auth.connectionFailed')}\n\n${t('auth.errorInfo')}: ${result.error || t('auth.unknownError')}`);
    }
  } catch (err) {
    console.error('💥 Connection test error:', err);
    alert(`💥 ${t('auth.connectionTest')} ${t('common.error')}: ${err}`);
  } finally {
    isTestingConnection.value = false;
  }
};

const clearDebugData = () => {
  connectionTestResult.value = null;
  authStore.error = '';
  console.clear();
  console.log('🗑️ Debug data cleared');
};

onMounted(() => {
  console.log('🔧 LoginView mounted');
  console.log('📊 Environment check:', {
    supabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
  });
});
</script>

<style scoped>
.login-view {
  min-height: 100vh;
  background: var(--color-bg-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-container {
  width: 100%;
  max-width: 500px;
}

.login-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-xl);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.login-header p {
  color: var(--color-text-secondary);
  font-size: 1rem;
}

.login-form {
  margin-bottom: var(--spacing-xl);
}

.register-fields {
  margin-top: var(--spacing-lg);
}

.form-hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: var(--spacing-xs);
}

.child-age-display {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.age-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 0.875rem;
}

.age-label {
  font-weight: 500;
  color: var(--color-text-secondary);
}

.age-value {
  font-weight: 600;
  color: var(--color-primary);
}

.age-months {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  background: rgba(59, 130, 246, 0.1);
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  text-align: left;
  font-weight: 500;
}

.error-details {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(239, 68, 68, 0.3);
}

.error-details p {
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.error-details ol {
  margin-left: var(--spacing-lg);
  font-size: 0.875rem;
}

.error-details li {
  margin-bottom: var(--spacing-xs);
}

.success-details {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid rgba(16, 185, 129, 0.3);
  color: var(--color-success);
}

.success-details p {
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.login-footer {
  text-align: center;
  padding-top: var(--spacing-lg);
  border-top: 1px solid var(--color-border);
}

.toggle-button {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s ease;
  margin-bottom: var(--spacing-lg);
}

.toggle-button:hover {
  color: var(--color-primary-dark);
  text-decoration: underline;
}

.demo-accounts {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
}

.demo-accounts h4 {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-md);
  font-weight: 500;
}

.demo-buttons {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
}

.demo-btn {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.demo-btn:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-primary);
}

.debug-info {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
  text-align: left;
}

.debug-info h4 {
  font-size: 1rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.debug-section {
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.debug-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.debug-section h5 {
  font-size: 0.875rem;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  font-weight: 600;
}

.debug-content p {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xs);
  font-family: 'Courier New', monospace;
}

.debug-actions {
  display: flex;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.debug-btn {
  background: var(--color-primary);
  color: var(--color-text-primary);
  border: none;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
}

.debug-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.debug-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.debug-btn.secondary {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}

.debug-btn.secondary:hover:not(:disabled) {
  background: var(--color-bg-hover);
  color: var(--color-text-primary);
}

.debug-toggle {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s ease;
}

.debug-toggle:hover {
  color: var(--color-text-secondary);
}

@media (max-width: 768px) {
  .login-view {
    padding: var(--spacing-md);
  }
  
  .login-card {
    padding: var(--spacing-xl);
  }
  
  .login-header h1 {
    font-size: 1.75rem;
  }
  
  .demo-buttons {
    flex-direction: column;
  }
  
  .debug-actions {
    flex-direction: column;
  }
}
</style>