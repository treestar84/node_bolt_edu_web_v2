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
- **Navigation.vue**: 메인 네비게이션

### Views
- **HomeView.vue**: 메인 홈페이지
- **WordsView.vue**: 단어 학습
- **BooksView.vue**: 그림책 목록
- **BookReaderView.vue**: 그림책 읽기
- **QuizView.vue**: 퀴즈 게임
- **PuzzleView.vue**: 퍼즐 게임
- **admin/**: 관리자 페이지들

### Stores (Pinia)
- **app.ts**: 메인 스토어 (단어/책/뱃지/퀴즈 상태)
- **auth.ts**: 인증/프로필 상태
- **content.ts**: 공용 데이터 로딩

### Composables
- **useAudio.ts**: 오디오 재생 관리
- **useFileUpload.ts**: 파일 업로드 로직
- **useSupabase.ts**: Supabase 클라이언트

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