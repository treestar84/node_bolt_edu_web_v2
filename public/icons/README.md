# 앱 아이콘 가이드

## 현재 상태
- 플레이스홀더 SVG 아이콘 생성됨
- 실제 PNG 아이콘들은 디자인 작업 후 생성 필요

## 필요한 아이콘 크기들

### PWA 아이콘
- `icon-72x72.png` - Android 홈 화면 (ldpi)
- `icon-96x96.png` - Android 홈 화면 (mdpi)
- `icon-128x128.png` - Chrome 웹 스토어
- `icon-144x144.png` - Windows 타일
- `icon-152x152.png` - iOS 홈 화면
- `icon-180x180.png` - iOS 홈 화면 (최신)
- `icon-192x192.png` - Android 홈 화면 (기본)
- `icon-384x384.png` - Android 스플래시
- `icon-512x512.png` - PWA 메인 아이콘

### 단축키 아이콘
- `shortcut-words.png` - 단어 학습 단축키 (96x96)
- `shortcut-books.png` - 그림책 단축키 (96x96)
- `shortcut-quiz.png` - 퀴즈 단축키 (96x96)

### 스크린샷 (앱 스토어용)
- `mobile-home.png` - 모바일 홈 화면 (390x844)
- `mobile-words.png` - 모바일 단어 학습 (390x844)
- `tablet-home.png` - 태블릿 홈 화면 (1024x768)

## 아이콘 생성 방법

### 1. 온라인 도구 사용
```bash
# PWA Asset Generator 사용
npx pwa-asset-generator icon-placeholder.svg public/icons --manifest public/manifest.json
```

### 2. 수동 생성
1. 512x512 PNG 마스터 아이콘 생성
2. 각 크기별로 리사이징
3. 모든 아이콘을 `/public/icons/` 폴더에 저장

### 3. 디자인 요구사항
- **색상**: 메인 색상 #3b82f6 (파란색)
- **스타일**: 유아 친화적, 둥근 모서리
- **요소**: 책, 별, 하트, 퍼즐 등 학습 관련 아이콘
- **텍스트**: "똑똑한 아이들" 또는 "Smart Kids"
- **배경**: 그라데이션 또는 단색

## 임시 해결책
현재는 `icon-placeholder.svg`를 사용하고 있으며, 실제 서비스 전에 디자이너와 협업하여 전문적인 아이콘 세트를 제작해야 합니다.

## 참고 링크
- [PWA 아이콘 가이드](https://web.dev/add-manifest/)
- [Android 아이콘 가이드](https://developer.android.com/guide/practices/ui_guidelines/icon_design)
- [iOS 아이콘 가이드](https://developer.apple.com/design/human-interface-guidelines/ios/icons-and-images/app-icon/)