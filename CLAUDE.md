# Claude Code Assistant Context

## 프로젝트 개요

유아 학습 웹 애플리케이션으로 단어, 그림책 학습을 도와주는 인터랙티브 앱입니다.

### 기술 스택
- **프론트엔드**: Vue 3, Vite, TypeScript, Pinia, Tailwind CSS
- **백엔드**: Supabase (PostgreSQL, Auth) + Express (파일 업로드)
- **데이터베이스**: Supabase PostgreSQL

## 개발 환경 설정

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
`.env` 파일 생성:
```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. 개발 서버 실행
```bash
# 프론트엔드
npm run dev

# 백엔드 (새 터미널)
npm run api
```

## 프로젝트 구조

```
/
├── src/                 # Vue.js 프론트엔드
│   ├── components/      # 공통 컴포넌트
│   ├── views/          # 페이지 뷰 (admin/ 폴더 포함)
│   ├── stores/         # Pinia 상태 관리
│   ├── composables/    # 재사용 가능한 로직
│   ├── types/          # TypeScript 타입 정의
│   └── router/         # Vue Router 설정
├── server/             # Express 백엔드 (파일 업로드)
│   ├── routes/         # API 라우트
│   ├── middleware/     # 미들웨어
│   └── data/           # 로컬 데이터 파일
└── supabase/           # DB 마이그레이션
```

## 주요 컴포넌트 및 기능

### Components
- **WordCard.vue**: 단어 카드 UI, 이미지/음성 재생
- **FileUploadInput.vue**: 파일 업로드 (이미지/음성)
- **LikeButton.vue**: 좋아요 버튼 (단어/책 좋아요 기능)
- **Navigation.vue**: 메인 네비게이션

### Views
- **HomeView.vue**: 메인 홈페이지
- **WordsView.vue**: 단어 학습
- **BooksView.vue**: 그림책 목록
- **BookReaderView.vue**: 그림책 읽기
- **QuizView.vue**: 퀴즈 게임
- **PuzzleView.vue**: 퍼즐 게임
- **LikesView.vue**: 좋아요한 콘텐츠 목록 및 랭킹
- **LearningStatsView.vue**: 사용자 학습 통계 (연령대 비교 포함)
- **QuizStatsView.vue**: 퀴즈 결과 통계
- **admin/**: 관리자 페이지들

### Stores (Pinia)
- **app.ts**: 메인 스토어 (단어/책/뱃지/퀴즈 상태)
- **auth.ts**: 인증/프로필 상태
- **content.ts**: 공용 데이터 로딩

### Composables
- **useAudio.ts**: 오디오 재생 관리
- **useFileUpload.ts**: 파일 업로드 로직
- **useLikes.ts**: 좋아요 기능 (추가/삭제, 목록, 랭킹, 통계)
- **useQuizTracking.ts**: 퀴즈 결과 추적 및 학습 통계
- **useSupabase.ts**: Supabase 클라이언트

## 좋아요 및 통계 기능

### 좋아요 기능 (`useLikes.ts`, `LikesView.vue`)
- **목적**: 사용자가 단어, 그림책, 퀴즈, 퍼즐 등 다양한 콘텐츠에 '좋아요'를 표시하고 관리할 수 있도록 합니다.
- **주요 기능**:
  - 콘텐츠 좋아요 추가/제거
  - 사용자가 좋아요한 콘텐츠 목록 조회
  - 콘텐츠별 좋아요 랭킹 (주간, 월간, 전체 기간) 및 통계 제공
- **데이터 흐름**:
  - `LikeButton.vue`에서 `useLikes.ts`의 `toggleLike` 호출
  - `useLikes.ts`는 Supabase의 `likes` 테이블(또는 `favorites` 테이블로 폴백)과 연동하여 좋아요 상태를 관리
  - `LikesView.vue`에서 `useLikes.ts`를 통해 사용자의 좋아요 목록 및 랭킹 데이터를 불러와 표시

### 학습 통계 기능 (`useQuizTracking.ts`, `LearningStatsView.vue`, `QuizStatsView.vue`)
- **목적**: 사용자의 퀴즈 학습 결과를 추적하고, 다양한 통계 및 분석 정보를 제공하여 학습 현황을 파악할 수 있도록 돕습니다.
- **주요 기능**:
  - 퀴즈 결과 저장 (정답 여부, 응답 시간, 난이도 등)
  - 사용자별 학습 통계 (총 문제 수, 정답률, 연속 정답 등)
  - 연령대별 비교 및 학습 수준 분석
  - 주간 학습 진도 및 난이도별 정답률 시각화
- **데이터 흐름**:
  - `QuizView.vue` 등 퀴즈 관련 뷰에서 `useQuizTracking.ts`의 `saveQuizResult` 호출
  - `useQuizTracking.ts`는 Supabase의 `quiz_results` 테이블에 퀴즈 결과를 저장
  - `LearningStatsView.vue` 및 `QuizStatsView.vue`에서 `useQuizTracking.ts`를 통해 저장된 퀴즈 결과를 불러와 통계 및 분석 정보를 계산하고 시각화

## API 및 데이터 흐름

### 파일 업로드
```
FileUploadInput → useFileUpload → POST /api/upload → /uploads/ 저장 → DB 경로 저장
```

### 이미지/음성 접근
```
DB 경로 (/uploads/...) → getImageUrl/getAudioUrl → /server/uploads/... → Vite 프록시
```

### 데이터 CRUD
```
Pinia stores → Supabase API / Express API → DB 업데이트
```

## 주요 NPM 스크립트

- `npm run dev`: 프론트엔드 개발 서버
- `npm run build`: 프로덕션 빌드 
- `npm run api`: Express 백엔드 서버
- `npm run preview`: 빌드 미리보기

## 데이터베이스

Supabase를 사용하며 `supabase/migrations/` 폴더에서 스키마 관리:

```bash
# 프로젝트 연결
supabase link --project-ref <project-id>

# 마이그레이션 적용
supabase db push
```

## 주요 타입 정의

### Word
```typescript
interface Word {
  id: string
  word: string
  imageUrl: string
  audioUrl: string
  category: string
}
```

### Book
```typescript
interface Book {
  id: string
  title: string
  coverImageUrl: string
  pages: BookPage[]
}
```

## 주의사항

- 프론트엔드와 백엔드 서버 모두 실행 필요
- Vite 프록시 설정으로 `/server` 경로를 Express 서버로 연결
- 파일 업로드는 Express 서버를 통해 처리
- 주요 데이터는 Supabase를 통해 관리

# 다국어 지원 (Internationalization)

## 🌐 개요
이 프로젝트는 Vue i18n을 기반으로 한 완전한 다국어 지원 시스템을 구축했습니다.

### 지원 언어
- **한국어 (ko)** - 기본 언어
- **영어 (en)** - 보조 언어
- **확장 가능**: 일본어, 중국어 등 추가 언어 지원 용이

## 📁 언어팩 구조
```
src/
├── locales/          # 언어팩 파일들
│   ├── ko.json      # 한국어 번역
│   ├── en.json      # 영어 번역
│   └── [lang].json  # 향후 추가 언어
├── utils/
│   └── i18n.ts      # i18n 유틸리티 및 설정
└── main.ts          # 앱 초기화 (i18n 포함)
```

## 🔧 주요 기능

### 1. 동적 언어팩 로딩
- 필요한 언어만 동적으로 로드하여 성능 최적화
- 브라우저 언어 자동 감지
- localStorage에 언어 설정 자동 저장

### 2. 사용자 친화적 언어 전환
- 네비게이션바의 글로벌 아이콘 버튼
- 클릭 한 번으로 언어 토글
- 실시간 언어 변경 (페이지 새로고침 불필요)

### 3. 확장 가능한 아키텍처
- 새로운 언어 추가 시 JSON 파일만 추가하면 됨
- 중앙화된 언어 관리 시스템
- 타입 안전성 보장

## 🎯 개발 가이드라인

### 새로운 텍스트 추가 시
```vue
<!-- ❌ 하드코딩 금지 -->
<h1>안녕하세요</h1>
<button>저장</button>

