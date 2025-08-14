// 브라우저 번역 테스트 스크립트
// Node.js 환경에서 실행하여 사전 번역 기능 테스트

// 사전 데이터 (browserTranslation.ts에서 복사)
const basicDictionary = {
  // 동물
  'cat': { ko: '고양이', en: 'cat', ja: '猫', zh: '猫', es: 'gato', fr: 'chat', de: 'Katze', ar: 'قطة', hi: 'बिल्ली', pt: 'gato' },
  'dog': { ko: '개', en: 'dog', ja: '犬', zh: '狗', es: 'perro', fr: 'chien', de: 'Hund', ar: 'كلب', hi: 'कुत्ता', pt: 'cão' },
  
  // 과일
  'apple': { ko: '사과', en: 'apple', ja: 'りんご', zh: '苹果', es: 'manzana', fr: 'pomme', de: 'Apfel', ar: 'تفاحة', hi: 'सेब', pt: 'maçã' },
  
  // 기본 인사
  'hello': { ko: '안녕하세요', en: 'hello', ja: 'こんにちは', zh: '你好', es: 'hola', fr: 'bonjour', de: 'hallo', ar: 'مرحبا', hi: 'नमस्ते', pt: 'olá' },
  
  // 차량/기계
  'bulldozer': { ko: '불도저', en: 'bulldozer', ja: 'ブルドーザー', zh: '推土机', es: 'bulldozer', fr: 'bulldozer', de: 'Bulldozer', ar: 'جرافة', hi: 'बुलडोज़र', pt: 'bulldozer' },
  'car': { ko: '자동차', en: 'car', ja: '車', zh: '汽车', es: 'coche', fr: 'voiture', de: 'Auto', ar: 'سيارة', hi: 'कार', pt: 'carro' },
  
  // 자연/식물 (나무 추가!)
  'tree': { ko: '나무', en: 'tree', ja: '木', zh: '树', es: 'árbol', fr: 'arbre', de: 'Baum', ar: 'شجرة', hi: 'पेड़', pt: 'árvore' },
  'flower': { ko: '꽃', en: 'flower', ja: '花', zh: '花', es: 'flor', fr: 'fleur', de: 'Blume', ar: 'زهرة', hi: 'फूल', pt: 'flor' },
  
  // 더 많은 일반 단어들
  'water': { ko: '물', en: 'water', ja: '水', zh: '水', es: 'agua', fr: 'eau', de: 'Wasser', ar: 'ماء', hi: 'पानी', pt: 'água' },
  'fire': { ko: '불', en: 'fire', ja: '火', zh: '火', es: 'fuego', fr: 'feu', de: 'Feuer', ar: 'نار', hi: 'आग', pt: 'fogo' },
  'house': { ko: '집', en: 'house', ja: '家', zh: '房子', es: 'casa', fr: 'maison', de: 'Haus', ar: 'بيت', hi: 'घر', pt: 'casa' },
  'book': { ko: '책', en: 'book', ja: '本', zh: '书', es: 'libro', fr: 'livre', de: 'Buch', ar: 'كتاب', hi: 'किताب', pt: 'livro' }
};

// 지원 언어 목록
const supportedLanguages = ['ko', 'zh', 'ja', 'es', 'fr', 'de', 'ar', 'hi', 'pt'];

// 번역 테스트 함수
function testTranslation(englishWord, targetLang) {
  const normalizedText = englishWord.toLowerCase().trim();
  const dictionary = basicDictionary[normalizedText];
  
  if (dictionary && dictionary[targetLang]) {
    return dictionary[targetLang];
  }
  return null;
}

// 전체 테스트 실행
function runTests() {
  console.log('🚀 브라우저 사전 번역 테스트 시작\n');
  
  const testWords = ['tree', 'cat', 'apple', 'car', 'water', 'book'];
  
  testWords.forEach(word => {
    console.log(`📝 "${word}" 번역 테스트:`);
    
    supportedLanguages.forEach(lang => {
      const result = testTranslation(word, lang);
      const status = result ? '✅' : '❌';
      console.log(`  ${status} ${lang}: ${result || 'N/A'}`);
    });
    
    console.log('');
  });
  
  // 통계
  let totalTests = 0;
  let successfulTests = 0;
  
  testWords.forEach(word => {
    supportedLanguages.forEach(lang => {
      totalTests++;
      if (testTranslation(word, lang)) {
        successfulTests++;
      }
    });
  });
  
  console.log('📊 테스트 결과:');
  console.log(`총 테스트: ${totalTests}개`);
  console.log(`성공: ${successfulTests}개 (${Math.round(successfulTests/totalTests*100)}%)`);
  console.log(`실패: ${totalTests - successfulTests}개`);
  
  // 사전에 없는 단어 테스트
  console.log('\n❌ 사전에 없는 단어 테스트:');
  const missingWords = ['computer', 'phone', 'school', 'teacher'];
  missingWords.forEach(word => {
    const zhResult = testTranslation(word, 'zh');
    console.log(`"${word}" → 중국어: ${zhResult || '번역 불가능'}`);
  });
}

// 테스트 실행
runTests();