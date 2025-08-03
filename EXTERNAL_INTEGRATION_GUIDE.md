# 🚀 외부 서비스 연동 가이드

## 📋 개요

이 가이드는 유아 학습 앱의 스토리북 등록 API를 다른 서비스에서 사용하는 방법을 설명합니다. 방금 테스트한 영상 등록 기능을 중심으로 실제 연동 방법을 제공합니다.

## 🔧 API 서버 정보

- **베이스 URL**: `http://localhost:3001/api` (개발환경)
- **프로덕션 URL**: `https://your-domain.com/api` (배포 후)
- **인증 방식**: X-API-Key 헤더
- **지원 형식**: JSON, Multipart Form Data

## 🔑 인증 설정

### 1. API 키 확인
```bash
# 현재 사용 가능한 API 키
API_KEY="be77cc2d44ca44d8898e72797d399e4b"
```

### 2. API 키 헤더 설정
모든 요청에 다음 헤더 포함:
```http
X-API-Key: be77cc2d44ca44d8898e72797d399e4b
```

## 📹 비디오 스토리북 등록

### 성공 테스트 결과 기반 가이드

**테스트한 API**: `POST /api/books/video-upload`

### curl 명령어 (검증된 방법)

```bash
curl -X POST \
  -H "X-API-Key: be77cc2d44ca44d8898e72797d399e4b" \
  -F "title=japan" \
  -F "minAge=3" \
  -F "maxAge=7" \
  -F "video=@/Users/treestar/Movies/story.mp4;type=video/mp4" \
  http://localhost:3001/api/books/video-upload \
  --verbose
```

### 🔍 중요 포인트

1. **MIME 타입 명시 필수**: `;type=video/mp4` 반드시 추가
2. **포트 번호**: 3001번 포트 사용
3. **API 경로**: `/api/books/video-upload` (api 프리픽스 필수)

### 응답 예시 (실제 테스트 결과)

```json
{
  "success": true,
  "data": {
    "id": "f41fc2d0-ccf7-4075-8ca8-ea61fdfb3dc7",
    "title": "japan",
    "coverImage": "",
    "isVideoMode": true,
    "videoUrl": "/uploads/videos/55460bb5-fb81-4926-aaad-9f419d9dc0e1.mp4",
    "pages": [],
    "minAge": 3,
    "maxAge": 7,
    "createdAt": "2025-08-03T04:01:37.340Z",
    "updatedAt": "2025-08-03T04:01:37.340Z",
    "uploadedFiles": {
      "video": {
        "filename": "55460bb5-fb81-4926-aaad-9f419d9dc0e1.mp4",
        "originalName": "story.mp4",
        "size": 1540820,
        "mimetype": "video/mp4",
        "url": "/uploads/videos/55460bb5-fb81-4926-aaad-9f419d9dc0e1.mp4"
      },
      "coverImage": null
    }
  },
  "message": "Video storybook created successfully"
}
```

## 🌐 프로그래밍 언어별 연동 예시

### JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function uploadVideoStorybook(videoPath, title, minAge = 3, maxAge = 7) {
  const form = new FormData();
  form.append('title', title);
  form.append('minAge', minAge.toString());
  form.append('maxAge', maxAge.toString());
  form.append('video', fs.createReadStream(videoPath), {
    contentType: 'video/mp4'
  });

  try {
    const response = await axios.post(
      'http://localhost:3001/api/books/video-upload',
      form,
      {
        headers: {
          'X-API-Key': 'be77cc2d44ca44d8898e72797d399e4b',
          ...form.getHeaders()
        }
      }
    );
    
    console.log('Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    throw error;
  }
}

// 사용 예시
uploadVideoStorybook('/path/to/video.mp4', 'My Story Title');
```

### Python

```python
import requests

def upload_video_storybook(video_path, title, min_age=3, max_age=7):
    url = 'http://localhost:3001/api/books/video-upload'
    headers = {
        'X-API-Key': 'be77cc2d44ca44d8898e72797d399e4b'
    }
    
    files = {
        'video': ('video.mp4', open(video_path, 'rb'), 'video/mp4')
    }
    
    data = {
        'title': title,
        'minAge': str(min_age),
        'maxAge': str(max_age)
    }
    
    try:
        response = requests.post(url, headers=headers, files=files, data=data)
        response.raise_for_status()
        
        result = response.json()
        print(f"Success: {result}")
        return result
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response: {e.response.text}")
        raise
    finally:
        files['video'][1].close()

# 사용 예시
upload_video_storybook('/path/to/video.mp4', 'My Story Title')
```

### PHP

```php
<?php
function uploadVideoStorybook($videoPath, $title, $minAge = 3, $maxAge = 7) {
    $url = 'http://localhost:3001/api/books/video-upload';
    
    $postFields = [
        'title' => $title,
        'minAge' => (string)$minAge,
        'maxAge' => (string)$maxAge,
        'video' => new CURLFile($videoPath, 'video/mp4', basename($videoPath))
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $postFields,
        CURLOPT_HTTPHEADER => [
            'X-API-Key: be77cc2d44ca44d8898e72797d399e4b'
        ],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_VERBOSE => true
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 201) {
        $result = json_decode($response, true);
        echo "Success: " . json_encode($result, JSON_PRETTY_PRINT);
        return $result;
    } else {
        echo "Error ($httpCode): $response";
        throw new Exception("Upload failed");
    }
}

// 사용 예시
uploadVideoStorybook('/path/to/video.mp4', 'My Story Title');
?>
```

## 📊 전체 API 엔드포인트

### 스토리북 관련 API

| 메서드 | 엔드포인트 | 설명 | 인증 |
|--------|------------|------|------|
| `GET` | `/api/books` | 모든 스토리북 조회 | 없음 |
| `GET` | `/api/books/{id}` | 특정 스토리북 조회 | 없음 |
| `POST` | `/api/books` | 전통적 스토리북 생성 | API 키 |
| `POST` | `/api/books/video-upload` | **비디오 스토리북 생성** | API 키 |
| `POST` | `/api/books/complete` | 완전한 스토리북 생성 | API 키 |
| `PUT` | `/api/books/{id}` | 스토리북 수정 | API 키 |
| `DELETE` | `/api/books/{id}` | 스토리북 삭제 | API 키 |

### 단어 관련 API

| 메서드 | 엔드포인트 | 설명 | 인증 |
|--------|------------|------|------|
| `GET` | `/api/words` | 모든 단어 조회 | 없음 |
| `GET` | `/api/words/{id}` | 특정 단어 조회 | 없음 |
| `POST` | `/api/words` | 단어 생성 | API 키 |
| `POST` | `/api/words/batch` | 배치 단어 생성 | API 키 |
| `PUT` | `/api/words/{id}` | 단어 수정 | API 키 |
| `DELETE` | `/api/words/{id}` | 단어 삭제 | API 키 |

## 🛠️ 지원 파일 형식

### 비디오 파일
- **지원 형식**: MP4, AVI, MOV, MKV, WEBM
- **최대 크기**: 500MB
- **권장 형식**: MP4 (호환성 최고)

### 이미지 파일
- **지원 형식**: PNG, JPG, JPEG, GIF, WEBP
- **최대 크기**: 50MB
- **권장 형식**: PNG (투명도 지원)

### 오디오 파일
- **지원 형식**: MP3, WAV, AAC, OGG
- **최대 크기**: 50MB
- **권장 형식**: MP3 (호환성 최고)

## 🔍 응답 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| `200` | 성공 | 조회/수정 성공 |
| `201` | 생성됨 | 새 리소스 생성 성공 |
| `400` | 잘못된 요청 | 필수 필드 누락 또는 잘못된 형식 |
| `401` | 인증 실패 | API 키 누락 또는 잘못됨 |
| `404` | 찾을 수 없음 | 요청한 리소스가 존재하지 않음 |
| `413` | 파일 너무 큼 | 파일 크기 제한 초과 |
| `500` | 서버 오류 | 내부 서버 오류 |

## ⚠️ 주의사항 및 모범 사례

### 1. 파일 업로드 시 주의점
```bash
# ✅ 올바른 방법 - MIME 타입 명시
-F "video=@/path/to/video.mp4;type=video/mp4"

