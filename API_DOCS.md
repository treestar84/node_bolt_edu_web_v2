# 똑똑한 아이들 - API 문서

## 📋 개요

똑똑한 아이들 API는 유아 학습 애플리케이션의 백엔드 서비스를 제공합니다. RESTful API 설계 원칙을 따르며, JSON 형식으로 데이터를 주고받습니다.

### 기본 정보
- **Base URL**: `http://localhost:3001/api` (개발환경)
- **API 버전**: v1.0.0
- **Content-Type**: `application/json`
- **문자 인코딩**: UTF-8

### 인증 방식
- **관리자 인증**: Bearer Token (JWT)
- **API 키 인증**: X-API-Key 헤더

## 🔐 인증 (Authentication)

### 1. 관리자 로그인
**POST** `/api/auth/login`

관리자 계정으로 로그인하여 JWT 토큰을 발급받습니다.

**Request Body:**
```json
{
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "로그인 성공"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Invalid password"
}
```

### 2. 관리자 로그아웃
**POST** `/api/auth/logout`

현재 세션을 종료합니다.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "로그아웃 성공"
}
```

### 3. 토큰 검증
**GET** `/api/auth/verify`

현재 토큰의 유효성을 검증합니다.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "valid": true,
  "message": "토큰이 유효합니다"
}
```

## 📚 단어 관리 (Words)

### 1. 전체 단어 조회
**GET** `/api/words`

모든 단어를 조회합니다.

**Query Parameters:**
- `category` (optional): 카테고리별 필터링
- `limit` (optional): 최대 결과 수
- `offset` (optional): 건너뛸 결과 수

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "word": "고양이",
      "imageUrl": "/server/uploads/images/cat.png",
      "audioUrl": "/server/uploads/audio/cat.mp3",
      "category": "동물",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 100
}
```

### 2. 단어 생성
**POST** `/api/words`

새로운 단어를 생성합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "word": "강아지",
  "imageUrl": "/server/uploads/images/dog.png",
  "audioUrl": "/server/uploads/audio/dog.mp3",
  "category": "동물"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-2",
    "word": "강아지",
    "imageUrl": "/server/uploads/images/dog.png",
    "audioUrl": "/server/uploads/audio/dog.mp3",
    "category": "동물",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 3. 단어 수정
**PUT** `/api/words/:id`

기존 단어를 수정합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "word": "새로운 단어",
  "category": "새로운 카테고리"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-2",
    "word": "새로운 단어",
    "imageUrl": "/server/uploads/images/dog.png",
    "audioUrl": "/server/uploads/audio/dog.mp3",
    "category": "새로운 카테고리",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T12:00:00.000Z"
  }
}
```

### 4. 단어 삭제
**DELETE** `/api/words/:id`

단어를 삭제합니다.

**Headers:**
```
X-API-Key: <api-key>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "단어가 삭제되었습니다"
}
```

### 5. 단어 일괄 생성
**POST** `/api/words/batch`

여러 단어를 한 번에 생성합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "words": [
    {
      "word": "사과",
      "imageUrl": "/server/uploads/images/apple.png",
      "audioUrl": "/server/uploads/audio/apple.mp3",
      "category": "과일"
    },
    {
      "word": "바나나",
      "imageUrl": "/server/uploads/images/banana.png",
      "audioUrl": "/server/uploads/audio/banana.mp3",
      "category": "과일"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "created": 2,
    "words": [
      {
        "id": "uuid-3",
        "word": "사과",
        "imageUrl": "/server/uploads/images/apple.png",
        "audioUrl": "/server/uploads/audio/apple.mp3",
        "category": "과일"
      },
      {
        "id": "uuid-4",
        "word": "바나나",
        "imageUrl": "/server/uploads/images/banana.png",
        "audioUrl": "/server/uploads/audio/banana.mp3",
        "category": "과일"
      }
    ]
  }
}
```

## 📖 그림책 관리 (Books)

### 1. 전체 그림책 조회
**GET** `/api/books`

모든 그림책을 조회합니다.

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-book-1",
      "title": "동물 친구들",
      "coverImageUrl": "/server/uploads/images/book-cover.png",
      "pages": [
        {
          "id": "uuid-page-1",
          "pageNumber": 1,
          "imageUrl": "/server/uploads/images/page1.png",
          "text": "옛날 옛날에 동물 친구들이 살았어요.",
          "audioUrl": "/server/uploads/audio/page1.mp3"
        }
      ],
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 10
}
```

