import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkAppleWord() {
  console.log('🍎 "사과" 단어 확인 중...\n');

  try {
    // "사과" 단어 확인
    const { data: appleWord, error } = await supabase
      .from('words')
      .select('*')
      .eq('name', '사과')
      .single();

    if (error) {
      console.log('❌ "사과" 단어를 찾을 수 없습니다:', error.message);
      return;
    }

    console.log('✅ "사과" 단어 발견!');
    console.log('translations 타입:', typeof appleWord.translations);
    console.log('translations 값:', appleWord.translations);
    console.log('auto_translated:', appleWord.auto_translated);

    if (appleWord.translations) {
      console.log('\n🔧 translations 파싱:');
      const languages = Object.keys(appleWord.translations);
      console.log('언어 개수:', languages.length);
      console.log('언어들:', languages);
    }

    // 모든 단어 확인 (정렬 기준 확인)
    console.log('\n📋 모든 단어 목록:');
    const { data: allWords } = await supabase
      .from('words')
      .select('name, translations, auto_translated')
      .order('created_at', { ascending: false });

    allWords?.forEach((word, index) => {
      const hasTranslations = word.translations && typeof word.translations === 'object';
      const langCount = hasTranslations ? Object.keys(word.translations).length : 0;
      console.log(`${index + 1}. ${word.name} - ${langCount}개 언어${word.auto_translated ? ' (자동번역됨)' : ''}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkAppleWord();