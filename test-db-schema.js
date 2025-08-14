// 데이터베이스 스키마 테스트
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSchema() {
  try {
    console.log('📊 데이터베이스 스키마 테스트 중...')
    
    // 기존 단어 데이터 확인
    const { data: words, error } = await supabase
      .from('words')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 데이터베이스 연결 오류:', error)
      return
    }
    
    if (words && words.length > 0) {
      console.log('📋 현재 words 테이블 구조:')
      console.log(Object.keys(words[0]))
      
      const hasTranslations = 'translations' in words[0]
      const hasAutoTranslated = 'auto_translated' in words[0]
      
      console.log(`🌐 translations 컬럼: ${hasTranslations ? '✅ 존재' : '❌ 없음'}`)
      console.log(`🤖 auto_translated 컬럼: ${hasAutoTranslated ? '✅ 존재' : '❌ 없음'}`)
      
      if (!hasTranslations || !hasAutoTranslated) {
        console.log('\n⚠️ 다국어 지원을 위한 컬럼이 누락되었습니다.')
        console.log('Supabase 대시보드의 SQL Editor에서 다음 쿼리를 실행하세요:\n')
        console.log('ALTER TABLE words ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;')
        console.log('ALTER TABLE words ADD COLUMN IF NOT EXISTS auto_translated BOOLEAN DEFAULT false;')
        console.log('CREATE INDEX IF NOT EXISTS idx_words_translations ON words USING GIN(translations);')
        console.log('CREATE INDEX IF NOT EXISTS idx_words_auto_translated ON words(auto_translated);')
      } else {
        console.log('✅ 다국어 지원 컬럼이 모두 존재합니다!')
      }
    } else {
      console.log('⚪ words 테이블에 데이터가 없습니다.')
    }
    
  } catch (err) {
    console.error('💥 테스트 중 오류 발생:', err)
  }
}

testSchema().then(() => {
  process.exit(0)
})