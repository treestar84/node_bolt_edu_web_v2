import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function addTestMultilingualWord() {
  console.log('🌍 다국어 테스트 단어 추가 중...\n');

  // 10개 언어로 번역된 "사과" 단어
  const multilingualTranslations = {
    ko: { name: "사과", pronunciation: "sa-gwa" },
    en: { name: "apple", pronunciation: "ap-ple" },
    zh: { name: "苹果", pronunciation: "píng-guǒ" },
    ja: { name: "りんご", pronunciation: "ringo" },
    es: { name: "manzana", pronunciation: "man-sa-na" },
    fr: { name: "pomme", pronunciation: "pom" },
    de: { name: "Apfel", pronunciation: "ap-fel" },
    ar: { name: "تفاحة", pronunciation: "tuf-fa-ha" },
    hi: { name: "सेब", pronunciation: "seb" },
    pt: { name: "maçã", pronunciation: "ma-sã" }
  };

  try {
    // 기존에 "사과" 단어가 있는지 확인
    const { data: existing } = await supabase
      .from('words')
      .select('*')
      .eq('name', '사과')
      .single();

    if (existing) {
      console.log('📝 기존 "사과" 단어 업데이트 중...');
      const { data, error } = await supabase
        .from('words')
        .update({
          translations: JSON.stringify(multilingualTranslations),
          auto_translated: true
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ "사과" 단어 다국어 번역 업데이트 완료!');
    } else {
      console.log('📝 새로운 "사과" 단어 추가 중...');
      const { data, error } = await supabase
        .from('words')
        .insert({
          name: '사과',
          imageUrl: '/uploads/default-apple.jpg',
          audioUrl: '/uploads/default-apple.mp3',
          category: '과일',
          description: '빨간 과일',
          minAge: 3,
          maxAge: 6,
          difficulty: 1,
          translations: JSON.stringify(multilingualTranslations),
          auto_translated: true
        })
        .select()
        .single();

      if (error) throw error;
      console.log('✅ "사과" 단어 다국어 번역 추가 완료!');
    }

    // 결과 확인
    console.log('\n📊 추가된 번역 언어들:');
    Object.entries(multilingualTranslations).forEach(([lang, data]) => {
      console.log(`  ${lang}: "${data.name}" (${data.pronunciation})`);
    });

    console.log('\n🎯 이제 네비게이션에서 10개 언어가 모두 표시되어야 합니다!');
    console.log('브라우저를 새로고침하고 언어 선택 드롭다운을 확인해보세요.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

addTestMultilingualWord();