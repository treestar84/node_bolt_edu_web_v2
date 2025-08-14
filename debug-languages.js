// 다국어 언어 감지 디버깅
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLanguages() {
  try {
    console.log('🔍 다국어 데이터 디버깅 시작...')
    
    // 모든 단어 데이터 확인
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
          let translations
          if (typeof word.translations === 'string') {
            translations = JSON.parse(word.translations)
            console.log(`   JSON 파싱됨:`, translations)
          } else {
            translations = word.translations
            console.log(`   객체 형태:`, translations)
          }
          
          // 사용 가능한 언어 코드 추가
          Object.keys(translations).forEach(lang => {
            foundLanguages.add(lang)
            console.log(`   ✅ 언어 발견: ${lang} = "${translations[lang]}"`)
          })
          
        } catch (parseError) {
          console.log(`   ❌ JSON 파싱 실패:`, parseError.message)
          console.log(`   원본 데이터:`, word.translations)
        }
      } else {
        if (index < 5) { // 처음 5개만 로그
          console.log(`⚪ 단어 "${word.name}": 다국어 데이터 없음`)
        }
      }
    })
    
    console.log(`\n📈 결과 요약:`)
    console.log(`   다국어 단어: ${multilingualWordsCount}개`)
    console.log(`   발견된 언어: ${Array.from(foundLanguages).join(', ')}`)
    console.log(`   총 언어 개수: ${foundLanguages.size}개`)
    
    if (multilingualWordsCount === 0) {
      console.log('\n⚠️ 다국어 단어가 하나도 없습니다!')
      console.log('   1. 관리자 페이지에서 다국어 자동 번역 모드로 단어를 등록해보세요')
      console.log('   2. 등록 시 번역이 성공했는지 콘솔 로그를 확인하세요')
    } else if (foundLanguages.size === 2) {
      console.log('\n⚠️ 다국어 데이터는 있지만 한국어/영어만 감지됩니다')
      console.log('   번역 데이터 저장 과정에 문제가 있을 수 있습니다')
    } else {
      console.log('\n✅ 다국어 데이터가 올바르게 저장되어 있습니다')
      console.log('   useAvailableLanguages.ts의 로직을 확인해보세요')
    }
    
  } catch (err) {
    console.error('💥 디버깅 중 오류:', err)
  }
}

debugLanguages().then(() => {
  process.exit(0)
})