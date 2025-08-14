// 원시 데이터 확인
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkRawData() {
  try {
    console.log('🔍 원시 데이터 확인...')
    
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
      console.log(`   auto_translated: ${word.auto_translated}`)
      console.log(`   translations 타입: ${typeof word.translations}`)
      console.log(`   translations 원본:`, word.translations)
      
      if (typeof word.translations === 'string') {
        console.log(`   첫 10자: "${word.translations.substring(0, 10)}..."`)
        try {
          const parsed = JSON.parse(word.translations)
          console.log(`   JSON 파싱 성공:`, typeof parsed)
          console.log(`   언어 개수: ${Object.keys(parsed).length}`)
          console.log(`   언어 코드들:`, Object.keys(parsed))
          
          // 각 언어별 데이터 확인
          Object.entries(parsed).forEach(([lang, data]) => {
            console.log(`     ${lang}: ${typeof data === 'object' ? data.name : data}`)
          })
        } catch (e) {
          console.log(`   JSON 파싱 실패:`, e.message)
        }
      }
    } else {
      console.log('❌ 다국어 단어를 찾을 수 없습니다')
    }
    
  } catch (err) {
    console.error('💥 오류:', err)
  }
}

checkRawData().then(() => {
  process.exit(0)
})