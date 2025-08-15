// 번역 품질 검증 및 학습 시스템
// 비용 최소화를 유지하면서 번역 품질을 향상시키는 지능형 시스템

import type { 
  TranslationQualityScore,
  TranslationQualityFeedback,
  UserTranslationValidation,
  QualityValidationSettings,
  TranslationQualityDatabase,
  SupportedLanguageCode,
  EnhancedTranslationResult,
  TranslationResult
} from '@/types/multilingual';

/**
 * 번역 품질 검증 서비스
 * - 번역 품질 자동 평가
 * - 사용자 피드백 수집 및 학습
 * - 품질 개선을 위한 인사이트 제공
 */
export class TranslationQualityService {
  private readonly STORAGE_KEY = 'translation_quality_db';
  private readonly SETTINGS_KEY = 'quality_validation_settings';
  
  private qualityDatabase: TranslationQualityDatabase;
  private settings: QualityValidationSettings;

  constructor() {
    this.qualityDatabase = this.loadQualityDatabase();
    this.settings = this.loadSettings();
  }

  /**
   * 번역 품질 점수 계산
   */
  calculateQualityScore(
    translation: TranslationResult,
    sourceText: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode
  ): TranslationQualityScore {
    const breakdown = {
      providerReliability: this.calculateProviderReliability(translation.translatedBy),
      languagePairQuality: this.calculateLanguagePairQuality(sourceLang, targetLang),
      contextComplexity: this.calculateContextComplexity(sourceText, translation.name),
      lengthAppropriateness: this.calculateLengthAppropriateness(sourceText, translation.name, sourceLang, targetLang)
    };

    // 가중 평균으로 전체 점수 계산
    const weights = {
      providerReliability: 0.3,
      languagePairQuality: 0.3,
      contextComplexity: 0.2,
      lengthAppropriateness: 0.2
    };

    const overall = Math.round(
      breakdown.providerReliability * weights.providerReliability +
      breakdown.languagePairQuality * weights.languagePairQuality +
      breakdown.contextComplexity * weights.contextComplexity +
      breakdown.lengthAppropriateness * weights.lengthAppropriateness
    );

    const grade = this.determineQualityGrade(overall);
    const confidence = this.determineConfidenceLevel(overall, breakdown);
    const recommendations = this.generateRecommendations(breakdown, translation);
    const needsValidation = overall < this.settings.minConfidenceThreshold || grade === 'poor' || grade === 'needs_review';

    return {
      overall,
      breakdown,
      grade,
      confidence,
      recommendations,
      needsValidation
    };
  }

  /**
   * 번역 제공업체 신뢰도 계산
   */
  private calculateProviderReliability(provider: string): number {
    const providerScores: Record<string, number> = {
      browser: 60, // 브라우저 내장 번역은 중간 수준
      google: 90,  // Google Translate는 높은 품질
      microsoft: 88, // Microsoft Translator도 높은 품질
      papago: 85,  // Papago는 동아시아 언어에서 우수
      deepl: 92,   // DeepL은 최고 품질
      azure: 87,   // Azure도 높은 품질
      libre: 70,   // LibreTranslate는 낮은 품질
    };

    const baseScore = providerScores[provider] || 50;
    
    // 데이터베이스의 성능 기록 반영
    const performanceData = this.qualityDatabase.providerPerformance[provider];
    if (performanceData) {
      return Math.round((baseScore + performanceData.averageQuality) / 2);
    }

    return baseScore;
  }

  /**
   * 언어 쌍 품질 계산
   */
  private calculateLanguagePairQuality(sourceLang: SupportedLanguageCode, targetLang: SupportedLanguageCode): number {
    const pairKey = `${sourceLang}-${targetLang}`;
    const pairData = this.qualityDatabase.languagePairs[pairKey];
    
    if (pairData) {
      return pairData.baseQuality;
    }

    // 기본 언어 쌍 품질 점수
    const languageFamilies: Record<SupportedLanguageCode, string> = {
      ko: 'koreanic',
      zh: 'sino-tibetan',
      ja: 'japonic',
      en: 'germanic',
      es: 'romance',
      fr: 'romance',
      de: 'germanic',
      ar: 'semitic',
      hi: 'indo-aryan',
      pt: 'romance'
    };

    const sourceFamily = languageFamilies[sourceLang];
    const targetFamily = languageFamilies[targetLang];

    // 같은 언어족일 때는 더 높은 점수
    if (sourceFamily === targetFamily) {
      return 85;
    }

    // 영어를 포함한 쌍은 일반적으로 높은 품질
    if (sourceLang === 'en' || targetLang === 'en') {
      return 82;
    }

    // 동아시아 언어 간 번역
    if (['ko', 'zh', 'ja'].includes(sourceLang) && ['ko', 'zh', 'ja'].includes(targetLang)) {
      return 78;
    }

    // 유럽 언어 간 번역
    if (['en', 'es', 'fr', 'de', 'pt'].includes(sourceLang) && ['en', 'es', 'fr', 'de', 'pt'].includes(targetLang)) {
      return 80;
    }

    // 기타 언어 쌍
    return 75;
  }

