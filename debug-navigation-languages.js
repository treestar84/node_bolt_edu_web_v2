import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function debugNavigationLanguages() {
  console.log('🔍 네비게이션 언어 표시 문제 디버깅...\n');

  try {
    // 1. 단어 데이터 확인
    const { data: words, error } = await supabase
      .from('words')
      .select('*')
      .limit(5);

    if (error) throw error;

    console.log('📊 데이터베이스 단어 수:', words.length);
    
    if (words.length === 0) {
      console.log('❌ 단어가 없습니다. 먼저 다국어 단어를 추가해주세요.');
      return;
    }

    // 2. 첫 번째 단어의 구조 확인
    const firstWord = words[0];
    console.log('\n📋 첫 번째 단어 구조:');
    console.log('name:', firstWord.name);
    console.log('translations 타입:', typeof firstWord.translations);
    console.log('translations 값:', firstWord.translations);

    // 3. translations 파싱 테스트
    if (firstWord.translations) {
      try {
        let translations = firstWord.translations;
        console.log('\n🔧 translations 파싱 테스트:');
        console.log('원본 타입:', typeof translations);
        
        // 이중 JSON 파싱
        if (typeof translations === 'string') {
          console.log('1차 파싱 중...');
          translations = JSON.parse(translations);
          console.log('1차 파싱 후 타입:', typeof translations);
          
          if (typeof translations === 'string') {
            console.log('2차 파싱 중...');
            translations = JSON.parse(translations);
            console.log('2차 파싱 후 타입:', typeof translations);
          }
        }

        if (typeof translations === 'object' && translations) {
          const languages = Object.keys(translations);
          console.log('\n✅ 감지된 언어들:', languages);
          console.log('언어별 단어:');
          languages.forEach(lang => {
            const wordData = translations[lang];
            const wordText = typeof wordData === 'object' ? wordData.name : wordData;
            console.log(`  ${lang}: "${wordText}"`);
          });
        }
      } catch (parseError) {
        console.error('❌ translations 파싱 실패:', parseError);
      }
    }

    // 4. 모든 단어의 언어 통계
    console.log('\n📈 전체 단어 언어 통계:');
    const languageCount = {};
    
    words.forEach(word => {
      if (word.translations) {
        try {
          let translations = word.translations;
          if (typeof translations === 'string') {
            translations = JSON.parse(translations);
            if (typeof translations === 'string') {
              translations = JSON.parse(translations);
            }
          }
          
          if (typeof translations === 'object' && translations) {
            Object.keys(translations).forEach(lang => {
              languageCount[lang] = (languageCount[lang] || 0) + 1;
            });
          }
        } catch (error) {
          // 파싱 실패 시 무시
        }
      }
    });

    console.log('언어별 단어 수:');
    Object.entries(languageCount).forEach(([lang, count]) => {
      const percentage = Math.round((count / words.length) * 100);
      console.log(`  ${lang}: ${count}개 (${percentage}%)`);
    });

    // 5. useAvailableLanguages 로직 시뮬레이션
    console.log('\n🧪 useAvailableLanguages 로직 시뮬레이션:');
    const availableLanguages = new Set(['ko', 'en']); // 기본 언어
    
    words.forEach(word => {
      if (word.translations) {
        try {
          let translations = word.translations;
          if (typeof translations === 'string') {
            translations = JSON.parse(translations);
            if (typeof translations === 'string') {
              translations = JSON.parse(translations);
            }
          }
          
          if (typeof translations === 'object' && translations) {
            Object.keys(translations).forEach(langCode => {
              // ALL_LANGUAGE_CODES에 포함된 언어만 추가
              const supportedLangs = ['ko', 'en', 'zh', 'ja', 'es', 'fr', 'de', 'ar', 'hi', 'pt'];
              if (supportedLangs.includes(langCode)) {
                availableLanguages.add(langCode);
              }
            });
          }
        } catch (error) {
          // 파싱 실패 시 무시
        }
      }
    });

    console.log('사용 가능한 언어들:', Array.from(availableLanguages).sort());
    
    // 6. 준비된 언어 확인 (10% 이상)
    const readyLanguages = [];
    Array.from(availableLanguages).forEach(lang => {
      if (lang === 'ko' || lang === 'en') {
        readyLanguages.push(lang);
      } else {
        const count = languageCount[lang] || 0;
        const completeness = Math.round((count / words.length) * 100);
        if (completeness >= 10) {
          readyLanguages.push(lang);
          console.log(`✅ ${lang}: ${completeness}% (준비됨)`);
        } else {
          console.log(`❌ ${lang}: ${completeness}% (준비 안됨)`);
        }
      }
    });

    console.log('\n🎯 최종 준비된 언어들:', readyLanguages);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

debugNavigationLanguages();