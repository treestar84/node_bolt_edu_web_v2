// 나비 단어를 다국어로 추가하는 스크립트
import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = 'https://lqrtovlzyzrgnaqhjnoo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcnRvdmx6eXpyZ25hcWhqbm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3NjQxMjYsImV4cCI6MjA0NTM0MDEyNn0.PyfNcWCyRJVKczWNOGb2x_5DFDnfB5vJt5-ZlZHxN8k';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addButterflyWord() {
  console.log('🦋 나비 단어 추가 시작...');

  // 다국어 번역 데이터
  const translations = {
    ko: "나비",
    en: "butterfly",
    zh: "蝴蝶", 
    ja: "蝶",
    es: "mariposa",
    fr: "papillon",
    de: "Schmetterling",
    ar: "فراشة",
    hi: "तितली",
    pt: "borboleta"
  };

  try {
    const { data, error } = await supabase
      .from('words')
      .insert({
        name: translations.ko,
        name_en: translations.en,
        category: 'animals',
        image_url: '/uploads/placeholder.jpg',
        audio_ko: '/uploads/placeholder.mp3',
        audio_en: '/uploads/placeholder.mp3',
        min_age: 3,
        max_age: 8,
        owner_type: 'global',
        translations: JSON.stringify(translations),
        auto_translated: false
      })
      .select()
      .single();

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    console.log('✅ 나비 단어 추가 완료!');
    console.log('추가된 데이터:', data);
    
    console.log('\n🌐 번역 확인:');
    Object.entries(translations).forEach(([lang, word]) => {
      console.log(`  ${lang}: ${word}`);
    });

  } catch (err) {
    console.error('❌ 처리 실패:', err);
  }
}

addButterflyWord();