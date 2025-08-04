# 버튼 색상 대비 개선 가이드라인

## 🚨 문제 상황

다크모드에서 `--color-primary`가 흰색(`#ffffff`)으로 설정되어 있어, 흰색 배경에 흰색 텍스트를 사용하면 텍스트가 보이지 않는 문제가 발생합니다.

## ✅ 올바른 색상 조합

### Primary 배경을 사용하는 경우
```css
/* ❌ 잘못된 예시 - 흰 배경에 흰 텍스트 */
.wrong-button {
  background: var(--color-primary);  /* 다크모드에서 #ffffff */
  color: var(--color-text-white);    /* #ffffff */
}

/* ✅ 올바른 예시 - 흰 배경에 어두운 텍스트 */
.correct-button {
  background: var(--color-primary);  /* 다크모드에서 #ffffff */
  color: var(--color-bg-primary);    /* 다크모드에서 #0a0a0a */
}
```

### Success/Danger 배경을 사용하는 경우
```css
/* ✅ Success 버튼 */
.btn-success {
  background: var(--color-success);  /* #10b981 */
  color: var(--color-text-white);    /* #ffffff - 충분한 대비 */
}

/* ✅ Danger 버튼 */
.btn-danger {
  background: var(--color-danger);   /* #ef4444 */
  color: var(--color-text-white);    /* #ffffff - 충분한 대비 */
}
```

## 🎨 색상 변수 이해

### 다크모드 (기본)
- `--color-primary`: `#ffffff` (흰색)
- `--color-bg-primary`: `#0a0a0a` (거의 검은색)
- `--color-text-white`: `#ffffff` (흰색)

### 라이트모드
- `--color-primary`: `#0f172a` (어두운색)
- `--color-bg-primary`: `#ffffff` (흰색)
- `--color-text-white`: `#ffffff` (흰색)

## 📋 점검해야 할 패턴들

### 1. Primary 배경 + White 텍스트 조합
```bash
# 이런 패턴을 찾아서 수정
grep -r "background.*var(--color-primary)" --include="*.vue" --include="*.css" .
grep -r "color.*var(--color-text-white)" --include="*.vue" --include="*.css" .
```

### 2. 수정이 필요한 CSS 클래스들
- `.feature-tag` (수정완료)
- `.btn-primary` 관련 커스텀 스타일
- 기타 primary 배경을 사용하는 요소들

## 🛠️ 수정 방법

### 단계 1: 문제 패턴 식별
1. `background: var(--color-primary)`를 사용하는 요소 찾기
2. 해당 요소가 `color: var(--color-text-white)` 사용하는지 확인

### 단계 2: 색상 조합 수정
```css
/* Before */
.element {
  background: var(--color-primary);
  color: var(--color-text-white);  /* ❌ 다크모드에서 흰배경+흰텍스트 */
}

/* After */
.element {
  background: var(--color-primary);
  color: var(--color-bg-primary);   /* ✅ 다크모드에서 흰배경+검은텍스트 */
}
```

### 단계 3: 호버 상태도 함께 수정
```css
.element:hover {
  background: var(--color-primary-light);
  color: var(--color-bg-primary);  /* 호버 상태도 동일하게 수정 */
}
```

## 🔍 자주 발생하는 케이스

1. **버튼 요소**: Primary 버튼의 텍스트 색상
2. **태그/배지**: Feature tag, status badge 등
3. **액티브 상태**: 선택된 항목의 하이라이트
4. **네비게이션**: 현재 페이지 표시

## 🎯 테스트 방법

1. 다크모드로 전환
2. Primary 색상을 사용하는 모든 UI 요소 확인
3. 텍스트가 명확히 보이는지 검증
4. 호버/액티브 상태도 함께 테스트

## 📚 참고 사항

- 이 가이드라인은 모든 새로운 컴포넌트 개발 시 적용해야 함
- 기존 컴포넌트 수정 시에도 이 패턴을 따라야 함
- 접근성을 위해 최소 4.5:1의 색상 대비율 유지 권장