### 2. 그림책 생성
**POST** `/api/books`

새로운 그림책을 생성합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "새로운 이야기",
  "coverImageUrl": "/server/uploads/images/new-cover.png",
  "pages": [
    {
      "pageNumber": 1,
      "imageUrl": "/server/uploads/images/new-page1.png",
      "text": "새로운 이야기가 시작됩니다.",
      "audioUrl": "/server/uploads/audio/new-page1.mp3"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-book-2",
    "title": "새로운 이야기",
    "coverImageUrl": "/server/uploads/images/new-cover.png",
    "pages": [
      {
        "id": "uuid-page-2",
        "pageNumber": 1,
        "imageUrl": "/server/uploads/images/new-page1.png",
        "text": "새로운 이야기가 시작됩니다.",
        "audioUrl": "/server/uploads/audio/new-page1.mp3"
      }
    ],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 3. 그림책 수정
**PUT** `/api/books/:id`

기존 그림책을 수정합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "수정된 제목",
  "coverImageUrl": "/server/uploads/images/updated-cover.png"
}
```

### 4. 그림책 삭제
**DELETE** `/api/books/:id`

그림책을 삭제합니다.

**Headers:**
```
X-API-Key: <api-key>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "그림책이 삭제되었습니다"
}
```

### 5. 완전한 그림책 생성
**POST** `/api/books/complete`

모든 페이지와 내용을 포함한 완전한 그림책을 생성합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "완전한 이야기",
  "coverImageUrl": "/server/uploads/images/complete-cover.png",
  "pages": [
    {
      "pageNumber": 1,
      "imageUrl": "/server/uploads/images/page1.png",
      "text": "첫 번째 페이지입니다.",
      "audioUrl": "/server/uploads/audio/page1.mp3"
    },
    {
      "pageNumber": 2,
      "imageUrl": "/server/uploads/images/page2.png",
      "text": "두 번째 페이지입니다.",
      "audioUrl": "/server/uploads/audio/page2.mp3"
    }
  ]
}
```

## 📁 파일 업로드 (Upload)

### 1. 이미지 업로드
**POST** `/api/upload/image`

이미지 파일을 업로드합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `image`: 이미지 파일 (PNG, JPG, JPEG, GIF)
- `category` (optional): 카테고리 (words, books, general)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "filename": "uuid-filename.png",
    "originalName": "original-image.png",
    "size": 1024000,
    "mimetype": "image/png",
    "url": "/server/uploads/images/uuid-filename.png"
  }
}
```

### 2. 오디오 업로드
**POST** `/api/upload/audio`

오디오 파일을 업로드합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `audio`: 오디오 파일 (MP3, WAV, OGG)
- `category` (optional): 카테고리 (words, books, general)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "filename": "uuid-filename.mp3",
    "originalName": "original-audio.mp3",
    "size": 2048000,
    "mimetype": "audio/mpeg",
    "url": "/server/uploads/audio/uuid-filename.mp3"
  }
}
```

### 3. 다중 파일 업로드
**POST** `/api/upload/batch`

여러 파일을 한 번에 업로드합니다.

**Headers:**
```
X-API-Key: <api-key>
Content-Type: multipart/form-data
```

