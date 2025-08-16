#!/bin/bash

# GCP 배포 스크립트 (Preview 모드)
# Vite preview를 사용하는 대안 배포 스크립트

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 Starting deployment (Preview mode)..."

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

# 3. PM2 프로세스 중단
echo "⏹️ Stopping PM2 processes..."
pm2 stop front || true
pm2 stop api || true

# 4. PM2 프로세스 삭제 (설정 재로드를 위해)
echo "🗑️ Deleting PM2 processes..."
pm2 delete front || true
pm2 delete api || true

# 5. Preview 모드용 임시 ecosystem 설정
echo "⚙️ Creating preview mode ecosystem config..."
cat > ecosystem.preview.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'server/index.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '~/.pm2/logs/api-error.log',
      out_file: '~/.pm2/logs/api-out.log',
      log_file: '~/.pm2/logs/api-combined.log',
      merge_logs: true
    },
    {
      name: 'front',
      script: 'npm',
      args: 'run preview',
      env: {
        NODE_ENV: 'production',
        PORT: 4173
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      error_file: '~/.pm2/logs/front-error.log',
      out_file: '~/.pm2/logs/front-out.log',
      log_file: '~/.pm2/logs/front-combined.log',
      merge_logs: true,
      time: true
    }
  ]
};
EOF

# 6. PM2 프로세스 시작 (Preview 모드)
echo "▶️ Starting PM2 processes (Preview mode)..."
pm2 start ecosystem.preview.js

# 7. PM2 저장
echo "💾 Saving PM2 configuration..."
pm2 save

# 8. 상태 확인
echo "📊 PM2 Status:"
pm2 status

echo "✅ Preview mode deployment completed successfully!"
echo "🌐 Frontend: http://localhost:4173 (Vite Preview)"
echo "🔧 API: http://localhost:3001"
echo "📝 Logs: pm2 logs"
echo "⚠️ Note: Using Vite preview mode (may have URI encoding issues)"