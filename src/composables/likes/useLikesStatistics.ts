import { ref } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import type { LikeStatistics, ContentType, LikePeriod } from '@/types';
import { getPeriodFilter, calculateStatistics } from './useLikesHelpers';

export function useLikesStatistics() {
  const { supabase } = useSupabase();
  
  const statistics = ref<LikeStatistics[]>([]);
  const error = ref<string>('');

  // 좋아요 통계 로드
  const loadStatistics = async (contentType?: ContentType, period: LikePeriod = 'all') => {
    try {
      console.log('🔄 Loading likes statistics:', { contentType, period });

      // 직접 쿼리로 통계 계산 (DB 함수 없이)
      const periodFilter = getPeriodFilter(period);
      
      // likes 테이블부터 시도 (새로운 테이블)
      let tableName = 'likes';
      let query = supabase
        .from(tableName)
        .select('content_type, user_id, content_id, created_at')
        .gte('created_at', periodFilter);
      
      if (contentType) {
        query = query.eq('content_type', contentType);
      }
      
      let result = await query;

      // likes 테이블이 없으면 favorites 테이블 사용 (fallback)
      if (result.error && (result.error.message.includes('relation "likes" does not exist') || result.error.code === 'PGRST116')) {
        console.log('Using favorites table as fallback');
        tableName = 'favorites';
        query = supabase
          .from(tableName)
          .select('content_type, user_id, content_id, created_at')
          .gte('created_at', periodFilter);
        
        if (contentType) {
          query = query.eq('content_type', contentType);
        }
        
        result = await query;
      }
      
      if (result.error) {
        console.error('❌ Error loading statistics:', result.error);
        error.value = result.error.message;
        return;
      }

      // 클라이언트 사이드에서 통계 계산
      const data = calculateStatistics(result.data || []);

      statistics.value = data.map(item => ({
        contentType: item.contentType,
        totalLikes: item.totalLikes,
        uniqueUsers: item.uniqueUsers,
        avgLikesPerContent: item.avgLikesPerContent
      }));

      console.log('✅ Statistics loaded:', statistics.value.length);
    } catch (err: any) {
      console.error('💥 Error in loadStatistics:', err);
      error.value = err.message;
      statistics.value = []; // 에러 시 빈 배열로 설정
    }
  };

  // 특정 콘텐츠의 좋아요 수 조회
  const getContentLikeCount = async (contentType: ContentType, contentId: string): Promise<number> => {
    try {
      console.log('🔍 Getting like count for:', { contentType, contentId });

      // likes 테이블부터 시도 (새로운 테이블)
      let tableName = 'likes';
      let result = await supabase
        .from(tableName)
        .select('id')
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      // likes 테이블이 없으면 favorites 테이블 사용 (fallback)
      if (result.error && (result.error.message.includes('relation "likes" does not exist') || result.error.code === 'PGRST116')) {
        console.log('Using favorites table as fallback');
        tableName = 'favorites';
        result = await supabase
          .from(tableName)
          .select('id')
          .eq('content_type', contentType)
          .eq('content_id', contentId);
      }

      if (result.error) {
        console.error('❌ Error getting like count:', result.error);
        return 0;
      }

      const count = result.data?.length || 0;
      console.log(`✅ Like count for ${contentType}:${contentId} = ${count}`);
      return count;
    } catch (err: any) {
      console.error('💥 Error in getContentLikeCount:', err);
      return 0;
    }
  };

  return {
    statistics,
    error,
    loadStatistics,
    getContentLikeCount
  };
}