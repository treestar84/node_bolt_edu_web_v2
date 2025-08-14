// 다국어 데이터 디버깅 (수정버전)
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLanguagesFixed() {
  try {
    console.log('🔍 다국어 데이터 디버깅 시작...')
    
    const { data: words, error } = await supabase
      .from('words')
      .select('id, name, name_en, translations, auto_translated')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('❌ 데이터베이스 오류:', error)
      return
    }
    
    console.log(`📊 총 ${words.length}개 단어 발견`)
    
    let multilingualWordsCount = 0
    const foundLanguages = new Set(['ko', 'en']) // 기본 언어
    
    words.forEach((word, index) => {
      if (word.translations) {
        multilingualWordsCount++
        console.log(`\n🌐 다국어 단어 ${index + 1}: "${word.name}" (${word.name_en})`)
        console.log(`   auto_translated: ${word.auto_translated}`)
        console.log(`   translations 타입: ${typeof word.translations}`)
        
        try {
          let translations = word.translations
          
          // 이미 객체인 경우 그대로 사용, 문자열인 경우에만 파싱
          if (typeof translations === 'string') {
            console.log(`   문자열 데이터를 파싱 중...`)
            translations = JSON.parse(translations)
          }
          
          if (translations && typeof translations === 'object') {
            const langKeys = Object.keys(translations)
            console.log(`   발견된 언어 코드: ${langKeys.join(', ')}`)
            
            langKeys.forEach(langCode => {
              foundLanguages.add(langCode)
              const langData = translations[langCode]
              console.log(`   ✅ ${langCode}: "${langData?.name || langData}"`)
            })
          } else {
            console.log(`   ⚠️ translations가 올바른 객체가 아님:`, typeof translations)
          }
          
        } catch (parseError) {
          console.log(`   ❌ JSON 파싱 실패:`, parseError.message)
        }
      } else if (index < 5) {
        console.log(`⚪ 단어 "${word.name}": 다국어 데이터 없음`)
      }
    })
    
    console.log(`\n📈 결과 요약:`)
    console.log(`   다국어 단어: ${multilingualWordsCount}개`)
    console.log(`   발견된 언어: ${Array.from(foundLanguages).join(', ')}`)
    console.log(`   총 언어 개수: ${foundLanguages.size}개`)
    
    if (multilingualWordsCount === 0) {
      console.log('\n⚠️ 다국어 단어가 하나도 없습니다!')
    } else if (foundLanguages.size === 2) {
      console.log('\n⚠️ 다국어 데이터는 있지만 한국어/영어만 감지됩니다')
    } else {
      console.log('\n✅ 다국어 데이터가 올바르게 저장되어 있습니다')
    }
    
  } catch (err) {
    console.error('💥 디버깅 중 오류:', err)
  }
}

debugLanguagesFixed().then(() => {
  process.exit(0)
})