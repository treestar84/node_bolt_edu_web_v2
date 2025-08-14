// 브라우저 번역 우선 → 무료 API fallback 전략 - 비용 완전 최소화
// 1. 브라우저 내장 번역 (100% 무료) 우선 시도
// 2. 실패 시 무료 API 순차 시도
// 3. 비용 0원 ~ 최소 비용으로 운영

import type { SupportedLanguageCode } from '@/constants/languages';
import { getBrowserTranslationService } from './browserTranslation';

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number; // 0-1
  translatedBy: 'microsoft' | 'google' | 'papago' | 'libre' | 'manual';
  timestamp: number;
}

export interface TranslationRequest {
  text: string;
  fromLang: SupportedLanguageCode;
  toLang: SupportedLanguageCode;
}

export interface TranslationBatch {
  text: string;
  fromLang: SupportedLanguageCode;
  toLangs: SupportedLanguageCode[];
}

/**
 * 무료 번역 API들을 우선순위별로 시도하는 통합 번역 서비스
 * 비용 최소화를 위해 무료 한도를 최대한 활용
 */
export class TranslationService {
  private readonly apiKeys: Record<string, string>;
  private readonly freeQuotaUsage: Record<string, { used: number; limit: number; resetDate: Date }>;
  private readonly browserTranslation;

  // 번역 우선순위 (비용 최소화 순서)
  private readonly priorityOrder = [
    'browser',   // 브라우저 내장 (100% 무료)
    'microsoft', // 월 2백만 자 무료
    'google',    // 월 50만 자 무료 
    'papago',    // 일 10,000자 무료
    'libre'      // 완전 무료 (정확도는 낮음)
  ];

  constructor() {
    this.apiKeys = this.loadApiKeys();
    this.freeQuotaUsage = this.loadQuotaUsage();
    this.browserTranslation = getBrowserTranslationService();
  }

  /**
   * 단일 텍스트 번역 (무료 API 우선 시도)
   */
  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    console.log(`🌍 번역 시도: ${request.fromLang} → ${request.toLang}, "${request.text}"`);

    // 각 번역 방법을 우선순위별로 시도
    console.log(`🔄 번역 시도 순서: ${this.priorityOrder.join(' → ')}`);
    
    for (const provider of this.priorityOrder) {
      console.log(`🎯 ${provider} 번역 시도 중...`);
      
      // 브라우저 번역은 한도 체크 없이 시도
      if (provider !== 'browser' && !this.hasQuotaRemaining(provider)) {
        console.log(`⏭️ ${provider} API 한도 초과, 다음 API 시도`);
        continue;
      }

      try {
        const result = await this.tryTranslateWithProvider(request, provider);
        if (result) {
          // 브라우저 번역은 한도 업데이트 없이 사용
          if (provider !== 'browser') {
            this.updateQuotaUsage(provider, request.text.length);
          }
          console.log(`✅ ${provider} 번역 성공: "${result.translatedText}"`);
          return result;
        } else {
          console.log(`❌ ${provider} 번역 결과 없음`);
        }
      } catch (error) {
        console.warn(`⚠️ ${provider} 번역 실패:`, error);
        continue; // 다음 방법 시도
      }
    }

    throw new Error('모든 번역 API 시도 실패. 무료 한도를 모두 초과했거나 서비스 오류입니다.');
  }

  /**
   * 배치 번역 (한 번에 여러 언어로 번역)
   */
  async translateBatch(batch: TranslationBatch): Promise<Record<SupportedLanguageCode, TranslationResult>> {
    console.log(`🔄 배치 번역 시작: 1개 텍스트 → ${batch.toLangs.length}개 언어`);
    
    const results: Record<SupportedLanguageCode, TranslationResult> = {} as any;
    const errors: string[] = [];

    // 각 대상 언어별로 번역 시도
    for (const toLang of batch.toLangs) {
      try {
        const result = await this.translateText({
          text: batch.text,
          fromLang: batch.fromLang,
          toLang: toLang
        });
        results[toLang] = result;
      } catch (error) {
        const errorMsg = `${toLang} 번역 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`;
        errors.push(errorMsg);
        console.error(`❌ ${errorMsg}`);
      }
    }

    if (Object.keys(results).length === 0) {
      throw new Error(`배치 번역 완전 실패: ${errors.join(', ')}`);
    }

    console.log(`✅ 배치 번역 완료: ${Object.keys(results).length}/${batch.toLangs.length} 성공`);
    return results;
  }

  /**
   * Microsoft Translator API (월 2백만 자 무료)
   */
  private async translateWithMicrosoft(request: TranslationRequest): Promise<TranslationResult> {
    const endpoint = 'https://api.cognitive.microsofttranslator.com/translate';
    const params = new URLSearchParams({
      'api-version': '3.0',
      'from': this.mapLanguageCode(request.fromLang, 'microsoft'),
      'to': this.mapLanguageCode(request.toLang, 'microsoft')
    });

    const response = await fetch(`${endpoint}?${params}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKeys.microsoft,
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Region': 'global'
      },
      body: JSON.stringify([{ Text: request.text }])
    });

    if (!response.ok) {
      throw new Error(`Microsoft Translator API 오류: ${response.status}`);
    }

    const data = await response.json();
    const translation = data[0].translations[0];

    return {
      originalText: request.text,
      translatedText: translation.text,
      sourceLanguage: request.fromLang,
      targetLanguage: request.toLang,
      confidence: translation.confidence || 0.9,
      translatedBy: 'microsoft',
      timestamp: Date.now()
    };
  }

  /**
   * Google Translate API (월 50만 자 무료)
   */
  private async translateWithGoogle(request: TranslationRequest): Promise<TranslationResult> {
    const endpoint = 'https://translation.googleapis.com/language/translate/v2';
    const params = new URLSearchParams({
      key: this.apiKeys.google,
      q: request.text,
      source: this.mapLanguageCode(request.fromLang, 'google'),
      target: this.mapLanguageCode(request.toLang, 'google'),
      format: 'text'
    });

    const response = await fetch(`${endpoint}?${params}`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Google Translate API 오류: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.data.translations[0];

    return {
      originalText: request.text,
      translatedText: translation.translatedText,
      sourceLanguage: request.fromLang,
      targetLanguage: request.toLang,
      confidence: 0.95, // Google은 일반적으로 높은 품질
      translatedBy: 'google',
      timestamp: Date.now()
    };
  }

  /**
   * Papago API (네이버, 일 10,000자 무료)
   */
  private async translateWithPapago(request: TranslationRequest): Promise<TranslationResult> {
    const endpoint = 'https://openapi.naver.com/v1/papago/n2mt';
    
    const formData = new URLSearchParams();
    formData.append('source', this.mapLanguageCode(request.fromLang, 'papago'));
    formData.append('target', this.mapLanguageCode(request.toLang, 'papago'));
    formData.append('text', request.text);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'X-Naver-Client-Id': this.apiKeys.papagoClientId,
        'X-Naver-Client-Secret': this.apiKeys.papagoClientSecret,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Papago API 오류: ${response.status}`);
    }

    const data = await response.json();
    const translation = data.message.result;

    return {
      originalText: request.text,
      translatedText: translation.translatedText,
      sourceLanguage: request.fromLang,
      targetLanguage: request.toLang,
      confidence: 0.85, // Papago는 한국어 관련에서 높은 품질
      translatedBy: 'papago',
      timestamp: Date.now()
    };
  }

  /**
   * LibreTranslate API (완전 무료, 정확도는 낮음)
   */
  private async translateWithLibre(request: TranslationRequest): Promise<TranslationResult> {
    const endpoint = 'https://libretranslate.de/translate'; // 또는 self-hosted
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: request.text,
        source: this.mapLanguageCode(request.fromLang, 'libre'),
        target: this.mapLanguageCode(request.toLang, 'libre'),
        format: 'text'
      })
    });

    if (!response.ok) {
      throw new Error(`LibreTranslate API 오류: ${response.status}`);
    }

    const data = await response.json();

    return {
      originalText: request.text,
      translatedText: data.translatedText,
      sourceLanguage: request.fromLang,
      targetLanguage: request.toLang,
      confidence: 0.7, // LibreTranslate는 정확도가 낮음
      translatedBy: 'libre',
      timestamp: Date.now()
    };
  }

  /**
   * 특정 제공업체로 번역 시도
   */
  private async tryTranslateWithProvider(
    request: TranslationRequest, 
    provider: string
  ): Promise<TranslationResult | null> {
    switch (provider) {
      case 'browser':
        console.log('🔍 브라우저 번역 지원 여부:', this.browserTranslation.isSupported());
        if (this.browserTranslation.isSupported()) {
          try {
            const result = await this.browserTranslation.translateText(request.text, request.fromLang, request.toLang);
            console.log('📥 브라우저 번역 결과:', result);
            return result;
          } catch (error) {
            console.warn('❌ 브라우저 번역 오류:', error);
            return null;
          }
        }
        return null;
      
      case 'microsoft':
        return this.apiKeys.microsoft ? await this.translateWithMicrosoft(request) : null;
      
      case 'google':
        return this.apiKeys.google ? await this.translateWithGoogle(request) : null;
      
      case 'papago':
        return (this.apiKeys.papagoClientId && this.apiKeys.papagoClientSecret) 
          ? await this.translateWithPapago(request) : null;
      
      case 'libre':
        return await this.translateWithLibre(request); // API 키 불필요
      
      default:
        return null;
    }
  }

  /**
   * 언어 코드를 각 API에 맞게 매핑
   */
  private mapLanguageCode(code: SupportedLanguageCode, provider: string): string {
    const mappings: Record<string, Record<SupportedLanguageCode, string>> = {
      microsoft: {
        ko: 'ko', en: 'en', zh: 'zh', ja: 'ja', 
        es: 'es', fr: 'fr', de: 'de', ar: 'ar', 
        hi: 'hi', pt: 'pt'
      },
      google: {
        ko: 'ko', en: 'en', zh: 'zh-CN', ja: 'ja', 
        es: 'es', fr: 'fr', de: 'de', ar: 'ar', 
        hi: 'hi', pt: 'pt'
      },
      papago: {
        ko: 'ko', en: 'en', zh: 'zh-CN', ja: 'ja', 
        es: 'es', fr: 'fr', de: 'de', ar: 'ar', 
        hi: 'hi', pt: 'pt'
      },
      libre: {
        ko: 'ko', en: 'en', zh: 'zh', ja: 'ja', 
        es: 'es', fr: 'fr', de: 'de', ar: 'ar', 
        hi: 'hi', pt: 'pt'
      }
    };

    return mappings[provider]?.[code] || code;
  }

  /**
   * API 키들 로드
   */
  private loadApiKeys(): Record<string, string> {
    return {
      microsoft: import.meta.env.VITE_MICROSOFT_TRANSLATOR_KEY || '',
      google: import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || '',
      papagoClientId: import.meta.env.VITE_PAPAGO_CLIENT_ID || '',
      papagoClientSecret: import.meta.env.VITE_PAPAGO_CLIENT_SECRET || ''
    };
  }

  /**
   * 무료 한도 사용량 로드
   */
  private loadQuotaUsage(): Record<string, { used: number; limit: number; resetDate: Date }> {
    const saved = localStorage.getItem('translationQuota');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Date 객체 복원
      Object.keys(parsed).forEach(key => {
        parsed[key].resetDate = new Date(parsed[key].resetDate);
      });
      return parsed;
    }

    // 기본 무료 한도 설정
    const today = new Date();
    return {
      browser: { used: 0, limit: 999999999, resetDate: new Date(2099, 12, 31) }, // 무제한 (브라우저 내장)
      microsoft: { used: 0, limit: 2000000, resetDate: new Date(today.getFullYear(), today.getMonth() + 1, 1) }, // 월간
      google: { used: 0, limit: 500000, resetDate: new Date(today.getFullYear(), today.getMonth() + 1, 1) }, // 월간
      papago: { used: 0, limit: 10000, resetDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1) }, // 일간
      libre: { used: 0, limit: 999999999, resetDate: new Date(2099, 12, 31) } // 무제한
    };
  }

  /**
   * 한도 여부 확인
   */
  private hasQuotaRemaining(provider: string): boolean {
    const quota = this.freeQuotaUsage[provider];
    if (!quota) return false;

    // 리셋 날짜가 지났으면 사용량 초기화
    if (new Date() > quota.resetDate) {
      quota.used = 0;
      if (provider === 'papago') {
        // 일간 리셋
        quota.resetDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      } else {
        // 월간 리셋
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
        quota.resetDate = nextMonth;
      }
    }

    return quota.used < quota.limit;
  }

  /**
   * 한도 사용량 업데이트
   */
  private updateQuotaUsage(provider: string, characterCount: number): void {
    if (this.freeQuotaUsage[provider]) {
      this.freeQuotaUsage[provider].used += characterCount;
      localStorage.setItem('translationQuota', JSON.stringify(this.freeQuotaUsage));
    }
  }

  /**
   * 한도 상태 조회
   */
  getQuotaStatus(): Record<string, { used: number; limit: number; remaining: number; resetDate: Date }> {
    const status: Record<string, any> = {};
    
    Object.entries(this.freeQuotaUsage).forEach(([provider, quota]) => {
      status[provider] = {
        used: quota.used,
        limit: quota.limit,
        remaining: Math.max(0, quota.limit - quota.used),
        resetDate: quota.resetDate
      };
    });

    return status;
  }

  /**
   * 한도 상태를 사람이 읽기 쉬운 형태로 포맷
   */
  getQuotaStatusFormatted(): string {
    const status = this.getQuotaStatus();
    const lines: string[] = [];

    Object.entries(status).forEach(([provider, quota]) => {
      const usedPercent = Math.round((quota.used / quota.limit) * 100);
      const remainingFormatted = quota.remaining.toLocaleString();
      lines.push(`${provider}: ${usedPercent}% 사용 (${remainingFormatted}자 남음)`);
    });

    return lines.join('\n');
  }
}

// 싱글톤 인스턴스
let translationServiceInstance: TranslationService | null = null;

export const getTranslationService = (): TranslationService => {
  if (!translationServiceInstance) {
    translationServiceInstance = new TranslationService();
  }
  return translationServiceInstance;
};

// 편의 함수들
export const translateText = async (text: string, fromLang: SupportedLanguageCode, toLang: SupportedLanguageCode): Promise<TranslationResult> => {
  const service = getTranslationService();
  return service.translateText({ text, fromLang, toLang });
};

export const translateToMultipleLanguages = async (
  text: string, 
  fromLang: SupportedLanguageCode, 
  toLangs: SupportedLanguageCode[]
): Promise<Record<SupportedLanguageCode, TranslationResult>> => {
  const service = getTranslationService();
  return service.translateBatch({ text, fromLang, toLangs });
};