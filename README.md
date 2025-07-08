# Toddler Learning Web App

이 프로젝트는 유아의 단어, 그림책 학습을 돕는 인터랙티브 웹 애플리케이션입니다. Vue 3와 Supabase를 중심으로 구축되었으며, Express 기반의 보조 백엔드 서버를 포함합니다.

## 주요 기능

- **단어 학습**: 단어 카드를 통해 이미지와 원어민 발음을 학습합니다.
- **그림책 읽기**: 페이지별로 이미지, 텍스트, 음성을 함께 제공하는 그림책을 읽습니다.
- **퀴즈 및 퍼즐**: 학습한 내용을 기반으로 한 간단한 퀴즈와 퍼즐 게임을 즐길 수 있습니다.
- **학습 통계 및 업적**: 학습 진행 상황을 추적하고 뱃지를 획득할 수 있습니다.
- **관리자 페이지**: 단어, 그림책, 뱃지, API 키 등 콘텐츠를 관리하는 기능을 제공합니다.

## 기술 스택

- **프론트엔드**: Vue 3, Vite, TypeScript, Pinia, Tailwind CSS
- **백엔드**:
    - **주요 데이터 및 인증**: Supabase (PostgreSQL, Auth)
    - **보조 서버 (파일 업로드 등)**: Node.js, Express
- **데이터베이스 마이그레이션**: Supabase CLI

## 프로젝트 구조

```
/
├── server/              # Express 백엔드 (파일 업로드, API)
├── src/                 # Vue.js 프론트엔드 소스 코드
│   ├── components/      # 공통 컴포넌트
│   ├── views/           # 페이지 뷰
│   ├── stores/          # Pinia 상태 관리
│   ├── router/          # Vue Router 설정
│   ├── composables/     # 재사용 가능한 로직
│   └── types/           # TypeScript 타입 정의
├── supabase/            # Supabase 관련 파일
│   └── migrations/      # DB 스키마 마이그레이션
├── public/              # 정적 파일
├── package.json         # 프로젝트 의존성 및 스크립트
└── vite.config.ts       # Vite 설정 (프록시 포함)
```

## 실행 방법

### 1. 의존성 설치

프로젝트 루트 디렉토리에서 다음 명령어를 실행합니다.

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 프로젝트 루트에 생성하고 Supabase 관련 키를 설정해야 합니다. `.env.example` 파일을 참고하세요. (Supabase 프로젝트 설정에서 확인 가능)

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Supabase 데이터베이스 설정

로컬 또는 원격 Supabase 프로젝트에 마이그레이션 파일을 적용하여 데이터베이스 스키마를 설정해야 합니다. [Supabase CLI](https://supabase.com/docs/guides/cli)를 사용하여 아래 명령어를 실행할 수 있습니다.

```bash
# Supabase 프로젝트와 연결 (최초 1회)
supabase link --project-ref <your-project-id>

# 원격 DB에 마이그레이션 적용
supabase db push

# 또는 로컬 개발 환경 시작
supabase start
```

### 4. 개발 서버 실행

프론트엔드 개발 서버와 백엔드 API 서버를 동시에 실행해야 합니다.

- **프론트엔드 (Vue)**:
  ```bash
  npm run dev
  ```
  > 기본적으로 `http://localhost:5173` 에서 실행됩니다.

- **백엔드 (Express)**:
  새 터미널을 열고 다음 명령어를 실행합니다.
  ```bash
  npm run api
  ```
  > 기본적으로 `http://localhost:3001` 에서 실행됩니다.

이제 브라우저에서 `http://localhost:5173`에 접속하여 애플리케이션을 확인할 수 있습니다.

## 주요 NPM 스크립트

- `npm run dev`: 프론트엔드 개발 서버를 시작합니다.
- `npm run build`: 프로덕션용으로 프론트엔드를 빌드합니다.
- `npm run preview`: 빌드된 결과물을 미리 봅니다.
- `npm run api`: 백엔드 Express 서버를 시작합니다.