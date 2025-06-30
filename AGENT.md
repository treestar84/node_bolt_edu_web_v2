# AGENT.md (요약 가이드)

## 1. src/ (프론트엔드)

### 1.1 components/
- WordCard.vue: 단어 카드 UI, 이미지/음성 출력, 클릭시 음성 재생.
- FileUploadInput.vue: 이미지/음성 파일 업로드 및 미리보기, 서버 업로드.
- AdminHeader.vue: 어드민 공통 헤더.
- ApiTable.vue: API 키 목록 테이블.
- BadgeDisplay.vue: 뱃지(업적) 표시.
- Navigation.vue: 메인 네비게이션 바.

### 1.2 views/
- HomeView.vue: 메인 홈, 히어로 이미지, 최근 활동 등.
- SettingsView.vue: 사용자 프로필/설정, 이미지 업로드.
- PuzzleView.vue: 퍼즐 게임, 이미지 조각 맞추기.
- QuizView.vue: 퀴즈 게임, 음성 듣고 정답 이미지 선택.
- BookReaderView.vue: 그림책 읽기, 페이지별 이미지/음성/텍스트.
- BooksView.vue: 그림책 목록, 표지 이미지, 상세 진입.
- WordsView.vue: 단어 학습, 카드/리스트/음성 재생.
- AchievementsView.vue: 뱃지/업적 목록.
- LoginView.vue: 로그인/회원가입.
- ApiGuideView.vue: API 사용법 안내.
- admin/: 어드민 전용 뷰 (단어/책/뱃지/키 관리 등)
  - AdminWordsView.vue: 단어 CRUD, 이미지/음성 업로드.
  - AdminBooksView.vue: 책 CRUD, 페이지별 이미지/음성 업로드.
  - AdminApiKeysView.vue: API 키 관리.
  - AdminBadgesView.vue: 뱃지 관리.
  - AdminDashboardView.vue: 어드민 대시보드.
  - AdminLoginView.vue: 어드민 로그인.

### 1.3 composables/
- useFileUpload.ts: 서버 파일 업로드, 업로드 진행률, 유효성 검사.
- useAudio.ts: 오디오 재생, 상태 관리, TTS fallback.
- useSupabase.ts: Supabase 클라이언트 생성, 인증/DB 함수.

### 1.4 stores/
- app.ts: Pinia 메인 스토어. 단어/책/뱃지/퀴즈/퍼즐/어드민 상태 및 CRUD, Supabase 연동.
- auth.ts: 인증/프로필/진행도 상태 및 Supabase 연동.
- content.ts: 공용 데이터(단어/책/뱃지) 로딩, 뱃지 해금 등.

### 1.5 types/
- index.ts: Word, Book, BookPage, Badge 등 주요 타입 정의.
- supabase.ts: Supabase DB 타입 매핑.

---

## 2. server/ (백엔드)

### 2.1 index.js
- Express 서버 진입점. helmet, cors, rate-limit, 정적 파일(/uploads), API 라우트 등록.

### 2.2 routes/
- auth.js: 어드민 인증(로그인/로그아웃/토큰 검증).
- words.js: 단어 CRUD, 업로드 경로 반환.
- books.js: 책 CRUD, 페이지별 이미지/음성 경로 반환.
- upload.js: 이미지/음성 업로드, 업로드 후 /uploads/images/, /uploads/audio/ 경로 반환.
- apiKeys.js: API 키 관리.

### 2.3 middleware/
- auth.js: API 키/어드민 인증 미들웨어.
- upload.js: multer 기반 파일 업로드 미들웨어.

### 2.4 data/
- store.js: 파일 기반 데이터 관리(로컬 개발용).
- books.json, words.json, apiKeys.json: 데이터 파일.

### 2.5 uploads/
- images/, audio/: 업로드된 이미지/음성 파일 저장 폴더.

---

## 3. 주요 관계 및 흐름

- 파일 업로드:  FileUploadInput.vue → useFileUpload.ts → POST /api/upload/image|audio → 서버(upload.js) → /uploads/images|audio/파일명 반환 → DB 저장 → 프론트에서 /server/uploads/ 프록시로 접근
- 이미지/음성 출력:  DB에 저장된 경로(/uploads/...) → 프론트에서 getImageUrl/getAudioUrl → /server/uploads/...로 변환 → Vite 프록시 → 서버 정적 파일 응답
- 데이터 CRUD:  프론트 Pinia store(app.ts 등) → Supabase API or 서버 REST API → DB/JSON 파일 반영
- 어드민/유저 권한:  auth.ts, useSupabase.ts, 서버 미들웨어(auth.js)에서 분기

---

## 4. 핵심 함수/로직 요약

- useFileUpload.uploadFile: 파일 업로드, 서버에서 업로드 경로 반환
- getImageUrl/getAudioUrl: /uploads/ → /server/uploads/로 변환
- transformWordFromDB/transformBookFromDB: snake_case ↔ camelCase 변환
- addWord/addBook/updateWord/updateBook: 값 유효성 검사, DB 저장
- Supabase 연동: 인증, 데이터 CRUD, 진행도 관리

---

## 5. 기타

- .env: VITE_API_BASE_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY 등 환경변수 필요
- vite.config.ts: /server 프록시 설정 필수 (로컬 개발시)

---

이 문서는 AI가 프로젝트 구조/관계/핵심 흐름을 빠르게 파악할 수 있도록 요약된 가이드입니다. 각 파일/함수의 상세 구현은 실제 코드를 참고하세요. 