# 기여 가이드라인 (Contributing Guidelines)

**똑똑한 아이들** 프로젝트에 기여해주셔서 감사합니다! 이 가이드는 프로젝트에 효과적으로 기여할 수 있도록 도와드립니다.

## 📋 목차

1. [기여 방법](#-기여-방법)
2. [개발 환경 설정](#-개발-환경-설정)
3. [코드 스타일](#-코드-스타일)
4. [커밋 메시지 규칙](#-커밋-메시지-규칙)
5. [Pull Request 가이드](#-pull-request-가이드)
6. [이슈 제출](#-이슈-제출)
7. [콘텐츠 기여](#-콘텐츠-기여)
8. [테스트 가이드](#-테스트-가이드)
9. [문서화](#-문서화)
10. [커뮤니티 가이드라인](#-커뮤니티-가이드라인)

## 🤝 기여 방법

### 기여 유형
- **버그 수정**: 발견된 버그를 수정
- **새 기능 추가**: 사용자 경험을 개선하는 새로운 기능
- **콘텐츠 추가**: 새로운 단어, 그림책, 퀴즈 등
- **문서 개선**: README, 가이드, API 문서 등
- **성능 최적화**: 앱 성능 개선
- **접근성 개선**: 장애인 사용자를 위한 접근성 향상

### 기여 전 확인사항
1. **이슈 확인**: 기존 이슈가 있는지 확인
2. **중복 작업 방지**: 다른 기여자가 작업 중인지 확인
3. **논의 참여**: 큰 변경사항은 미리 논의

## 🛠️ 개발 환경 설정

### 필수 요구사항
- **Node.js**: 18.x 이상
- **npm**: 9.x 이상
- **Git**: 최신 버전
- **Supabase CLI**: 설치 권장

### 프로젝트 설정
```bash
# 1. 저장소 포크 및 클론
git clone https://github.com/your-username/toddler-learning-app.git
cd toddler-learning-app

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일에 실제 값 입력

# 4. 개발 서버 실행
npm run dev  # 프론트엔드 (새 터미널)
npm run api  # 백엔드

# 5. 업스트림 원격 저장소 추가
git remote add upstream https://github.com/original-owner/toddler-learning-app.git
```

### 브랜치 전략
```bash
# 메인 브랜치에서 새 브랜치 생성
git checkout main
git pull upstream main
git checkout -b feature/your-feature-name

# 작업 완료 후
git push origin feature/your-feature-name
```

## 🎨 코드 스타일

### TypeScript/JavaScript 규칙
- **들여쓰기**: 2칸 스페이스 사용
- **따옴표**: 홑따옴표 사용 (`'string'`)
- **세미콜론**: 필수 사용
- **변수명**: camelCase 사용
- **상수**: UPPER_SNAKE_CASE 사용

```typescript
// ✅ 좋은 예
const userName = 'john_doe';
const API_BASE_URL = 'https://api.example.com';

function handleUserClick(event: Event): void {
  // 함수 로직
}

// ❌ 나쁜 예
const user_name = "john_doe"
const apiBaseUrl = "https://api.example.com"

function handleUserClick(event: Event) {
  // 함수 로직
}
```

### Vue.js 컴포넌트 규칙
- **컴포넌트명**: PascalCase 사용
- **파일명**: PascalCase 사용 (예: `WordCard.vue`)
- **Props**: camelCase 사용
- **이벤트명**: kebab-case 사용

```vue
<!-- ✅ 좋은 예 -->
<template>
  <div class="word-card">
    <h3>{{ wordText }}</h3>
    <button @click="handleWordClick">클릭</button>
  </div>
</template>

<script setup lang="ts">
interface Props {
  wordText: string;
  isActive: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'word-selected': [word: string];
}>();

const handleWordClick = () => {
  emit('word-selected', props.wordText);
};
</script>
```

### CSS/Tailwind 규칙
- **클래스명**: kebab-case 사용
- **Tailwind**: 유틸리티 클래스 우선 사용
- **사용자 정의 CSS**: 필요시에만 사용

```vue
<!-- ✅ 좋은 예 -->
<div class="flex items-center justify-between p-4 bg-blue-100 rounded-lg">
  <span class="text-lg font-semibold">단어</span>
  <button class="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600">
    클릭
  </button>
</div>
```

## 📝 커밋 메시지 규칙

### 커밋 메시지 형식
```
<type>(<scope>): <description>

<body>

<footer>
```

### 커밋 타입
- **feat**: 새로운 기능 추가
- **fix**: 버그 수정
- **docs**: 문서 수정
- **style**: 코드 스타일 변경 (포맷팅, 세미콜론 등)
- **refactor**: 코드 리팩토링
- **test**: 테스트 추가/수정
- **chore**: 빌드 프로세스, 도구 설정 등

### 커밋 메시지 예시
```bash
# 새 기능
feat(words): 단어 카테고리 필터링 기능 추가

# 버그 수정
fix(audio): 오디오 재생 중 멈춤 현상 수정

# 문서 수정
docs(readme): 설치 가이드 업데이트

# 리팩토링
refactor(components): WordCard 컴포넌트 성능 최적화
```

## 🔄 Pull Request 가이드

### PR 체크리스트
- [ ] 기능이 정상적으로 동작하는지 테스트
- [ ] 기존 테스트가 모두 통과하는지 확인
- [ ] 새로운 기능에 대한 테스트 추가
- [ ] 문서 업데이트 (필요한 경우)
- [ ] 코드 스타일 가이드 준수
- [ ] 커밋 메시지 규칙 준수

### PR 템플릿
```markdown
## 변경 사항 요약
- 추가된 기능이나 수정된 내용을 간략히 설명

## 변경 타입
- [ ] 새 기능 (feat)
- [ ] 버그 수정 (fix)
- [ ] 문서 수정 (docs)
- [ ] 스타일 변경 (style)
- [ ] 리팩토링 (refactor)
- [ ] 테스트 추가 (test)

## 테스트 완료
- [ ] 로컬 환경에서 테스트 완료
- [ ] 기존 기능에 영향 없음 확인
- [ ] 새 기능 정상 동작 확인

## 스크린샷 (UI 변경시)
<!-- 변경 전/후 스크린샷 첨부 -->

## 관련 이슈
Closes #이슈번호
```

### PR 리뷰 과정
1. **자동 체크**: CI/CD 파이프라인 통과
2. **코드 리뷰**: 최소 1명의 리뷰어 승인
3. **테스트**: 수동 테스트 확인
4. **병합**: 메인 브랜치에 병합

## 🐛 이슈 제출

### 버그 리포트
```markdown
**버그 설명**
버그에 대한 간단하고 명확한 설명

**재현 방법**
1. '...' 페이지로 이동
2. '...' 버튼 클릭
3. '...' 입력
4. 오류 발생

**예상 동작**
정상적으로 동작해야 하는 내용

**실제 동작**
실제로 발생하는 문제

**스크린샷**
가능하면 스크린샷 첨부

**환경 정보**
- 기기: [예: iPhone 12]
- 브라우저: [예: Chrome 91]
- 버전: [예: 1.0.0]
```

### 기능 제안
```markdown
**기능 설명**
제안하는 기능에 대한 설명

**문제점**
현재 어떤 문제가 있는지 설명

**해결 방안**
제안하는 해결 방법

**대안**
다른 가능한 해결 방법들

**추가 컨텍스트**
기타 관련 정보나 스크린샷
```

## 🎯 콘텐츠 기여

### 단어 추가
새로운 단어를 추가할 때는 다음 정보가 필요합니다:
- **단어**: 한글 단어
- **이미지**: 1024x1024 이상의 고화질 이미지
- **음성**: 명확한 한국어 발음 (MP3 형식)
- **카테고리**: 적절한 카테고리 분류

### 그림책 추가
새로운 그림책을 추가할 때는 다음 정보가 필요합니다:
- **제목**: 그림책 제목
- **표지**: 고화질 표지 이미지
- **페이지들**: 각 페이지별 이미지, 텍스트, 음성
- **대상 연령**: 적절한 연령대 표시

### 콘텐츠 품질 기준
- **교육적 가치**: 유아 교육에 적합한 내용
- **안전성**: 아이들에게 안전한 내용
- **정확성**: 올바른 정보와 발음
- **다양성**: 다양한 문화와 배경 고려

## 🧪 테스트 가이드

### 테스트 실행
```bash
# 모든 테스트 실행
npm test

# 특정 테스트 실행
npm test -- --grep "WordCard"

# 테스트 커버리지 확인
npm run test:coverage
```

### 테스트 작성 규칙
- **단위 테스트**: 각 함수/컴포넌트별 테스트
- **통합 테스트**: 여러 컴포넌트 상호작용 테스트
- **E2E 테스트**: 사용자 시나리오 테스트

```typescript
// 예시: 단위 테스트
describe('WordCard', () => {
  it('should display word text', () => {
    const wrapper = mount(WordCard, {
      props: { word: '고양이' }
    });
    expect(wrapper.text()).toContain('고양이');
  });

  it('should emit word-selected event on click', async () => {
    const wrapper = mount(WordCard, {
      props: { word: '고양이' }
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('word-selected')).toHaveLength(1);
  });
});
```

## 📚 문서화

### 문서 수정
- **README.md**: 프로젝트 소개 및 설정 가이드
- **API_DOCS.md**: API 사용법 및 예제
- **USER_GUIDE.md**: 사용자 가이드
- **FAQ.md**: 자주 묻는 질문

### 코드 문서화
```typescript
/**
 * 단어 카드 컴포넌트
 * @param word - 표시할 단어
 * @param imageUrl - 단어 관련 이미지 URL
 * @param audioUrl - 단어 발음 오디오 URL
 * @emits word-selected - 단어 선택 시 발생하는 이벤트
 */
export default defineComponent({
  name: 'WordCard',
  // ...
});
```

## 🤝 커뮤니티 가이드라인

### 행동 강령
- **존중**: 모든 기여자를 존중하고 포용적인 환경 조성
- **건설적 피드백**: 비판적이지만 건설적인 피드백 제공
- **협력**: 문제 해결을 위한 협력적 태도
- **인내**: 다른 사람의 학습 과정을 이해하고 도움

### 소통 채널
- **이슈**: 버그 리포트, 기능 제안
- **디스커션**: 일반적인 질문과 아이디어 공유
- **이메일**: 민감한 사안이나 보안 문제

### 도움 요청
프로젝트에 대해 궁금한 점이 있으시면 언제든지 문의해주세요:
- **일반 질문**: GitHub Discussions 사용
- **버그 리포트**: GitHub Issues 사용
- **보안 문제**: 이메일로 직접 연락

## 🎉 기여자 인정

### 기여자 목록
모든 기여자는 README.md 파일에 기록됩니다.

### 기여 유형별 인정
- **코드 기여**: 커밋 기록과 PR 기록
- **콘텐츠 기여**: 특별 감사 섹션
- **문서 기여**: 문서 작성자 크레딧
- **테스트 기여**: 품질 보증 기여자

---

**다시 한 번 기여해주셔서 감사합니다! 함께 더 나은 유아 학습 앱을 만들어가요!** 🎈

더 궁금한 사항이 있으시면 언제든지 문의해주세요.