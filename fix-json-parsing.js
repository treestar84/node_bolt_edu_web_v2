// JSON 파싱 문제 해결 테스트
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixJsonParsing() {
  try {
    console.log('🔧 JSON 파싱 문제 해결 테스트...')
    
    const { data: words, error } = await supabase
      .from('words')
      .select('id, name, name_en, translations, auto_translated')
      .eq('auto_translated', true)
      .limit(1)
    
    if (error) {
      console.error('❌ 오류:', error)
      return
    }
    
    if (words && words.length > 0) {
      const word = words[0]
      console.log(`\n📋 단어: "${word.name}" (${word.name_en})`)
      
      let translations = word.translations
      console.log(`원본 타입: ${typeof translations}`)
      
      // 첫 번째 파싱 시도
      if (typeof translations === 'string') {
        console.log('1차 JSON 파싱 중...')
        translations = JSON.parse(translations)
        console.log(`1차 파싱 후 타입: ${typeof translations}`)
      }
      
      // 두 번째 파싱 시도 (이중 인코딩된 경우)
      if (typeof translations === 'string') {
        console.log('2차 JSON 파싱 중...')
        translations = JSON.parse(translations)
        console.log(`2차 파싱 후 타입: ${typeof translations}`)
      }
      
      if (translations && typeof translations === 'object') {
        const langCodes = Object.keys(translations)
        console.log(`\n✅ 최종 파싱 성공!`)
        console.log(`   언어 개수: ${langCodes.length}`)
        console.log(`   언어 코드들: ${langCodes.join(', ')}`)
        
        // 각 언어 데이터 확인
        langCodes.forEach(lang => {
          const langData = translations[lang]
          const name = typeof langData === 'object' ? langData.name : langData
          console.log(`   ${lang}: "${name}"`)
        })
      } else {
        console.log('❌ 파싱 후에도 객체가 아님:', typeof translations)
      }
    }
    
  } catch (err) {
    console.error('💥 오류:', err)
  }
}

fixJsonParsing().then(() => {
  process.exit(0)
})