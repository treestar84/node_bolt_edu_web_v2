#!/bin/bash

# GCP 배포 스크립트
# PM2 서비스 자동화를 위한 스크립트

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 Starting deployment..."

# 1. 의존성 설치
echo "📦 Installing dependencies..."
npm ci

# 2. TypeScript 컴파일 및 빌드
echo "🔨 Building application..."
npm run build

# 2.1. 빌드 결과 확인
echo "📋 Verifying build output..."
if [ ! -d "dist" ]; then
  echo "❌ ERROR: dist directory not found!"
  exit 1
fi

if [ ! -f "dist/index.html" ]; then
  echo "❌ ERROR: dist/index.html not found!"
  exit 1
fi

echo "✅ Build verification completed - dist folder ready"
ls -la dist/

# 3. PM2 프로세스 중단
echo "⏹️ Stopping PM2 processes..."
pm2 stop front || true
pm2 stop api || true

# 4. PM2 프로세스 삭제 (설정 재로드를 위해)
echo "🗑️ Deleting PM2 processes..."
pm2 delete front || true
pm2 delete api || true

# 5. PM2 프로세스 시작
echo "▶️ Starting PM2 processes..."
pm2 start ecosystem.config.cjs

# 6. PM2 저장
echo "💾 Saving PM2 configuration..."
pm2 save

# 7. 상태 확인
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend: http://localhost:4173"
echo "🔧 API: http://localhost:3001"
echo "📝 Logs: pm2 logs"