<!-- ✅ i18n 키 사용 -->
<h1>{{ $t('common.hello') }}</h1>
<button>{{ $t('common.save') }}</button>
```

### 언어팩 키 네이밍 규칙
```json
{
  "common": {        // 공통 요소
    "save": "저장",
    "cancel": "취소"
  },
  "navigation": {    // 네비게이션 관련
    "home": "홈",
    "settings": "설정"
  },
  "auth": {          // 인증 관련
    "login": "로그인",
    "logout": "로그아웃"
  },
  "forms": {         // 폼 관련
    "required": "필수",
    "optional": "선택사항"
  }
}
```

### 동적 텍스트 처리
```vue
<!-- 매개변수 사용 -->
<p>{{ $t('words.contentCount', { count: items.length }) }}</p>
<p>{{ $t('dashboard.description', { child: childName }) }}</p>

<!-- 복수형 처리 -->
<p>{{ $t('time.minutesAgo', { count: minutes }) }}</p>
```

### 새로운 언어 추가 방법
1. `src/locales/[언어코드].json` 파일 생성
2. `src/utils/i18n.ts`의 `SUPPORTED_LANGUAGES` 배열에 언어 코드 추가
3. 필요시 언어별 특별 처리 로직 추가

## 🚀 사용법

### 컴포넌트에서 사용
```vue
<template>
  <div>
    <h1>{{ $t('page.title') }}</h1>
    <p>{{ $t('page.description', { lang: currentLang }) }}</p>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const currentLang = computed(() => locale.value)
</script>
```

### 프로그래밍 방식으로 언어 변경
```typescript
import { changeLanguage } from '@/utils/i18n'

// 특정 언어로 변경
await changeLanguage('en')

// 다음 언어로 토글
import { getNextLanguage, getCurrentLanguage } from '@/utils/i18n'
const nextLang = getNextLanguage(getCurrentLanguage())
await changeLanguage(nextLang)
```

## ⚠️ 주의사항

### 필수 규칙
1. **모든 사용자 대상 텍스트는 반드시 i18n 키 사용**
2. **console.log나 기술적 키워드는 예외**
3. **새로운 컴포넌트 작성 시 i18n 우선 고려**
4. **aria-label, title 등 접근성 텍스트도 i18n 적용**

### 성능 고려사항
- 언어팩은 필요시에만 로드됨 (Lazy Loading)
- 현재 사용하지 않는 언어는 메모리에 로드되지 않음
- 언어 변경 시 매끄러운 전환 보장

## 🔍 문제 해결

### 번역 키가 표시되는 경우
1. 해당 키가 현재 언어팩에 존재하는지 확인
2. 키 경로가 올바른지 확인 (예: `common.save`)
3. 언어팩 JSON 문법 오류 확인

### 언어 변경이 작동하지 않는 경우
1. 환경 변수 확인
2. 브라우저 콘솔에서 에러 메시지 확인
3. localStorage 언어 설정 확인

**IMPORTANT: 다국어 지원 시스템이 구축되었으므로, 모든 새로운 UI 텍스트는 반드시 i18n 키를 사용해야 합니다. 하드코딩된 텍스트는 절대 금지입니다.**


  🎯 코드 수정 시 필수 체크사항

  1. 타입 정의 확인: 새로운 property 사용 전 반드시 타입 정의 존재 확인
  2. 빌드 테스트: 수정 후 npm run build 실행으로 에러 검증
  3. Import 확인: Vue (ref, computed 등) 누락 없이 import
  4. Timer 타입: NodeJS.Timeout 사용 (not number)

  🚫 금지사항

  - 존재하지 않는 property 사용 (예: preview.middleware)
  - any 타입 남용
  - 타입 에러 상태로 진행
