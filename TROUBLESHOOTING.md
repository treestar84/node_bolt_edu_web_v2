# 트러블슈팅 가이드

## 📹 MP4 파일 업로드 413 에러 문제

### 🔍 문제 상황
- **증상**: MP4 파일 업로드 시 `413 Content Too Large` 에러 발생
- **환경**: Google Cloud Platform (GCP) 배포 환경
- **파일 크기**: 2.4MB (작은 파일임에도 불구하고 에러 발생)
- **로컬 환경**: 정상 동작
- **에러 메시지**: 
  ```
  POST https://duck-edu-word.duckdns.org/api/upload/video 413 (Content Too Large)
  Upload error: Error: Upload failed: 413
  ```

### 🕵️ 문제 분석 과정

#### 1단계: 서버 코드 레벨 확인
- **Express body parser 제한**: `express.json({ limit: '50mb' })` → 문제 없음
- **Multer 파일 크기 제한**: `fileSize: 200MB` → 문제 없음
- **결론**: 서버 애플리케이션 레벨에서는 문제 없음

#### 2단계: Rate Limiting 이슈 발견
- **증상**: `ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` 에러 동시 발생
- **원인**: Express Rate Limit이 프록시 환경에서 오작동
- **시도한 해결책**: 
  ```javascript
  app.set('trust proxy', true); // 프록시 신뢰 설정
  ```
- **결과**: Rate Limiting 에러는 해결됐지만 413 에러 지속

#### 3단계: GCP 인프라 레벨 제한 분석
- **GCP Cloud Run 기본 제한**: 32MB 요청 크기 제한
- **Google Cloud Load Balancer**: 32MB 기본 제한
- **DuckDNS 프록시**: 알려지지 않은 제한 가능성

### 📋 시도한 해결 방법들

#### ❌ 실패한 방법들

1. **서버 제한 완화**
   ```javascript
   // Express body parser 증가
   app.use(express.json({ limit: '50mb' }));
   app.use(express.urlencoded({ extended: true, limit: '50mb' }));
   
   // Multer 제한 증가
   limits: { fileSize: 200 * 1024 * 1024 } // 200MB
   ```
   **결과**: 여전히 413 에러

2. **Rate Limiting 완전 비활성화**
   ```javascript
   // Rate limiting 완전 주석 처리
   // app.use(limiter);
   // app.use('/api', apiLimiter);
   ```
   **결과**: Rate Limit 에러는 해결, 413 에러 지속

3. **파일 크기 단계적 감소**
   - 200MB → 10MB → 5MB 순차 감소
   **결과**: 2.4MB 파일도 여전히 413 에러

#### ✅ 부분적 성공 방법들

1. **Trust Proxy 설정**
   ```javascript
   app.set('trust proxy', true);
   ```
   **결과**: Rate Limiting 에러 해결

2. **작은 테스트 파일 생성 기능**
   ```javascript
   // 32바이트 크기의 최소 MP4 파일 생성
   const minimalMp4 = Buffer.from([
     0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70, // ftyp box
     // ... minimal MP4 structure
   ]);
   ```
   **결과**: 파일 생성은 되지만 브라우저에서 재생 불가

### 🎯 핵심 원인 분석

#### 근본 원인: **다중 프록시 레이어 제한**

```
사용자 → DuckDNS → Google Cloud Load Balancer → Cloud Run 인스턴스
        (제한?)  →  (32MB 제한)            →  (애플리케이션 제한)
```

1. **DuckDNS 프록시**: 명시되지 않은 파일 크기 제한 가능성
2. **Google Cloud Load Balancer**: 32MB 기본 제한
3. **Cloud Run**: 32MB 기본 요청 크기 제한

#### 왜 로컬에서는 동작하는가?
- 직접 연결: `브라우저 → Express 서버`
- 중간 프록시 레이어 없음
- 애플리케이션 레벨 제한만 적용

### 🛠️ 해결 방법

#### 방법 1: GCP 직접 URL 사용 (즉시 적용 가능)

1. **GCP Cloud Run 콘솔**에서 서비스의 **실제 URL** 확인
   ```
   예: https://your-service-hash-uc.a.run.app
   ```

2. **DuckDNS 우회**하여 직접 URL로 접속하여 테스트

3. **직접 URL에서 성공하면** → DuckDNS 프록시가 원인임을 확인

#### 방법 2: Cloud Run 설정 변경 (추천)

```bash
# GCP Cloud Shell에서 실행
gcloud run services update YOUR_SERVICE_NAME \
  --region=YOUR_REGION \
  --max-instances=10 \
  --memory=1Gi \
  --timeout=300 \
  --set-env-vars="MAX_REQUEST_SIZE=50MB"
```

#### 방법 3: 파일 크기 최적화 (임시 해결책)

1. **MP4 압축**: 파일을 1MB 이하로 압축
2. **비디오 품질 조정**: 해상도/비트레이트 감소
3. **청크 업로드**: 큰 파일을 작은 단위로 분할 업로드

#### 방법 4: 대안 업로드 방식

```javascript
// 청크 업로드 구현 예시
const uploadInChunks = async (file, chunkSize = 1024 * 1024) => {
  const chunks = Math.ceil(file.size / chunkSize);
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    await uploadChunk(chunk, i, chunks);
  }
};
```

### 📊 현재 상태 및 권장사항

#### 현재 서버 설정 상태
```javascript
// Express 설정
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.set('trust proxy', true);

// Multer 설정  
limits: { fileSize: 5 * 1024 * 1024 } // 5MB

// Rate Limiting
// 완전 비활성화 상태
```

#### 권장 조치 순서

1. **🔥 즉시**: GCP 직접 URL로 테스트하여 원인 확정
2. **📱 단기**: 1MB 이하 파일로 임시 운영
3. **⚙️ 중기**: Cloud Run 설정 변경 적용
4. **🏗️ 장기**: 청크 업로드 또는 CDN 도입 검토

### 🔍 디버깅 도구

#### 에러 확인 방법
```bash
# GCP 로그 확인
gcloud logs read --service=YOUR_SERVICE_NAME --limit=50

# PM2 로그 확인 (서버에서)
pm2 logs api

# 네트워크 요청 확인 (브라우저 개발자 도구)
Network 탭 → 실패한 요청 → Response Headers 확인
```

#### 파일 크기 확인
```javascript
// 브라우저에서 파일 크기 확인
console.log('File size:', file.size, 'bytes');
console.log('File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
```

### 📝 교훈 및 주의사항

#### 🎯 핵심 교훈
1. **클라우드 환경**에서는 **다중 레이어 제한**을 고려해야 함
2. **로컬 테스트만으로는 프로덕션 이슈를 발견할 수 없음**
3. **인프라 레벨 제한**은 애플리케이션 코드로 해결 불가

#### ⚠️ 주의사항
1. **DuckDNS 등 무료 프록시**는 제한사항이 명시되지 않을 수 있음
2. **GCP 기본 설정**은 대부분 보수적으로 설정됨
3. **파일 업로드 기능**은 반드시 프로덕션 환경에서 테스트 필요

### 🔗 관련 리소스

- [Google Cloud Run 요청 제한](https://cloud.google.com/run/quotas)
- [Express.js 파일 업로드 가이드](https://expressjs.com/en/resources/middleware/multer.html)
- [Multer 설정 문서](https://github.com/expressjs/multer#limits)
- [DuckDNS 사용 제한](https://www.duckdns.org/spec.jsp)

---
*이 문서는 실제 발생한 문제를 바탕으로 작성되었으며, 향후 유사한 이슈 해결에 참고하시기 바랍니다.*