# 🤖 Claude Code TypeScript 필수 준수 사항

> **⚠️ 이 파일은 Claude Code가 반드시 준수해야 하는 TypeScript 규칙들입니다.**

## 🎯 **코드 수정 전 필수 체크사항**

### **1. 타입 정의 확인 (MANDATORY)**
- 새로운 property나 method를 사용하기 전 **반드시** 해당 타입 정의가 존재하는지 확인
- 없는 property는 **절대로** 추가하지 않음
- 의심스러우면 기존 코드 패턴을 따라감

### **2. 빌드 테스트 (REQUIRED)**
- 코드 수정 후 **반드시** `npm run build` 실행
- TypeScript 에러가 있으면 **절대로** 커밋하지 않음
- 에러 발생 시 즉시 수정 또는 롤백

### **3. 타입 안전성 (CRITICAL)**
- `any` 타입 사용 금지
- 모든 새로운 함수/변수에 타입 명시
- Interface가 없으면 생성하기

---

## 🚫 **절대 금지사항**

### **1. 존재하지 않는 속성 사용**
```typescript
// ❌ 절대 금지 - middleware는 PreviewOptions에 없음
preview: {
  middleware: { ... }  // 이런 코드 작성 금지!
}

// ✅ 대신 기존 옵션만 사용
preview: {
  host: '0.0.0.0',
  port: 4173,
  cors: true
}
```

### **2. 타입 확인 없이 새로운 API 사용**
```typescript
// ❌ 금지 - 타입 정의 확인 없이 사용
config.someNewProperty = value;

// ✅ 올바름 - 기존 API만 사용
config.existingProperty = value;
```

### **3. any 타입 남용**
```typescript
// ❌ 금지
const data: any = {};

// ✅ 올바름  
interface DataType {
  id: string;
  value: number;
}
const data: DataType = { id: '', value: 0 };
```

---

## ✅ **필수 준수 패턴**

### **1. Vite 설정 수정 시**
```typescript
// ✅ 안전한 패턴 - 기존 옵션만 사용
export default defineConfig({
  // 검증된 옵션들만 사용
  plugins: [vue()],
  server: { /* 기존 옵션 */ },
  preview: { 
    host: '0.0.0.0',
    port: 4173,
    cors: true  // 문서화된 옵션만
  },
  build: { /* 기존 옵션 */ }
});
```

### **2. Timer 타입**
```typescript
// ✅ 올바른 Timer 타입
const timer = ref<NodeJS.Timeout | null>(null);
timer.value = setInterval(() => {}, 1000);
```

### **3. Vue Composable 작성**
```typescript
// ✅ 필수 import
import { ref, computed, readonly } from 'vue';

// ✅ 타입 정의 필수
interface SoundConfig {
  volume: number;
  playbackRate?: number;
}

export function useSound() {
  const config = ref<SoundConfig>({ volume: 0.5 });
  return { config: readonly(config) };
}
```

---

## 🔍 **에러 발생 시 해결 순서**

### **1. 즉시 확인사항**
1. 해당 타입 정의가 존재하는가?
2. 올바른 속성명을 사용했는가?
3. Import가 누락되지 않았는가?

### **2. 해결 방법**
1. **공식 문서 확인** (Vite, Vue 등)
2. **기존 코드 패턴 복사**
3. **타입 정의 파일 확인** (`node_modules/@types/...`)
4. **대안 방법 사용** (존재하지 않으면 다른 방법 찾기)

### **3. 최종 검증**
```bash
npm run build  # 반드시 실행
```

---

## 📚 **참고할 타입 정의 위치**

### **Vite 관련**
- `node_modules/vite/dist/node/index.d.ts`
- [Vite 공식 문서](https://vitejs.dev/config/)

### **Vue 관련**
- `node_modules/vue/dist/vue.d.ts`  
- [Vue 3 TypeScript 가이드](https://v3.vuejs.org/guide/typescript-support.html)

### **Node.js 관련**
- `@types/node`
- Timer 타입: `NodeJS.Timeout`

---

## 🎯 **Claude Code 전용 체크리스트**

코드 수정 시 **반드시** 다음을 확인:

- [ ] 새로운 property/method 사용 전 타입 정의 존재 확인
- [ ] `npm run build` 실행하여 TypeScript 에러 없음 확인  
- [ ] 모든 import 문 누락 없음 확인
- [ ] any 타입 사용하지 않음 확인
- [ ] Timer 사용 시 `NodeJS.Timeout` 타입 사용 확인

---

## 🚨 **위반 시 즉시 조치**

TypeScript 에러 발생 시:
1. **즉시 중단**
2. **에러 메시지 분석**  
3. **기존 패턴으로 수정**
4. **빌드 재확인**

**절대로 타입 에러가 있는 상태로 진행하지 않음!**

---

## 💡 **자주 발생하는 실수와 해결책**

### **실수 1: Vite 설정에 존재하지 않는 옵션 추가**
```typescript
// ❌ 실수
preview: {
  middleware: { ... }  // 존재하지 않음
}

// ✅ 해결
preview: {
  host: '0.0.0.0',
  port: 4173,
  cors: true
}
```

### **실수 2: Vue import 누락**
```typescript
// ❌ 실수
const state = ref(false);  // import 없음

// ✅ 해결  
import { ref } from 'vue';
const state = ref(false);
```

### **실수 3: Timer 타입 오류**
```typescript
// ❌ 실수
const timer = ref<number | null>(null);

// ✅ 해결
const timer = ref<NodeJS.Timeout | null>(null);
```

---

**🎯 이 지침을 철저히 준수하여 TypeScript 에러 제로(0)를 달성하자!**