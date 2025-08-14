// 임시 데이터베이스 마이그레이션 테스트 스크립트
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testDatabaseSchema() {
  console.log('📊 데이터베이스 스키마 테스트 중...')
  
  try {
    // 기존 단어 하나 가져와서 스키마 확인
    const { data: words, error } = await supabase
      .from('words')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ 데이터베이스 연결 오류:', error)
      return
    }
    
    if (words && words.length > 0) {
      console.log('📋 현재 words 테이블 스키마:')
      console.log(Object.keys(words[0]))
      
      // translations, auto_translated 컬럼이 있는지 확인
      const hasTranslations = 'translations' in words[0]
      const hasAutoTranslated = 'auto_translated' in words[0]
      
      console.log(`🌐 translations 컬럼: ${hasTranslations ? '✅ 존재' : '❌ 없음'}`)
      console.log(`🤖 auto_translated 컬럼: ${hasAutoTranslated ? '✅ 존재' : '❌ 없음'}`)
      
      if (!hasTranslations || !hasAutoTranslated) {
        console.log('⚠️ 다국어 지원을 위한 컬럼이 누락되었습니다.')
        console.log('Supabase 대시보드에서 다음 SQL을 실행하세요:')
        console.log(`
ALTER TABLE words 
ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT NULL;

ALTER TABLE words 
ADD COLUMN IF NOT EXISTS auto_translated BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_words_translations ON words USING GIN(translations);
CREATE INDEX IF NOT EXISTS idx_words_auto_translated ON words(auto_translated);
        `)
      }
    } else {
      console.log('⚪ words 테이블에 데이터가 없습니다.')
    }
    
  } catch (err) {
    console.error('💥 테스트 중 오류 발생:', err)
  }
}

testDatabaseSchema()