# ❌ 잘못된 방법 - MIME 타입 누락
-F "video=@/path/to/video.mp4"
```

### 2. 오류 처리
```javascript
// 응답에서 오류 정보 확인
if (!response.data.success) {
  console.error('API Error:', response.data.error);
  console.error('Message:', response.data.message);
}
```

### 3. 파일 경로 주의
- 절대 경로 사용 권장
- 파일 존재 여부 사전 확인
- 적절한 파일 권한 설정

### 4. API 키 보안
- 환경 변수로 관리
- 코드에 하드코딩 금지
- 정기적인 키 로테이션

## 🧪 테스트 방법

### 1. 연결 테스트
```bash
curl -H "Accept: application/json" \
  http://localhost:3001/health
```

### 2. API 문서 확인
```bash
curl -H "Accept: application/json" \
  http://localhost:3001/api/docs
```

### 3. 스토리북 목록 조회
```bash
curl -H "Accept: application/json" \
  http://localhost:3001/api/books
```

## 📚 Swagger API 문서

자세한 API 문서는 다음 방법으로 확인 가능:

### 1. 로컬 문서 생성
```bash
npm run swagger:generate
npm run swagger:serve
```

### 2. 온라인 에디터
1. `swagger.json` 파일 다운로드
2. https://editor.swagger.io/ 접속
3. 파일 업로드하여 확인

## 🚀 프로덕션 배포 시 변경사항

### 1. URL 변경
```javascript
// 개발환경
const BASE_URL = 'http://localhost:3001/api';

// 프로덕션
const BASE_URL = 'https://your-domain.com/api';
```

### 2. API 키 관리
```bash
# 환경 변수로 설정
export API_KEY="your-production-api-key"
```

### 3. HTTPS 사용
- 모든 요청을 HTTPS로 변경
- SSL 인증서 확인

## 📞 문제 해결

### 자주 발생하는 오류

1. **"Only video files are allowed"**
   - 해결: MIME 타입 명시 (`;type=video/mp4`)

2. **"Connection refused"**
   - 해결: 포트 번호 확인 (3001번 포트)

3. **"Invalid or missing API key"**
   - 해결: X-API-Key 헤더 확인

4. **"File too large"**
   - 해결: 파일 크기를 500MB 미만으로 조정

### 로그 확인
```bash
# 서버 로그 모니터링
tail -f server/logs/app.log
```

## 📈 성능 최적화

### 1. 파일 크기 최적화
- 비디오: H.264 코덱 사용
- 해상도: 1080p 이하 권장
- 비트레이트: 적정 수준 유지

### 2. 동시 업로드 제한
- 한 번에 최대 5개 파일
- 순차 업로드 권장

### 3. 재시도 로직
```javascript
// 업로드 실패 시 재시도
const maxRetries = 3;
let retryCount = 0;

while (retryCount < maxRetries) {
  try {
    const result = await uploadVideo();
    break;
  } catch (error) {
    retryCount++;
    if (retryCount >= maxRetries) throw error;
    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
  }
}
```

## 🎉 성공 사례

**방금 테스트한 결과:**
- ✅ 1.5MB MP4 파일 성공적으로 업로드
- ✅ 스토리북 ID: `f41fc2d0-ccf7-4075-8ca8-ea61fdfb3dc7`
- ✅ 파일 저장 경로: `/uploads/videos/55460bb5-fb81-4926-aaad-9f419d9dc0e1.mp4`
- ✅ API 응답 시간: 약 1초

이 가이드를 따르면 외부 서비스에서 안정적으로 스토리북 등록 API를 사용할 수 있습니다! 🚀