import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    // HMR 오버레이 설정
    hmr: {
      overlay: true,
      clientPort: 5173
    },
    // 정적 파일 처리 개선
    middlewareMode: false,
    // 에러 처리 강화
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/server': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          // URL 디코딩 안전성 검증
          try {
            const decoded = decodeURI(path);
            return decoded.replace(/^\/server/, '');
          } catch (error) {
            console.error('URL 디코딩 실패:', path, error);
            return path.replace(/^\/server/, '');
          }
        }
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
    allowedHosts: ['duck-edu-word.duckdns.org']
  },
  build: {
    // PWA 최적화를 위한 빌드 설정
    rollupOptions: {
      output: {
        // 청크 분할로 로딩 성능 개선
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          supabase: ['@supabase/supabase-js'],
          i18n: ['vue-i18n']
        }
      }
    },
    // 압축 및 최적화
    minify: 'esbuild' // 기본 esbuild minify 사용
  },
  // PWA 관련 설정
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  }
})