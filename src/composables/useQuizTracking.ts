import { ref, computed } from 'vue';
import { useSupabase } from './useSupabase';
import type { QuizResult, UserLearningStats, AgeGroupComparison } from '@/types';

export function useQuizTracking() {
  const { supabase } = useSupabase();
  const isLoading = ref(false);
  const error = ref<string>('');

  // 퀴즈 결과 저장
  const saveQuizResult = async (result: Omit<QuizResult, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      isLoading.value = true;
      error.value = '';

      const insertData = {
        user_id: result.userId,
        quiz_type: result.quizType,
        question_id: result.questionId,
        question_text: result.questionText,
        correct_answer: result.correctAnswer,
        user_answer: result.userAnswer,
        is_correct: result.isCorrect,
        response_time_ms: result.responseTimeMs,
        difficulty_level: result.difficultyLevel || 1
      };

      console.log('💾 Inserting quiz result:', insertData);

      const { data, error: dbError } = await supabase
        .from('quiz_results')
        .insert(insertData)
        .select()
        .single();

      if (dbError) {
        console.error('❌ Database error while saving quiz result:', dbError);
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        console.error('Error details:', dbError.details);
        throw dbError;
      }

      console.log('✅ Quiz result saved successfully:', data);
      return data;
    } catch (err: any) {
      console.error('💥 Error saving quiz result:', err);
      error.value = err.message || '퀴즈 결과 저장 중 오류가 발생했습니다.';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 사용자 학습 통계 조회
  const getUserLearningStats = async (userId: string): Promise<UserLearningStats | null> => {
    try {
      isLoading.value = true;
      error.value = '';

      const { data, error: dbError } = await supabase
        .from('user_learning_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('학습 통계 조회 실패:', dbError);
        throw dbError;
      }

      return data || null;
    } catch (err: any) {
      console.error('학습 통계 조회 오류:', err);
      error.value = err.message || '학습 통계 조회 중 오류가 발생했습니다.';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // 최근 퀴즈 결과 조회 (최대 500개)
  const getRecentQuizResults = async (userId: string, limit: number = 500) => {
    try {
      isLoading.value = true;
      error.value = '';

      console.log('📊 Getting recent quiz results for user:', userId, 'limit:', limit);

      const { data, error: dbError } = await supabase
        .from('quiz_results')
        .select(`
          id,
          user_id,
          quiz_type,
          question_id,
          question_text,
          correct_answer,
          user_answer,
          is_correct,
          response_time_ms,
          difficulty_level,
          created_at,
          updated_at
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (dbError) {
        console.error('❌ Database error while getting quiz results:', dbError);
        console.error('Error code:', dbError.code);
        console.error('Error message:', dbError.message);
        throw dbError;
      }

      console.log('✅ Quiz results retrieved:', data?.length || 0, 'results');
      
      if (data && data.length > 0) {
        console.log('📈 Sample raw results:', data.slice(0, 3));
      }

      // 데이터베이스 필드명을 TypeScript 인터페이스에 맞게 변환
      const transformedData = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        quizType: item.quiz_type,
        questionId: item.question_id,
        questionText: item.question_text,
        correctAnswer: item.correct_answer,
        userAnswer: item.user_answer,
        isCorrect: item.is_correct,
        responseTimeMs: item.response_time_ms,
        difficultyLevel: item.difficulty_level,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      if (transformedData.length > 0) {
        console.log('📈 Sample transformed results:', transformedData.slice(0, 3));
      }

      return transformedData;
    } catch (err: any) {
      console.error('💥 Error getting quiz results:', err);
      error.value = err.message || '퀴즈 결과 조회 중 오류가 발생했습니다.';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 사용자 백분위 및 비교 통계 조회
  const getUserPercentileStats = async (userId: string): Promise<AgeGroupComparison | null> => {
    try {
      isLoading.value = true;
      error.value = '';

      const { data, error: dbError } = await supabase
        .rpc('get_user_percentile', { p_user_id: userId });

      if (dbError) {
        console.error('사용자 백분위 조회 실패:', dbError);
        throw dbError;
      }

      return data || null;
    } catch (err: any) {
      console.error('사용자 백분위 조회 오류:', err);
      error.value = err.message || '백분위 조회 중 오류가 발생했습니다.';
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  // 연령대별 그룹 통계 조회
  const getAgeGroupStats = async () => {
    try {
      isLoading.value = true;
      error.value = '';

      const { data, error: dbError } = await supabase
        .from('age_group_stats')
        .select('*')
        .order('age_group');

      if (dbError) {
        console.error('연령대별 통계 조회 실패:', dbError);
        throw dbError;
      }

      return data || [];
    } catch (err: any) {
      console.error('연령대별 통계 조회 오류:', err);
      error.value = err.message || '연령대별 통계 조회 중 오류가 발생했습니다.';
      return [];
    } finally {
      isLoading.value = false;
    }
  };

  // 최근 정답률 계산 (클라이언트 사이드)
  const calculateRecentAccuracy = (results: QuizResult[], limit: number = 500): number => {
    console.log('🧮 Calculating recent accuracy:', { resultsLength: results?.length, limit });
    
    if (!results || results.length === 0) {
      console.log('📊 No results for accuracy calculation');
      return 0;
    }
    
    const recentResults = results.slice(0, limit);
    console.log('📊 Recent results sample:', recentResults.slice(0, 5));
    
    const correctCount = recentResults.filter(r => {
      const isCorrect = r.isCorrect === true;
      console.log('🔍 Checking result:', { 
        isCorrect: r.isCorrect, 
        typeof: typeof r.isCorrect, 
        boolean: isCorrect,
        correctAnswer: r.correctAnswer,
        userAnswer: r.userAnswer
      });
      return isCorrect;
    }).length;
    
    const accuracy = Math.round((correctCount / recentResults.length) * 100);
    console.log('🎯 Recent accuracy calculation:', { correctCount, totalCount: recentResults.length, accuracy });
    
    return accuracy;
  };

  // 난이도별 정답률 계산
  const calculateAccuracyByDifficulty = (results: QuizResult[]) => {
    if (!results || results.length === 0) return {};
    
    const difficultyStats: { [key: number]: { correct: number; total: number; accuracy: number } } = {};
    
    results.forEach(result => {
      const difficulty = result.difficultyLevel || 1;
      if (!difficultyStats[difficulty]) {
        difficultyStats[difficulty] = { correct: 0, total: 0, accuracy: 0 };
      }
      
      difficultyStats[difficulty].total++;
      if (result.isCorrect) {
        difficultyStats[difficulty].correct++;
      }
    });
    
    // 정답률 계산
    Object.keys(difficultyStats).forEach(difficulty => {
      const stats = difficultyStats[Number(difficulty)];
      stats.accuracy = Math.round((stats.correct / stats.total) * 100);
    });
    
    return difficultyStats;
  };

  // 학습 진도 계산
  const calculateLearningProgress = (results: QuizResult[]) => {
    if (!results || results.length === 0) {
      return {
        totalQuestions: 0,
        correctAnswers: 0,
        accuracy: 0,
        averageResponseTime: 0,
        recentStreak: 0,
        weeklyProgress: []
      };
    }

    const totalQuestions = results.length;
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctAnswers / totalQuestions) * 100);
    const averageResponseTime = Math.round(
      results.reduce((sum, r) => sum + (r.responseTimeMs || 0), 0) / totalQuestions
    );

    // 최근 연속 정답 계산
    let recentStreak = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i].isCorrect) {
        recentStreak++;
      } else {
        break;
      }
    }

    // 주간 진도 계산 (최근 7일)
    const weeklyProgress = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));
      
      const dayResults = results.filter(r => {
        const resultDate = new Date(r.createdAt);
        return resultDate >= dayStart && resultDate <= dayEnd;
      });
      
      weeklyProgress.push({
        date: dayStart.toISOString().split('T')[0],
        questions: dayResults.length,
        correct: dayResults.filter(r => r.isCorrect).length,
        accuracy: dayResults.length > 0 ? Math.round((dayResults.filter(r => r.isCorrect).length / dayResults.length) * 100) : 0
      });
    }

    return {
      totalQuestions,
      correctAnswers,
      accuracy,
      averageResponseTime,
      recentStreak,
      weeklyProgress
    };
  };

  // 학습 수준 분석
  const analyzeLearningLevel = (userStats: UserLearningStats, ageGroupComparison: AgeGroupComparison) => {
    const userAccuracy = userStats.currentAccuracyRate;
    const groupMedian = ageGroupComparison.ageGroup.medianAccuracy;
    const percentile = ageGroupComparison.percentile;
    
    let level = 'beginner';
    let recommendation = '기초 학습을 계속해주세요.';
    
    if (percentile >= 75) {
      level = 'advanced';
      recommendation = '우수한 실력입니다! 더 어려운 문제에 도전해보세요.';
    } else if (percentile >= 50) {
      level = 'intermediate';
      recommendation = '좋은 실력입니다! 꾸준히 학습해보세요.';
    } else if (percentile >= 25) {
      level = 'developing';
      recommendation = '실력이 향상되고 있습니다! 조금 더 노력해보세요.';
    }
    
    return {
      level,
      recommendation,
      comparisonText: `같은 연령대 아이들 중 상위 ${100 - percentile}%에 해당합니다.`,
      strengthAreas: [], // 추후 구현
      improvementAreas: [] // 추후 구현
    };
  };

  return {
    isLoading: computed(() => isLoading.value),
    error: computed(() => error.value),
    
    // 퀴즈 결과 관련
    saveQuizResult,
    getRecentQuizResults,
    calculateRecentAccuracy,
    calculateAccuracyByDifficulty,
    calculateLearningProgress,
    
    // 통계 관련
    getUserLearningStats,
    getUserPercentileStats,
    getAgeGroupStats,
    analyzeLearningLevel
  };
}