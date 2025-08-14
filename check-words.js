// 현재 단어들 확인하는 스크립트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lqrtovlzyzrgnaqhjnoo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcnRvdmx6eXpyZ25hcWhqbm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3NjQxMjYsImV4cCI6MjA0NTM0MDEyNn0.PyfNcWCyRJVKczWNOGb2x_5DFDnfB5vJt5-ZlZHxN8k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWords() {
  console.log('📋 현재 단어들 확인 중...');

  try {
    const { data, error } = await supabase
      .from('words')
      .select('id, name, name_en, category, translations')
      .limit(10);

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    console.log(`✅ 총 ${data.length}개 단어 발견:`);
    data.forEach((word, index) => {
      console.log(`\n${index + 1}. ID: ${word.id}`);
      console.log(`   한국어: ${word.name}`);
      console.log(`   영어: ${word.name_en}`);
      console.log(`   카테고리: ${word.category}`);
      console.log(`   번역 데이터: ${word.translations ? '있음' : '없음'}`);
      
      if (word.translations) {
        try {
          const translations = JSON.parse(word.translations);
          console.log(`   번역 언어들: ${Object.keys(translations).join(', ')}`);
        } catch (e) {
          console.log('   번역 파싱 실패');
        }
      }
    });

  } catch (err) {
    console.error('❌ 처리 실패:', err);
  }
}

checkWords();