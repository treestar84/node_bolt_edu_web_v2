import { ref } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import type { LikeRankingItem, ContentType, LikePeriod } from '@/types';
import { getPeriodFilter, groupAndCount } from './useLikesHelpers';

export function useLikesRanking() {
  const { supabase } = useSupabase();
  
  const ranking = ref<LikeRankingItem[]>([]);
  const error = ref<string>('');

  // 좋아요 랭킹 로드
  const loadRanking = async (contentType: ContentType, period: LikePeriod = 'all', limit: number = 10) => {
    try {
      console.log('🔄 Loading likes ranking:', { contentType, period, limit });

      // 직접 쿼리로 랭킹 계산 (DB 함수 없이)
      const periodFilter = getPeriodFilter(period);
      
      // likes 테이블부터 시도 (새로운 테이블)
      let tableName = 'likes';
      let result = await supabase
        .from(tableName)
        .select('content_id, created_at')
        .eq('content_type', contentType)
        .gte('created_at', periodFilter)
        .order('created_at', { ascending: false });

      // likes 테이블이 없으면 favorites 테이블 사용 (fallback)
      if (result.error && (result.error.message.includes('relation "likes" does not exist') || result.error.code === 'PGRST116')) {
        console.log('Using favorites table as fallback');
        tableName = 'favorites';
        result = await supabase
          .from(tableName)
          .select('content_id, created_at')
          .eq('content_type', contentType)
          .gte('created_at', periodFilter)
          .order('created_at', { ascending: false });
      }
      
      if (result.error) {
        console.error('❌ Error loading ranking:', result.error);
        error.value = result.error.message;
        return;
      }

      // 클라이언트 사이드에서 집계 및 랭킹 계산
      const grouped = groupAndCount(result.data || []);
      const limitedData = grouped.slice(0, limit);

      ranking.value = limitedData.map((item, index) => {
        // 기본 제목 설정
        let contentTitle = '';
        switch (contentType) {
          case 'word':
            contentTitle = `단어 ${item.content_id}`;
            break;
          case 'book':
            contentTitle = `책 ${item.content_id}`;
            break;
          case 'quiz':
            contentTitle = '퀴즈';
            break;
          case 'puzzle':
            contentTitle = '퍼즐';
            break;
          default:
            contentTitle = '알 수 없는 콘텐츠';
        }
        
        return {
          id: item.content_id,
          contentId: item.content_id,
          content_id: item.content_id,
          content_title: contentTitle,
          content_name: contentTitle,
          content_type: contentType,
          likeCount: item.count,
          like_count: item.count,
          latestLike: item.created_at,
          rankPosition: index + 1
        };
      });

      console.log('✅ Ranking loaded:', ranking.value.length);
    } catch (err: any) {
      console.error('💥 Error in loadRanking:', err);
      error.value = err.message;
      ranking.value = []; // 에러 시 빈 배열로 설정
    }
  };

  return {
    ranking,
    error,
    loadRanking
  };
}