**Request Body (form-data):**
- `files`: 다중 파일 선택
- `category` (optional): 카테고리

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "uploaded": 3,
    "files": [
      {
        "filename": "uuid-1.png",
        "originalName": "image1.png",
        "size": 1024000,
        "mimetype": "image/png",
        "url": "/server/uploads/images/uuid-1.png"
      },
      {
        "filename": "uuid-2.mp3",
        "originalName": "audio1.mp3",
        "size": 2048000,
        "mimetype": "audio/mpeg",
        "url": "/server/uploads/audio/uuid-2.mp3"
      }
    ]
  }
}
```

## 🔑 API 키 관리 (Keys)

### 1. API 키 목록 조회
**GET** `/api/keys`

모든 API 키를 조회합니다. (관리자 전용)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-key-1",
      "name": "개발용 키",
      "key": "api_key_*****",
      "isActive": true,
      "createdAt": "2023-01-01T00:00:00.000Z",
      "lastUsed": "2023-01-01T12:00:00.000Z"
    }
  ]
}
```

### 2. API 키 생성
**POST** `/api/keys`

새로운 API 키를 생성합니다. (관리자 전용)

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "새로운 API 키",
  "description": "API 키 설명"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-key-2",
    "name": "새로운 API 키",
    "key": "api_key_full_key_here",
    "isActive": true,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### 3. API 키 삭제
**DELETE** `/api/keys/:id`

API 키를 삭제합니다. (관리자 전용)

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "API 키가 삭제되었습니다"
}
```

## 🔍 상태 확인 (Health Check)

### 시스템 상태 확인
**GET** `/health`

서버의 상태를 확인합니다.

**Response (200 OK):**
```json
{
  "status": "OK",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## 📊 오류 응답

### 일반적인 오류 형식
```json
{
  "error": "오류 메시지",
  "message": "상세한 오류 설명",
  "code": "ERROR_CODE"
}
```

### HTTP 상태 코드
- **200 OK**: 성공
- **201 Created**: 생성 성공
- **400 Bad Request**: 잘못된 요청
- **401 Unauthorized**: 인증 실패
- **403 Forbidden**: 권한 없음
- **404 Not Found**: 리소스 없음
- **413 Payload Too Large**: 파일 크기 초과
- **429 Too Many Requests**: 요청 한도 초과
- **500 Internal Server Error**: 서버 오류

### 예시 오류 응답
```json
{
  "error": "Validation failed",
  "message": "필수 필드가 누락되었습니다",
  "details": {
    "field": "word",
    "message": "단어는 필수 입력값입니다"
  }
}
```

## 🛡️ 보안 및 제한사항

### Rate Limiting
- **일반 요청**: 15분당 100회
- **API 요청**: 15분당 50회

### 파일 업로드 제한
- **최대 파일 크기**: 50MB
- **허용 이미지 형식**: PNG, JPG, JPEG, GIF
- **허용 오디오 형식**: MP3, WAV, OGG

### 보안 헤더
- **X-Frame-Options**: SAMEORIGIN
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Content-Security-Policy**: 적용됨

## 📝 사용 예제

### JavaScript (Fetch API)
```javascript
// 단어 목록 조회
const getWords = async () => {
  try {
    const response = await fetch('/api/words');
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};

// 새 단어 생성
const createWord = async (wordData) => {
  try {
    const response = await fetch('/api/words', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'your-api-key'
      },
      body: JSON.stringify(wordData)
    });
    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### cURL 예제
```bash
# 단어 목록 조회
curl -X GET http://localhost:3001/api/words

# 새 단어 생성
curl -X POST http://localhost:3001/api/words \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "word": "고양이",
    "imageUrl": "/server/uploads/images/cat.png",
    "audioUrl": "/server/uploads/audio/cat.mp3",
    "category": "동물"
  }'

# 이미지 업로드
curl -X POST http://localhost:3001/api/upload/image \
  -H "X-API-Key: your-api-key" \
  -F "image=@/path/to/image.png" \
  -F "category=words"
```

---

**더 자세한 정보는 `/api/docs` 엔드포인트를 통해 실시간으로 확인할 수 있습니다.**