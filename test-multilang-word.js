import { createClient } from '@supabase/supabase-js';

// Supabase 설정
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://lqrtovlzyzrgnaqhjnoo.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxcnRvdmx6eXpyZ25hcWhqbm9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk3NjQxMjYsImV4cCI6MjA0NTM0MDEyNn0.PyfNcWCyRJVKczWNOGb2x_5DFDnfB5vJt5-ZlZHxN8k';

const supabase = createClient(supabaseUrl, supabaseKey);

// 10개 언어로 번역된 "나비" 단어 데이터
const butterflyTranslations = {
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

async function addMultiLangWord() {
  try {
    console.log('🦋 다국어 나비 단어 추가 시작...');
    
    // 단어 데이터 준비
    const wordData = {
      korean_word: butterflyTranslations.ko,
      english_word: butterflyTranslations.en,
      chinese_word: butterflyTranslations.zh,
      japanese_word: butterflyTranslations.ja,
      spanish_word: butterflyTranslations.es,
      french_word: butterflyTranslations.fr,
      german_word: butterflyTranslations.de,
      arabic_word: butterflyTranslations.ar,
      hindi_word: butterflyTranslations.hi,
      portuguese_word: butterflyTranslations.pt,
      category: 'animals',
      image_url: '/uploads/butterfly_placeholder.jpg',
      audio_url: '/uploads/butterfly_audio.mp3',
      created_by: 'system',
      is_approved: true
    };

    // DB에 단어 추가
    const { data, error } = await supabase
      .from('words')
      .insert([wordData])
      .select();

    if (error) {
      console.error('❌ 단어 추가 실패:', error);
      return;
    }

    console.log('✅ 다국어 나비 단어 추가 완료!');
    console.log('추가된 단어 데이터:', data[0]);
    
    // 각 언어별 번역 확인
    console.log('\n🌐 언어별 번역 확인:');
    Object.entries(butterflyTranslations).forEach(([lang, word]) => {
      console.log(`  ${lang}: ${word}`);
    });

    return data[0];
  } catch (err) {
    console.error('❌ 처리 중 오류 발생:', err);
  }
}

// 실행
addMultiLangWord();