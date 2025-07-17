# 🔥 Phase 1 상세 개발 계획 (3개월)

## 개요
유아학습 앱을 공식 서비스로 배포하기 위한 Phase 1 필수 기능 개발 계획서

---

## 1. 🔐 보안 강화 및 소셜 로그인 (4주)

### 1.1 소셜 로그인 구현 (2주)
**목표**: 구글, 카카오, 네이버 로그인 추가

**기술 스택**: 
- Supabase Auth (구글)
- Kakao JavaScript SDK
- Naver Login API

**구현 단계**:
```typescript
// Week 1: 구글 로그인
- Supabase Auth 설정 확장
- Google OAuth 앱 등록
- 소셜 로그인 UI 컴포넌트 개발
- 프로필 연동 시스템

// Week 2: 카카오/네이버 로그인
- 카카오 개발자 계정 설정
- 네이버 개발자 센터 설정
- 통합 인증 로직 구현
- 기존 계정 연동 기능
```

### 1.2 비밀번호 보안 강화 (1주)
**구현 내용**:
- 비밀번호 복잡도 검증 강화
- 비밀번호 재설정 이메일 시스템
- 계정 잠금 기능 (5회 실패 시)
- 2단계 인증 (선택사항)

### 1.3 세션 관리 개선 (1주)
```typescript
// 자동 로그아웃 시스템
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30분
const AUTO_LOGOUT_WARNING = 5 * 60 * 1000; // 5분 전 경고

// 토큰 갱신 로직
const refreshTokenIfNeeded = async () => {
  const expiresAt = localStorage.getItem('token_expires_at');
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    await supabase.auth.refreshSession();
  }
};
```

---

## 2. 📝 콘텐츠 관리 시스템 (5주)

### 2.1 관리자 콘텐츠 에디터 (3주)
**목표**: 드래그앤드롭 방식의 직관적 편집기

**Week 1: 기본 에디터 구조**
```vue
<!-- BookEditor.vue -->
<template>
  <div class="book-editor">
    <div class="editor-toolbar">
      <button @click="addPage">페이지 추가</button>
      <button @click="saveBook">저장</button>
      <button @click="previewBook">미리보기</button>
    </div>
    
    <div class="editor-workspace">
      <div class="page-list">
        <draggable v-model="pages" @change="reorderPages">
          <div v-for="page in pages" :key="page.id" class="page-item">
            <PageEditor :page="page" @update="updatePage" />
          </div>
        </draggable>
      </div>
    </div>
  </div>
</template>
```

**Week 2: 페이지 편집 기능**
- 이미지 업로드 & 크롭 기능
- 텍스트 편집기 (리치 텍스트)
- 오디오 녹음/업로드
- 페이지 순서 변경

**Week 3: 고급 편집 기능**
- 템플릿 시스템
- 일괄 편집 도구
- 버전 히스토리
- 자동 저장

### 2.2 TTS 품질 향상 (1주)
```typescript
// 고품질 TTS 서비스 연동
const generateTTS = async (text: string, voice: 'child' | 'adult' = 'child') => {
  // Google Cloud TTS 또는 AWS Polly 연동
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      voice,
      language: 'ko-KR',
      speed: 0.9,
      pitch: 1.1
    })
  });
  
  return response.blob();
};
```

### 2.3 콘텐츠 검토 시스템 (1주)
**워크플로우**:
1. 작성자가 콘텐츠 생성
2. 자동 검증 (부적절한 단어, 이미지 품질)
3. 교육 전문가 검토
4. 승인 후 배포

```typescript
// 콘텐츠 상태 관리
enum ContentStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published'
}
```

---

## 3. 📊 기본 학습 리포트 시스템 (3주)

### 3.1 학습 데이터 수집 강화 (1주)
```typescript
// 상세한 학습 로깅
interface LearningEvent {
  userId: string;
  sessionId: string;
  contentId: string;
  contentType: 'word' | 'book' | 'quiz' | 'puzzle';
  action: 'start' | 'complete' | 'pause' | 'retry';
  timestamp: Date;
  duration: number;
  score?: number;
  difficulty?: number;
  metadata?: Record<string, any>;
}

const trackLearningEvent = (event: LearningEvent) => {
  // 실시간 분석을 위한 이벤트 스트리밍
  analytics.track('learning_event', event);
  
  // 데이터베이스 저장
  supabase.from('learning_events').insert(event);
};
```

### 3.2 부모/교사 대시보드 (2주)
**Week 1: 기본 대시보드**
```vue
<!-- ParentDashboard.vue -->
<template>
  <div class="parent-dashboard">
    <div class="summary-cards">
      <StatCard 
        title="총 학습 시간" 
        :value="formatTime(totalLearningTime)"
        trend="+15% 이번 주"
      />
      <StatCard 
        title="완료한 책" 
        :value="completedBooks"
        trend="+3권 이번 주"
      />
      <StatCard 
        title="정답률" 
        :value="`${accuracyRate}%`"
        trend="+5% 향상"
      />
    </div>
    
    <div class="charts-section">
      <LearningTimeChart :data="weeklyData" />
      <CategoryProgressChart :data="categoryData" />
    </div>
    
    <div class="recent-activities">
      <h3>최근 활동</h3>
      <ActivityList :activities="recentActivities" />
    </div>
  </div>
</template>
```

**Week 2: 고급 분석**
- 학습 패턴 분석
- 추천 콘텐츠 제안
- 성취도 평가 리포트
- 주간/월간 리포트 이메일 발송

---

## 4. 📋 법적 준수 문서 작성 (2주)

### 4.1 개인정보처리방침 (1주)
**포함 내용**:
- 수집하는 개인정보 항목
- 개인정보 수집 및 이용 목적
- 개인정보 보관 기간
- 개인정보 제3자 제공 현황
- 개인정보 처리 위탁
- 정보주체의 권리와 행사 방법
- 개인정보 보호책임자 연락처

### 4.2 이용약관 및 아동보호 정책 (1주)
```typescript
// 아동 보호 기능 구현
const validateChildProfile = (profile: ChildProfile) => {
  // 나이 검증
  if (profile.age < 3 || profile.age > 8) {
    throw new Error('서비스 이용 연령이 아닙니다.');
  }
  
  // 부모 동의 확인
  if (!profile.parentConsent) {
    throw new Error('부모 동의가 필요합니다.');
  }
  
  // 개인정보 최소화
  const sanitizedProfile = {
    nickname: profile.nickname,
    age: profile.age,
    // 실명, 생년월일 등 민감정보 제외
  };
  
  return sanitizedProfile;
};
```

---

## 📅 3개월 타임라인

### Month 1: 기반 시스템 구축
- **Week 1-2**: 소셜 로그인 구현
- **Week 3**: 비밀번호 보안 강화
- **Week 4**: 세션 관리 개선

### Month 2: 콘텐츠 시스템 개발
- **Week 5-7**: 콘텐츠 에디터 개발
- **Week 8**: TTS 연동 & 검토 시스템

### Month 3: 분석 및 법적 준수
- **Week 9**: 학습 데이터 수집 시스템
- **Week 10-11**: 부모/교사 대시보드
- **Week 12**: 법적 문서 작성 및 검토

---

## 🎯 주요 성과 지표 (KPI)

### 기술적 지표
- **보안**: 소셜 로그인 연동률 > 80%
- **콘텐츠**: 일일 콘텐츠 생성량 > 5개
- **성능**: 페이지 로딩 시간 < 3초

### 비즈니스 지표
- **사용자**: 일일 활성 사용자 유지율 > 70%
- **학습**: 평균 세션 시간 > 15분
- **만족도**: 부모 만족도 > 4.5/5.0

---

## 🔧 필요 리소스

### 개발 인력
- **풀스택 개발자**: 2명 (3개월)
- **UI/UX 디자이너**: 1명 (1.5개월)
- **QA 엔지니어**: 1명 (1개월)

### 외부 서비스
- **Google Cloud TTS**: 월 $200-500
- **CDN 서비스**: 월 $100-300
- **보안 인증서**: 연 $100-200

### 법무 지원
- **개인정보보호 전문가**: 1명 (2주)
- **법무 검토**: 1명 (1주)

---

## 📝 다음 단계
Phase 1 완료 후 Phase 2로 진행:
- 결제 시스템 구축
- 성능 최적화 및 모니터링
- 고객 지원 시스템
- 오프라인 지원

---

**작성일**: 2025년 1월 15일
**작성자**: Claude Code Assistant
**버전**: 1.0