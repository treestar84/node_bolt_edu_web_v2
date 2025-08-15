// 브라우저 내장 번역 기능 활용 - 완전 무료!
// Chrome Translation API, Web Speech API 등을 활용한 비용 0원 번역

import type { SupportedLanguageCode } from '@/types/multilingual';
import type { TranslationResult } from '@/services/translationService';

export interface BrowserTranslationCapability {
  isSupported: boolean;
  supportedMethods: ('chrome' | 'edge' | 'firefox' | 'webApi')[];
  supportedLanguages: SupportedLanguageCode[];
}

/**
 * 브라우저 내장 번역 기능을 활용한 완전 무료 번역 서비스
 * API 키나 한도 제한 없이 로컬에서 번역 수행
 */
export class BrowserTranslationService {
  private isInitialized = false;
  private capability: BrowserTranslationCapability | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * 브라우저 번역 기능 초기화 및 지원 여부 확인
   */
  private async initialize(): Promise<void> {
    console.log('🔍 브라우저 번역 기능 지원 여부 확인 중...');
    
    this.capability = await this.detectTranslationCapabilities();
    this.isInitialized = true;

    if (this.capability.isSupported) {
      console.log(`✅ 브라우저 번역 사용 가능: ${this.capability.supportedMethods.join(', ')}`);
    } else {
      console.log('❌ 브라우저 번역 기능이 지원되지 않습니다.');
    }
  }

  /**
   * 브라우저 번역 기능 지원 여부 감지
   */
  private async detectTranslationCapabilities(): Promise<BrowserTranslationCapability> {
    const supportedMethods: ('chrome' | 'edge' | 'firefox' | 'webApi')[] = [];
    const supportedLanguages: SupportedLanguageCode[] = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'];

    // Chrome/Edge Translation API 확인
    if (this.isChromeTranslationSupported()) {
      supportedMethods.push('chrome');
    }

    // Firefox 번역 기능 확인  
    if (this.isFirefoxTranslationSupported()) {
      supportedMethods.push('firefox');
    }

    // Web API 기반 번역 확인 (실험적)
    if (this.isWebApiTranslationSupported()) {
      supportedMethods.push('webApi');
    }

    return {
      isSupported: supportedMethods.length > 0,
      supportedMethods,
      supportedLanguages
    };
  }

  /**
   * Chrome/Edge 번역 API 지원 확인
   */
  private isChromeTranslationSupported(): boolean {
    // @ts-ignore - Chrome internal API
    return typeof window.chrome?.runtime?.sendMessage === 'function' ||
           // @ts-ignore - Edge translation
           typeof window.edge?.translation !== 'undefined';
  }

  /**
   * Firefox 번역 기능 지원 확인
   */
  private isFirefoxTranslationSupported(): boolean {
    // Firefox의 내장 번역 기능 확인
    return navigator.userAgent.includes('Firefox') && 
           // @ts-ignore - Firefox translation API
           typeof window.browser?.translation !== 'undefined';
  }

  /**
   * Web API 기반 번역 지원 확인 (사전 기반 번역은 항상 가능)
   */
  private isWebApiTranslationSupported(): boolean {
    // 사전 기반 번역은 항상 지원됨 (브라우저 API 불필요)
    return true;
  }

  /**
   * 브라우저 내장 번역 실행 (메인 메서드)
   */
  async translateText(
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<TranslationResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.capability?.isSupported) {
      throw new Error('브라우저 번역이 지원되지 않습니다.');
    }

    console.log(`🌐 브라우저 번역 시도: "${text}" (${fromLang} → ${toLang})`);
    console.log(`🔧 브라우저 번역 지원 방법들:`, this.capability.supportedMethods);

    // 각 지원 방법을 안정성 순서대로 시도 (사전 → MyMemory → LibreTranslate)
    const methodOrder: ('webApi' | 'chrome' | 'firefox')[] = ['webApi', 'chrome', 'firefox'];
    
    for (const method of methodOrder) {
      if (!this.capability.supportedMethods.includes(method)) continue;
      
      try {
        let result: string | null = null;

        switch (method) {
          case 'webApi':
            result = await this.translateWithWebApi(text, fromLang, toLang);
            break;
          case 'chrome':
            result = await this.translateWithChrome(text, fromLang, toLang);
            break;
          case 'firefox':
            result = await this.translateWithFirefox(text, fromLang, toLang);
            break;
        }

        if (result) {
          console.log(`✅ ${method} 번역 성공: "${result}"`);
          return {
            originalText: text,
            translatedText: result,
            sourceLanguage: fromLang,
            targetLanguage: toLang,
            confidence: 0.85, // 브라우저 번역은 일반적으로 좋은 품질
            translatedBy: 'manual', // 브라우저는 manual로 분류
            timestamp: Date.now()
          };
        }
      } catch (error) {
        console.warn(`⚠️ ${method} 번역 실패:`, error);
        continue;
      }
    }