  /**
   * 문맥 복잡도 계산
   */
  private calculateContextComplexity(sourceText: string, translatedText: string): number {
    let score = 100;

    // 텍스트 길이 복잡도
    if (sourceText.length > 50) {
      score -= 10; // 긴 텍스트는 복잡도가 높음
    }

    // 특수 문자나 숫자 포함
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/g;
    const numberRegex = /\d/g;
    
    if (specialCharRegex.test(sourceText)) {
      score -= 5;
    }
    
    if (numberRegex.test(sourceText)) {
      score -= 5;
    }

    // 대문자 비율 (고유명사 등)
    const uppercaseRatio = (sourceText.match(/[A-Z]/g) || []).length / sourceText.length;
    if (uppercaseRatio > 0.1) {
      score -= 10;
    }

    // 반복 패턴 감지
    if (this.hasRepeatedPatterns(translatedText)) {
      score -= 15;
    }

    // 번역 실패 징후 감지
    if (this.detectTranslationFailure(sourceText, translatedText)) {
      score -= 30;
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * 길이 적절성 계산
   */
  private calculateLengthAppropriateness(
    sourceText: string,
    translatedText: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode
  ): number {
    const sourceLength = sourceText.length;
    const translatedLength = translatedText.length;
    
    if (sourceLength === 0 || translatedLength === 0) {
      return 0;
    }

    const lengthRatio = translatedLength / sourceLength;

    // 언어별 예상 길이 비율
    const expectedRatios: Record<string, number> = {
      'ko-en': 1.2, // 한국어 → 영어는 보통 20% 길어짐
      'en-ko': 0.8, // 영어 → 한국어는 보통 20% 짧아짐
      'ko-zh': 0.6, // 한국어 → 중국어는 짧아짐
      'zh-ko': 1.4, // 중국어 → 한국어는 길어짐
      'ko-ja': 1.1, // 한국어 → 일본어는 비슷
      'ja-ko': 0.9, // 일본어 → 한국어는 약간 짧아짐
    };

    const pairKey = `${sourceLang}-${targetLang}`;
    const expectedRatio = expectedRatios[pairKey] || 1.0;

    // 예상 비율과의 차이 계산
    const deviation = Math.abs(lengthRatio - expectedRatio) / expectedRatio;

    // 편차가 적을수록 높은 점수
    let score = Math.max(0, 100 - (deviation * 100));

    // 극단적인 길이 차이 패널티
    if (lengthRatio > 3 || lengthRatio < 0.3) {
      score = Math.min(score, 30);
    }

    return Math.round(score);
  }

  /**
   * 품질 등급 결정
   */
  private determineQualityGrade(overall: number): 'excellent' | 'good' | 'fair' | 'poor' | 'needs_review' {
    if (overall >= 90) return 'excellent';
    if (overall >= 80) return 'good';
    if (overall >= 70) return 'fair';
    if (overall >= 50) return 'poor';
    return 'needs_review';
  }

  /**
   * 신뢰도 레벨 결정
   */
  private determineConfidenceLevel(overall: number, breakdown: any): 'high' | 'medium' | 'low' {
    const minScore = Math.min(...Object.values(breakdown).map(v => Number(v)));
    
    if (overall >= 85 && minScore >= 70) return 'high';
    if (overall >= 70 && minScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * 개선 권장사항 생성
   */
  private generateRecommendations(breakdown: any, translation: TranslationResult): string[] {
    const recommendations: string[] = [];

    if (breakdown.providerReliability < 70) {
      recommendations.push('더 신뢰할 수 있는 번역 서비스 사용을 권장합니다.');
    }

    if (breakdown.languagePairQuality < 70) {
      recommendations.push('이 언어 쌍은 번역 품질이 낮을 수 있으니 수동 검토를 권장합니다.');
    }

    if (breakdown.contextComplexity < 70) {
      recommendations.push('복잡한 문맥으로 인해 번역 오류가 있을 수 있습니다.');
    }

    if (breakdown.lengthAppropriateness < 70) {
      recommendations.push('번역문의 길이가 부적절할 수 있으니 확인이 필요합니다.');
    }

    if (translation.confidence < 0.8) {
      recommendations.push('번역 신뢰도가 낮습니다. 원어민 검토를 권장합니다.');
    }

    return recommendations;
  }

  /**
   * 반복 패턴 감지
   */
  private hasRepeatedPatterns(text: string): boolean {
    const words = text.split(/\s+/);
    const wordCount: Record<string, number> = {};
    
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }

    // 같은 단어가 3번 이상 반복되면 의심스러운 패턴
    return Object.values(wordCount).some(count => count >= 3);
  }

  /**
   * 번역 실패 징후 감지
   */
  private detectTranslationFailure(sourceText: string, translatedText: string): boolean {
    // 번역문이 원문과 동일한 경우 (번역 실패 가능성)
    if (sourceText === translatedText) {
      return true;
    }

    // 번역문에 원문의 일부가 그대로 남아있는 경우
    if (translatedText.includes(sourceText) && sourceText.length > 5) {
      return true;
    }

    // 의미없는 문자 반복
    const meaninglessPattern = /(.)\1{4,}/; // 같은 문자 5번 이상 반복
    if (meaninglessPattern.test(translatedText)) {
      return true;
    }

    return false;
  }

  /**
   * 사용자 검증 피드백 추가
   */
  addUserValidation(
    translationId: string,
    validation: UserTranslationValidation
  ): void {
    const feedback = this.getOrCreateFeedback(translationId);
    feedback.userValidations.push(validation);
    feedback.updatedAt = new Date().toISOString();

    // 사용자 수정이 있는 경우 학습 데이터로 활용
    if (validation.correctedTranslation !== validation.originalTranslation) {
      feedback.useForLearning = true;
      this.updateLearningDatabase(feedback, validation);
    }

    this.saveFeedback(feedback);
    this.updateStatistics(validation);
  }

  /**
   * 대안 번역 제안
   */
  async suggestAlternatives(
    currentTranslation: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode
  ): Promise<string[]> {
    const alternatives: string[] = [];

    // 학습된 패턴에서 대안 검색
    const pairKey = `${sourceLang}-${targetLang}`;
    const vocabularyPrefs = this.qualityDatabase.learnedPatterns.vocabularyPreferences[pairKey];
    
    if (vocabularyPrefs) {
      // 단어별 선호 번역 적용
      let alternativeText = currentTranslation;
      Object.entries(vocabularyPrefs).forEach(([original, preferred]) => {
        if (alternativeText.includes(original)) {
          alternativeText = alternativeText.replace(new RegExp(original, 'g'), preferred);
        }
      });
      
      if (alternativeText !== currentTranslation) {
        alternatives.push(alternativeText);
      }
    }

    // 일반적인 수정 패턴 적용
    const commonErrors = this.qualityDatabase.learnedPatterns.commonErrors[pairKey];
    if (commonErrors) {
      let correctedText = currentTranslation;
      commonErrors.forEach(errorPattern => {
        const [error, correction] = errorPattern.split('→');
        if (correctedText.includes(error.trim())) {
          correctedText = correctedText.replace(new RegExp(error.trim(), 'g'), correction.trim());
        }
      });
      
      if (correctedText !== currentTranslation && !alternatives.includes(correctedText)) {
        alternatives.push(correctedText);
      }
    }

    return alternatives.slice(0, 3); // 최대 3개 대안 제공
  }

  /**
   * 번역을 개선된 결과로 변환
   */
  enhanceTranslationResult(
    translation: TranslationResult,
    sourceText: string,
    sourceLang: SupportedLanguageCode,
    targetLang: SupportedLanguageCode
  ): EnhancedTranslationResult {
    const qualityScore = this.calculateQualityScore(translation, sourceText, sourceLang, targetLang);
    const translationId = this.generateTranslationId(sourceText, sourceLang, targetLang);
    const feedback = this.getExistingFeedback(translationId);

    return {
      ...translation,
      qualityScore,
      validationStatus: this.determineValidationStatus(qualityScore, feedback || undefined),
      alternatives: feedback?.alternatives || [],
      userCorrections: feedback?.userValidations || [],
      qualityFlags: this.generateQualityFlags(qualityScore, translation)
    };
  }

  /**
   * 품질 플래그 생성
   */
  private generateQualityFlags(qualityScore: TranslationQualityScore, translation: TranslationResult): string[] {
    const flags: string[] = [];

    if (qualityScore.grade === 'poor' || qualityScore.grade === 'needs_review') {
      flags.push('low_quality');
    }

    if (qualityScore.confidence === 'low') {
      flags.push('low_confidence');
    }

    if (qualityScore.needsValidation) {
      flags.push('needs_validation');
    }

    if (translation.confidence < 0.7) {
      flags.push('provider_low_confidence');
    }

    return flags;
  }

  /**
   * 검증 상태 결정
   */
  private determineValidationStatus(
    qualityScore: TranslationQualityScore,
    feedback?: TranslationQualityFeedback
  ): 'unvalidated' | 'auto_validated' | 'user_validated' | 'rejected' {
    if (feedback?.userValidations && feedback.userValidations.length > 0) {
      const lastValidation = feedback.userValidations[feedback.userValidations.length - 1];
      return lastValidation.correctedTranslation === lastValidation.originalTranslation 
        ? 'user_validated' 
        : 'rejected';
    }

    if (qualityScore.confidence === 'high' && qualityScore.overall >= 85) {
      return 'auto_validated';
    }

    return 'unvalidated';
  }

  /**
   * 학습 데이터베이스 업데이트
   */
  private updateLearningDatabase(feedback: TranslationQualityFeedback, validation: UserTranslationValidation): void {
    const pairKey = `${feedback.languagePair.source}-${feedback.languagePair.target}`;

    // 일반적인 오류 패턴 학습
    if (validation.originalTranslation !== validation.correctedTranslation) {
      const errorPattern = `${validation.originalTranslation}→${validation.correctedTranslation}`;
      
      if (!this.qualityDatabase.learnedPatterns.commonErrors[pairKey]) {
        this.qualityDatabase.learnedPatterns.commonErrors[pairKey] = [];
      }
      
      if (!this.qualityDatabase.learnedPatterns.commonErrors[pairKey].includes(errorPattern)) {
        this.qualityDatabase.learnedPatterns.commonErrors[pairKey].push(errorPattern);
      }
    }

    // 어휘 선호도 학습
    const words = validation.originalTranslation.split(/\s+/);
    const correctedWords = validation.correctedTranslation.split(/\s+/);
    
    if (words.length === correctedWords.length) {
      for (let i = 0; i < words.length; i++) {
        if (words[i] !== correctedWords[i]) {
          if (!this.qualityDatabase.learnedPatterns.vocabularyPreferences[pairKey]) {
            this.qualityDatabase.learnedPatterns.vocabularyPreferences[pairKey] = {};
          }
          this.qualityDatabase.learnedPatterns.vocabularyPreferences[pairKey][words[i]] = correctedWords[i];
        }
      }
    }

    this.saveQualityDatabase();
  }

  /**
   * 통계 업데이트
   */
  private updateStatistics(validation: UserTranslationValidation): void {
    this.qualityDatabase.userFeedbackStats.totalValidations++;
    
    if (validation.correctedTranslation !== validation.originalTranslation) {
      this.qualityDatabase.userFeedbackStats.averageCorrectionRate = 
        (this.qualityDatabase.userFeedbackStats.averageCorrectionRate * 
         (this.qualityDatabase.userFeedbackStats.totalValidations - 1) + 1) / 
        this.qualityDatabase.userFeedbackStats.totalValidations;
    }

    if (validation.correctionReason) {
      this.qualityDatabase.userFeedbackStats.mostCommonCorrectionReasons[validation.correctionReason] = 
        (this.qualityDatabase.userFeedbackStats.mostCommonCorrectionReasons[validation.correctionReason] || 0) + 1;
    }

    if (validation.isNativeSpeaker) {
      this.qualityDatabase.userFeedbackStats.nativeSpeakerContributions++;
    }

    this.saveQualityDatabase();
  }

  /**
   * 번역 ID 생성
   */
  private generateTranslationId(sourceText: string, sourceLang: string, targetLang: string): string {
    const data = `${sourceLang}-${targetLang}-${sourceText}`;
    // 간단한 해시 함수 (실제로는 crypto API 사용 권장)
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32비트 정수로 변환
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * 피드백 조회 또는 생성
   */
  private getOrCreateFeedback(translationId: string): TranslationQualityFeedback {
    // 실제로는 데이터베이스에서 조회
    // 여기서는 간단히 로컬 스토리지 사용
    const existing = this.getExistingFeedback(translationId);
    if (existing) {
      return existing;
    }

    // 새로운 피드백 객체 생성 (최소한의 정보로)
    return {
      translationId,
      languagePair: { source: 'ko' as SupportedLanguageCode, target: 'en' as SupportedLanguageCode },
      sourceText: '',
      translatedText: '',
      provider: 'browser',
      qualityScore: {
        overall: 50,
        breakdown: {
          providerReliability: 50,
          languagePairQuality: 50,
          contextComplexity: 50,
          lengthAppropriateness: 50
        },
        grade: 'fair',
        confidence: 'medium',
        recommendations: [],
        needsValidation: true
      },
      userValidations: [],
      autoFlags: {
        lengthAnomaly: false,
        repeatedText: false,
        suspectedFailure: false,
        inappropriateContent: false
      },
      useForLearning: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * 기존 피드백 조회
   */
  private getExistingFeedback(translationId: string): TranslationQualityFeedback | null {
    // 실제로는 데이터베이스에서 조회
    const feedbacks = JSON.parse(localStorage.getItem('translation_feedbacks') || '{}');
    return feedbacks[translationId] || null;
  }

  /**
   * 피드백 저장
   */
  private saveFeedback(feedback: TranslationQualityFeedback): void {
    const feedbacks = JSON.parse(localStorage.getItem('translation_feedbacks') || '{}');
    feedbacks[feedback.translationId] = feedback;
    localStorage.setItem('translation_feedbacks', JSON.stringify(feedbacks));
  }

  /**
   * 품질 데이터베이스 로드
   */
  private loadQualityDatabase(): TranslationQualityDatabase {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    // 기본 데이터베이스 구조
    return {
      languagePairs: {},
      providerPerformance: {},
      userFeedbackStats: {
        totalValidations: 0,
        averageCorrectionRate: 0,
        mostCommonCorrectionReasons: {},
        nativeSpeakerContributions: 0
      },
      learnedPatterns: {
        commonErrors: {},
        contextualRules: {},
        vocabularyPreferences: {}
      }
    };
  }

  /**
   * 설정 로드
   */
  private loadSettings(): QualityValidationSettings {
    const saved = localStorage.getItem(this.SETTINGS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }

    // 기본 설정
    return {
      minConfidenceThreshold: 70,
      enableAutoValidation: true,
      enableUserValidation: true,
      showAlternatives: true,
      prioritizeNativeValidation: true,
      allowLearningDataCollection: true
    };
  }

  /**
   * 품질 데이터베이스 저장
   */
  private saveQualityDatabase(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.qualityDatabase));
  }

  /**
   * 설정 저장
   */
  saveSettings(settings: QualityValidationSettings): void {
    this.settings = settings;
    localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
  }

  /**
   * 현재 설정 조회
   */
  getSettings(): QualityValidationSettings {
    return { ...this.settings };
  }

  /**
   * 품질 통계 조회
   */
  getQualityStatistics() {
    return {
      database: this.qualityDatabase,
      summary: {
        totalValidations: this.qualityDatabase.userFeedbackStats.totalValidations,
        correctionRate: this.qualityDatabase.userFeedbackStats.averageCorrectionRate,
        nativeContributions: this.qualityDatabase.userFeedbackStats.nativeSpeakerContributions,
        languagePairCount: Object.keys(this.qualityDatabase.languagePairs).length,
        learnedPatternsCount: Object.keys(this.qualityDatabase.learnedPatterns.commonErrors).length
      }
    };
  }
}

// 싱글톤 인스턴스
let qualityServiceInstance: TranslationQualityService | null = null;

export const getTranslationQualityService = (): TranslationQualityService => {
  if (!qualityServiceInstance) {
    qualityServiceInstance = new TranslationQualityService();
  }
  return qualityServiceInstance;
};

// 편의 함수들
export const calculateTranslationQuality = (
  translation: TranslationResult,
  sourceText: string,
  sourceLang: SupportedLanguageCode,
  targetLang: SupportedLanguageCode
): TranslationQualityScore => {
  const service = getTranslationQualityService();
  return service.calculateQualityScore(translation, sourceText, sourceLang, targetLang);
};

export const enhanceTranslation = (
  translation: TranslationResult,
  sourceText: string,
  sourceLang: SupportedLanguageCode,
  targetLang: SupportedLanguageCode
): EnhancedTranslationResult => {
  const service = getTranslationQualityService();
  return service.enhanceTranslationResult(translation, sourceText, sourceLang, targetLang);
};