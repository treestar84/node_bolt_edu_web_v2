// 브라우저 콘솔에서 실행할 다국어 테스트 코드
// 개발자 도구 콘솔에서 이 코드를 복사하여 붙여넣기하세요

console.log('🌐 다국어 TTS 테스트 시작');

// 나무 단어의 다국어 번역
const treeTranslations = {
  ko: "나무",
  en: "tree",
  zh: "树",
  ja: "木",
  es: "árbol", 
  fr: "arbre",
  de: "Baum",
  ar: "شجرة",
  hi: "पेड़",
  pt: "árvore"
};

// 언어별 TTS 설정
const languageMap = {
  ko: 'ko-KR',
  en: 'en-US', 
  zh: 'zh-CN',
  ja: 'ja-JP',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  ar: 'ar-SA',
  hi: 'hi-IN',
  pt: 'pt-BR'
};

// TTS 테스트 함수
function testTTS(language, text) {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('TTS not supported'));
      return;
    }

    speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageMap[language] || 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1.0;

    // 해당 언어에 맞는 음성 찾기
    const voices = speechSynthesis.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(language) || 
      voice.lang.startsWith(utterance.lang)
    );

    if (preferredVoice) {
      utterance.voice = preferredVoice;
      console.log(`🎤 사용 음성: ${preferredVoice.name} (${preferredVoice.lang})`);
    }

    utterance.onstart = () => {
      console.log(`🔊 재생 중: ${language} - "${text}"`);
    };

    utterance.onend = () => {
      console.log(`✅ 재생 완료: ${language}`);
      resolve();
    };

    utterance.onerror = (event) => {
      console.error(`❌ 재생 실패: ${language} - ${event.error}`);
      reject(new Error(`TTS error: ${event.error}`));
    };

    speechSynthesis.speak(utterance);
  });
}

// 개별 언어 테스트 함수
window.testLanguage = function(lang) {
  const text = treeTranslations[lang];
  if (text) {
    console.log(`\n🌐 ${lang.toUpperCase()} 테스트: "${text}"`);
    testTTS(lang, text);
  } else {
    console.error(`❌ ${lang} 번역이 없습니다`);
  }
};

// 모든 언어 순차 테스트 함수
window.testAllLanguages = async function() {
  console.log('\n🚀 모든 언어 순차 테스트 시작');
  
  for (const [lang, text] of Object.entries(treeTranslations)) {
    try {
      console.log(`\n--- ${lang.toUpperCase()} ---`);
      await testTTS(lang, text);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 간격
    } catch (error) {
      console.error(`❌ ${lang} 테스트 실패:`, error);
    }
  }
  
  console.log('\n🎉 모든 언어 테스트 완료!');
};

// 사용 가능한 음성 목록 표시
function showAvailableVoices() {
  const voices = speechSynthesis.getVoices();
  console.log('\n🎤 사용 가능한 TTS 음성들:');
  voices.forEach((voice, index) => {
    console.log(`${index + 1}. ${voice.name} (${voice.lang}) ${voice.default ? '- Default' : ''}`);
  });
}

// 음성 목록 로드 대기
if (speechSynthesis.getVoices().length === 0) {
  speechSynthesis.onvoiceschanged = () => {
    showAvailableVoices();
    console.log('\n🎯 사용법:');
    console.log('- testLanguage("ko")  // 한국어 테스트');
    console.log('- testLanguage("zh")  // 중국어 테스트'); 
    console.log('- testLanguage("de")  // 독일어 테스트');
    console.log('- testAllLanguages()  // 모든 언어 순차 테스트');
  };
} else {
  showAvailableVoices();
  console.log('\n🎯 사용법:');
  console.log('- testLanguage("ko")  // 한국어 테스트');
  console.log('- testLanguage("zh")  // 중국어 테스트');
  console.log('- testLanguage("de")  // 독일어 테스트');  
  console.log('- testAllLanguages()  // 모든 언어 순차 테스트');
}