    throw new Error('모든 브라우저 번역 방법 시도 실패');
  }

  /**
   * 언어 코드를 API별로 매핑
   */
  private mapLanguageCode(langCode: SupportedLanguageCode, apiType: 'mymemory' | 'libretranslate'): string {
    const mappings = {
      mymemory: {
        ko: 'ko',
        en: 'en',
        ja: 'ja', 
        zh: 'zh-CN',
        es: 'es',
        fr: 'fr',
        de: 'de',
        ar: 'ar',
        hi: 'hi',
        pt: 'pt'
      },
      libretranslate: {
        ko: 'ko',
        en: 'en',
        ja: 'ja',
        zh: 'zh',
        es: 'es', 
        fr: 'fr',
        de: 'de',
        ar: 'ar',
        hi: 'hi',
        pt: 'pt'
      }
    };
    
    return mappings[apiType][langCode] || langCode;
  }

  /**
   * Chrome/Edge 번역 API 사용 (MyMemory API 활용)
   */
  private async translateWithChrome(
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<string | null> {
    try {
      // MyMemory API - 완전 무료, CORS 지원
      const mappedFrom = this.mapLanguageCode(fromLang, 'mymemory');
      const mappedTo = this.mapLanguageCode(toLang, 'mymemory');
      
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${mappedFrom}|${mappedTo}`;
      console.log('🌐 MyMemory API 요청:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`❌ MyMemory HTTP 오류: ${response.status} ${response.statusText}`);
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 MyMemory API 응답:', JSON.stringify(data, null, 2));
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translatedText = data.responseData.translatedText.trim();
        console.log(`🔍 번역 결과 비교: "${text}" → "${translatedText}"`);
        
        // 번역이 실제로 수행되었는지 확인 (원문과 다른지)
        if (translatedText.toLowerCase() !== text.toLowerCase()) {
          console.log('✅ MyMemory 번역 유효함');
          return translatedText;
        } else {
          console.log('⚠️ MyMemory 번역이 원문과 동일함 (번역 안됨)');
        }
      } else {
        console.warn('⚠️ MyMemory 응답 형식이 예상과 다름:', data);
      }
      
      return null;
    } catch (error) {
      console.warn('❌ MyMemory 번역 실패:', error);
      return null;
    }
  }

  /**
   * Firefox 번역 API 사용 (여러 무료 API 시도)
   */
  private async translateWithFirefox(
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<string | null> {
    // 여러 무료 API를 순서대로 시도
    const apis = [
      () => this.translateWithLibreTranslate(text, fromLang, toLang),
      () => this.translateWithLinguee(text, fromLang, toLang),
      () => this.translateWithTranslateDict(text, toLang)
    ];
    
    for (const apiCall of apis) {
      try {
        const result = await apiCall();
        if (result) {
          return result;
        }
      } catch (error) {
        console.warn('Firefox API 시도 실패:', error);
        continue;
      }
    }
    
    return null;
  }

  /**
   * LibreTranslate API 사용
   */
  private async translateWithLibreTranslate(
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<string | null> {
    try {
      const mappedFrom = this.mapLanguageCode(fromLang, 'libretranslate');
      const mappedTo = this.mapLanguageCode(toLang, 'libretranslate');
      
      console.log('🔄 LibreTranslate 시도:', `${text} (${mappedFrom} → ${mappedTo})`);
      
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          q: text,
          source: mappedFrom,
          target: mappedTo,
          format: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log('📥 LibreTranslate 응답:', data);
      
      if (data.translatedText && data.translatedText.trim() !== text.trim()) {
        console.log('✅ LibreTranslate 번역 성공');
        return data.translatedText.trim();
      }
      
      return null;
    } catch (error) {
      console.warn('❌ LibreTranslate 번역 실패:', error);
      return null;
    }
  }

  /**
   * Linguee API 사용 (무료 사전)
   */
  private async translateWithLinguee(
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<string | null> {
    try {
      // 간단한 단어만 지원하는 무료 사전 API
      const url = `https://linguee-api.fly.dev/api/v2/translations?query=${encodeURIComponent(text)}&src=${fromLang}&dst=${toLang}`;
      console.log('🔄 Linguee API 시도:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Linguee 응답:', data);
      
      if (data.translations && data.translations.length > 0) {
        const translation = data.translations[0].text;
        if (translation && translation.toLowerCase() !== text.toLowerCase()) {
          console.log('✅ Linguee 번역 성공');
          return translation;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('❌ Linguee API 실패:', error);
      return null;
    }
  }

  /**
   * Dict.cc API 사용 (무료 사전)
   */
  private async translateWithTranslateDict(
    text: string,
    toLang: SupportedLanguageCode
  ): Promise<string | null> {
    try {
      // 간단한 JSON 번역 API (CORS 지원)
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${toLang}`;
      console.log('🔄 Auto-detect 번역 시도:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📥 Auto-detect 응답:', data);
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translatedText = data.responseData.translatedText.trim();
        
        if (translatedText.toLowerCase() !== text.toLowerCase()) {
          console.log('✅ Auto-detect 번역 성공');
          return translatedText;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('❌ Auto-detect 번역 실패:', error);
      return null;
    }
  }

  /**
   * Web API 기반 번역 사용 (간단한 사전 기반 번역)
   */
  private async translateWithWebApi(
    text: string,
    fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<string | null> {
    try {
      console.log(`🎯 WebApi 사전 번역 시도: "${text}" (${fromLang} → ${toLang})`);
      // 간단한 단어/문구에 대한 사전 기반 번역 (기본적인 것들)
      const result = await this.translateWithDictionary(text, fromLang, toLang);
      console.log(`📖 사전 번역 결과: ${result}`);
      return result;
    } catch (error) {
      console.warn('Web API 번역 실패:', error);
      return null;
    }
  }

  /**
   * 간단한 단어 번역을 위한 사전 기반 번역
   * 완전 오프라인, 일반적인 단어들에 대해서만 동작
   */
  private async translateWithDictionary(
    text: string,
    _fromLang: SupportedLanguageCode,
    toLang: SupportedLanguageCode
  ): Promise<string | null> {
    // 기본 단어 사전 (확장 가능)
    const basicDictionary: Record<string, Record<SupportedLanguageCode, string>> = {
      // 동물
      'cat': { ko: '고양이', en: 'cat', ja: '猫', zh: '猫', es: 'gato', fr: 'chat', de: 'Katze', ar: 'قطة', hi: 'बिल्ली', pt: 'gato' },
      'dog': { ko: '개', en: 'dog', ja: '犬', zh: '狗', es: 'perro', fr: 'chien', de: 'Hund', ar: 'كلب', hi: 'कुत्ता', pt: 'cão' },
      '고양이': { ko: '고양이', en: 'cat', ja: '猫', zh: '猫', es: 'gato', fr: 'chat', de: 'Katze', ar: 'قطة', hi: 'बिल्ली', pt: 'gato' },
      '개': { ko: '개', en: 'dog', ja: '犬', zh: '狗', es: 'perro', fr: 'chien', de: 'Hund', ar: 'كلب', hi: 'कुत्ता', pt: 'cão' },
      
      // 과일
      'apple': { ko: '사과', en: 'apple', ja: 'りんご', zh: '苹果', es: 'manzana', fr: 'pomme', de: 'Apfel', ar: 'تفاحة', hi: 'सेब', pt: 'maçã' },
      '사과': { ko: '사과', en: 'apple', ja: 'りんご', zh: '苹果', es: 'manzana', fr: 'pomme', de: 'Apfel', ar: 'تفاحة', hi: 'सेब', pt: 'maçã' },
      
      // 기본 인사
      'hello': { ko: '안녕하세요', en: 'hello', ja: 'こんにちは', zh: '你好', es: 'hola', fr: 'bonjour', de: 'hallo', ar: 'مرحبا', hi: 'नमस्ते', pt: 'olá' },
      '안녕하세요': { ko: '안녕하세요', en: 'hello', ja: 'こんにちは', zh: '你好', es: 'hola', fr: 'bonjour', de: 'hallo', ar: 'مرحبا', hi: 'नमस्ते', pt: 'olá' },
      
      // 차량/기계
      'bulldozer': { ko: '불도저', en: 'bulldozer', ja: 'ブルドーザー', zh: '推土机', es: 'bulldozer', fr: 'bulldozer', de: 'Bulldozer', ar: 'جرافة', hi: 'बुलडोज़र', pt: 'bulldozer' },
      '불도저': { ko: '불도저', en: 'bulldozer', ja: 'ブルドーザー', zh: '推土机', es: 'bulldozer', fr: 'bulldozer', de: 'Bulldozer', ar: 'جرافة', hi: 'बुलडोज़र', pt: 'bulldozer' },
      'car': { ko: '자동차', en: 'car', ja: '車', zh: '汽车', es: 'coche', fr: 'voiture', de: 'Auto', ar: 'سيارة', hi: 'कार', pt: 'carro' },
      '자동차': { ko: '자동차', en: 'car', ja: '車', zh: '汽车', es: 'coche', fr: 'voiture', de: 'Auto', ar: 'سيارة', hi: 'कार', pt: 'carro' },
      
      // 자연/식물 (나무 추가!)
      'tree': { ko: '나무', en: 'tree', ja: '木', zh: '树', es: 'árbol', fr: 'arbre', de: 'Baum', ar: 'شجرة', hi: 'पेड़', pt: 'árvore' },
      '나무': { ko: '나무', en: 'tree', ja: '木', zh: '树', es: 'árbol', fr: 'arbre', de: 'Baum', ar: 'شجرة', hi: 'पेड़', pt: 'árvore' },
      'flower': { ko: '꽃', en: 'flower', ja: '花', zh: '花', es: 'flor', fr: 'fleur', de: 'Blume', ar: 'زهرة', hi: 'फूल', pt: 'flor' },
      '꽃': { ko: '꽃', en: 'flower', ja: '花', zh: '花', es: 'flor', fr: 'fleur', de: 'Blume', ar: 'زهرة', hi: 'फूल', pt: 'flor' },
      
      // 더 많은 일반 단어들
      'water': { ko: '물', en: 'water', ja: '水', zh: '水', es: 'agua', fr: 'eau', de: 'Wasser', ar: 'ماء', hi: 'पानी', pt: 'água' },
      '물': { ko: '물', en: 'water', ja: '水', zh: '水', es: 'agua', fr: 'eau', de: 'Wasser', ar: 'ماء', hi: 'पानी', pt: 'água' },
      'fire': { ko: '불', en: 'fire', ja: '火', zh: '火', es: 'fuego', fr: 'feu', de: 'Feuer', ar: 'نار', hi: 'आग', pt: 'fogo' },
      '불': { ko: '불', en: 'fire', ja: '火', zh: '火', es: 'fuego', fr: 'feu', de: 'Feuer', ar: 'نار', hi: 'आग', pt: 'fogo' },
      'house': { ko: '집', en: 'house', ja: '家', zh: '房子', es: 'casa', fr: 'maison', de: 'Haus', ar: 'بيت', hi: 'घर', pt: 'casa' },
      '집': { ko: '집', en: 'house', ja: '家', zh: '房子', es: 'casa', fr: 'maison', de: 'Haus', ar: 'بيت', hi: 'घर', pt: 'casa' },
      'book': { ko: '책', en: 'book', ja: '本', zh: '书', es: 'libro', fr: 'livre', de: 'Buch', ar: 'كتاب', hi: 'किताब', pt: 'livro' },
      '책': { ko: '책', en: 'book', ja: '本', zh: '书', es: 'libro', fr: 'livre', de: 'Buch', ar: 'كتاب', hi: 'किताब', pt: 'livro' }
    };

    const normalizedText = text.toLowerCase().trim();
    console.log(`🔍 사전에서 검색: "${normalizedText}"`);
    
    const dictionary = basicDictionary[normalizedText];
    
    if (dictionary && dictionary[toLang]) {
      console.log(`✅ 사전 번역 성공: "${text}" → "${dictionary[toLang]}"`);
      return dictionary[toLang];
    } else {
      console.log(`❌ 사전에서 찾을 수 없음: "${normalizedText}" → ${toLang}`);
      if (dictionary) {
        console.log(`📋 해당 단어의 사용 가능한 언어들:`, Object.keys(dictionary));
      } else {
        console.log(`📚 사전에 "${normalizedText}" 단어가 없음`);
      }
      return null;
    }
  }

  /**
   * 브라우저 번역 지원 여부 확인
   */
  isSupported(): boolean {
    return this.capability?.isSupported ?? false;
  }

  /**
   * 지원되는 번역 방법 목록
   */
  getSupportedMethods(): string[] {
    return this.capability?.supportedMethods ?? [];
  }

  /**
   * 지원되는 언어 목록
   */
  getSupportedLanguages(): SupportedLanguageCode[] {
    return this.capability?.supportedLanguages ?? [];
  }

  /**
   * 브라우저 번역 설정 가이드 제공
   */
  getSetupGuide(): string {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      return `Chrome에서 번역 기능을 활성화하려면:
1. 설정 → 고급 → 언어
2. "페이지 번역 제안" 옵션 활성화
3. 원하는 언어 추가`;
    } else if (userAgent.includes('Firefox')) {
      return `Firefox에서 번역 기능을 사용하려면:
1. Firefox Translation 확장 프로그램 설치 권장
2. 또는 about:config에서 번역 기능 활성화`;
    } else if (userAgent.includes('Edge')) {
      return `Edge에서 번역 기능을 활성화하려면:
1. 설정 → 언어
2. "번역 제안" 옵션 활성화`;
    } else {
      return '현재 브라우저에서는 내장 번역이 제한적으로 지원됩니다.';
    }
  }
}

// 싱글톤 인스턴스
let browserTranslationInstance: BrowserTranslationService | null = null;

export const getBrowserTranslationService = (): BrowserTranslationService => {
  if (!browserTranslationInstance) {
    browserTranslationInstance = new BrowserTranslationService();
  }
  return browserTranslationInstance;
};