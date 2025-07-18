#!/bin/bash

# 개발 환경에서 HTTPS로 서버 실행하는 스크립트

echo "🔒 HTTPS 개발 서버 시작 중..."
echo "⚠️  자체 서명 인증서 경고는 무시하고 '고급' → '계속' 클릭하세요"
echo ""

# mkcert가 설치되어 있는지 확인
if command -v mkcert &> /dev/null; then
    echo "✅ mkcert 발견. 로컬 인증서 생성 중..."
    
    # .cert 폴더 생성
    mkdir -p .cert
    
    # 로컬 인증서 생성
    mkcert -key-file .cert/key.pem -cert-file .cert/cert.pem localhost 127.0.0.1
    
    echo "✅ 로컬 인증서 생성 완료"
    echo "🚀 HTTPS 개발 서버 시작..."
    
    # HTTPS 개발 서버 실행
    vite --host --https --https-key .cert/key.pem --https-cert .cert/cert.pem
else
    echo "⚠️  mkcert가 설치되지 않음. 자체 서명 인증서로 실행..."
    echo "💡 더 나은 경험을 위해 mkcert 설치 권장: https://github.com/FiloSottile/mkcert"
    echo ""
    
    # 자체 서명 인증서로 실행
    vite --host --https
fi