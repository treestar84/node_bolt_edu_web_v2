import { ref, computed } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useAuthStore } from '@/stores/auth';
import type { Like, LikeRankingItem, LikeStatistics, ContentType, LikePeriod } from '@/types';

// 헬퍼 함수들
const getPeriodFilter = (period: LikePeriod): string => {
  const now = new Date();
  switch (period) {
    case 'weekly':
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      return weekStart.toISOString();
    case 'monthly':
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return monthStart.toISOString();
    default:
      return '1970-01-01T00:00:00.000Z'; // 전체 기간
  }
};

const groupAndCount = (data: any[]) => {
  const grouped: Record<string, { content_id: string; count: number; created_at: string }> = {};
  
  data.forEach(item => {
    if (!grouped[item.content_id]) {
      grouped[item.content_id] = {
        content_id: item.content_id,
        count: 0,
        created_at: item.created_at
      };
    }
    grouped[item.content_id].count++;
    // 가장 최근 날짜 유지
    if (item.created_at > grouped[item.content_id].created_at) {
      grouped[item.content_id].created_at = item.created_at;
    }
  });
  
  return Object.values(grouped).sort((a, b) => b.count - a.count);
};

const calculateStatistics = (data: any[]) => {
  const grouped: Record<string, { totalLikes: number; uniqueUsers: Set<string>; uniqueContent: Set<string> }> = {};
  
  data.forEach(item => {
    if (!grouped[item.content_type]) {
      grouped[item.content_type] = {
        totalLikes: 0,
        uniqueUsers: new Set(),
        uniqueContent: new Set()
      };
    }
    grouped[item.content_type].totalLikes++;
    grouped[item.content_type].uniqueUsers.add(item.user_id);
    grouped[item.content_type].uniqueContent.add(item.content_id);
  });
  
  return Object.entries(grouped).map(([contentType, stats]) => ({
    content_type: contentType,
    totalLikes: stats.totalLikes,
    uniqueUsers: stats.uniqueUsers.size,
    avgLikesPerContent: stats.uniqueContent.size > 0 ? Math.round((stats.totalLikes / stats.uniqueContent.size) * 100) / 100 : 0
  }));
};

export function useLikes() {
  const { supabase } = useSupabase();
  const authStore = useAuthStore();
  
  const likes = ref<Like[]>([]);
  const ranking = ref<LikeRankingItem[]>([]);
  const statistics = ref<LikeStatistics[]>([]);
  const isLoading = ref(false);
  const error = ref<string>('');

  // 좋아요 목록 로드
  const loadLikes = async (userId?: string) => {
    const targetUserId = userId || authStore.user?.id;
    if (!targetUserId) {
      console.log('⚠️ No user ID provided for likes');
      return;
    }

    try {
      isLoading.value = true;
      error.value = '';

      console.log('🔄 Loading likes for user:', targetUserId);

      // likes 테이블부터 시도 (새로운 테이블)
      let tableName = 'likes';
      let { data, error: fetchError } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      // likes 테이블이 없으면 favorites 테이블 사용 (fallback)
      if (fetchError && (fetchError.message.includes('relation "likes" does not exist') || fetchError.code === 'PGRST116')) {
        console.log('Using favorites table as fallback');
        tableName = 'favorites';
        const result = await supabase
          .from(tableName)
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        console.error('❌ Error loading likes:', fetchError);
        error.value = fetchError.message;
        return;
      }

      likes.value = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        contentType: item.content_type,
        contentId: item.content_id,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));

      console.log('✅ Likes loaded:', likes.value.length);
    } catch (err: any) {
      console.error('💥 Error in loadLikes:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  // 좋아요 추가
  const addLike = async (contentType: ContentType, contentId: string) => {
    if (!authStore.user) {
      console.log('⚠️ No authenticated user for adding like');
      return false;
    }

    try {
      console.log('➕ Adding like:', { contentType, contentId });

      // likes 테이블부터 시도 (새로운 테이블)
      let tableName = 'likes';
      let { data, error: insertError } = await supabase
        .from(tableName)
        .insert({
          user_id: authStore.user.id,
          content_type: contentType,
          content_id: contentId
        })
        .select()
        .single();

      // likes 테이블이 없으면 favorites 테이블 사용 (fallback)
      if (insertError && (insertError.message.includes('relation "likes" does not exist') || insertError.code === 'PGRST116')) {
        console.log('Using favorites table as fallback');
        tableName = 'favorites';
        const result = await supabase
          .from(tableName)
          .insert({
            user_id: authStore.user.id,
            content_type: contentType,
            content_id: contentId
          })
          .select()
          .single();
        data = result.data;
        insertError = result.error;
      }

      if (insertError) {
        // 중복 에러는 무시 (이미 좋아요에 있음)
        if (insertError.code === '23505') {
          console.log('ℹ️ Item already liked');
          return true;
        }
        console.error('❌ Error adding like:', insertError);
        error.value = insertError.message;
        return false;
      }

      // 로컬 상태 업데이트
      const newLike: Like = {
        id: data.id,
        userId: data.user_id,
        contentType: data.content_type,
        contentId: data.content_id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      likes.value.unshift(newLike);
      console.log('✅ Added like successfully');
      return true;
    } catch (err: any) {
      console.error('💥 Error in addLike:', err);
      error.value = err.message;
      return false;
    }
  };

  // 좋아요 제거
  const removeLike = async (contentType: ContentType, contentId: string) => {
    if (!authStore.user) {
      console.log('⚠️ No authenticated user for removing like');
      return false;
    }

    try {
      console.log('➖ Removing like:', { contentType, contentId });

      // likes 테이블부터 시도 (새로운 테이블)
      let tableName = 'likes';
      let { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq('user_id', authStore.user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      // likes 테이블이 없으면 favorites 테이블 사용 (fallback)
      if (deleteError && (deleteError.message.includes('relation "likes" does not exist') || deleteError.code === 'PGRST116')) {
        console.log('Using favorites table as fallback');
        tableName = 'favorites';
        const result = await supabase
          .from(tableName)
          .delete()
          .eq('user_id', authStore.user.id)
          .eq('content_type', contentType)
          .eq('content_id', contentId);
        deleteError = result.error;
      }

      if (deleteError) {
        console.error('❌ Error removing like:', deleteError);
        error.value = deleteError.message;
        return false;
      }

      // 로컬 상태 업데이트
      likes.value = likes.value.filter(
        like => !(like.contentType === contentType && like.contentId === contentId)
      );

      console.log('✅ Removed like successfully');
      return true;
    } catch (err: any) {
      console.error('💥 Error in removeLike:', err);
      error.value = err.message;
      return false;
    }
  };

  // 좋아요 토글
  const toggleLike = async (contentType: ContentType, contentId: string) => {
    console.log(`🔄 Toggling like for: ${contentType}:${contentId}`);
    const isLiked = isLikedByUser(contentType, contentId);
    console.log(`Current state: ${isLiked ? 'liked' : 'not liked'}`);
    
    if (isLiked) {
      const success = await removeLike(contentType, contentId);
      console.log(`❌ Remove like result: ${success}`);
      return { success, isLiked: false };
    } else {
      const success = await addLike(contentType, contentId);
      console.log(`➕ Add like result: ${success}`);
      return { success, isLiked: true };
    }
  };

  // 좋아요 여부 확인
  const isLikedByUser = (contentType: ContentType, contentId: string): boolean => {
    const isLiked = likes.value.some(
      like => like.contentType === contentType && like.contentId === contentId
    );
    console.log(`🔍 Checking if liked: ${contentType}:${contentId} = ${isLiked}`, { 
      totalLikes: likes.value.length,
      relevantLikes: likes.value.filter(like => like.contentType === contentType)
    });
    return isLiked;
  };

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
        contentType: item.content_type,
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
      // 직접 쿼리로 좋아요 수 계산 (DB 함수 없이)
      // likes 테이블부터 시도 (새로운 테이블)
      let tableName = 'likes';
      let { data, error: fetchError } = await supabase
        .from(tableName)
        .select('id', { count: 'exact' })
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      // likes 테이블이 없으면 favorites 테이블 사용 (fallback)
      if (fetchError && (fetchError.message.includes('relation "likes" does not exist') || fetchError.code === 'PGRST116')) {
        console.log('Using favorites table as fallback');
        tableName = 'favorites';
        const result = await supabase
          .from(tableName)
          .select('id', { count: 'exact' })
          .eq('content_type', contentType)
          .eq('content_id', contentId);
        data = result.data;
        fetchError = result.error;
      }

      if (fetchError) {
        console.error('❌ Error getting like count:', fetchError);
        return 0;
      }

      return data?.length || 0;
    } catch (err: any) {
      console.error('💥 Error in getContentLikeCount:', err);
      return 0;
    }
  };

  // 타입별 좋아요 목록
  const likedWords = computed(() => 
    likes.value.filter(like => like.contentType === 'word')
  );

  const likedBooks = computed(() => 
    likes.value.filter(like => like.contentType === 'book')
  );

  const likedQuiz = computed(() => 
    likes.value.filter(like => like.contentType === 'quiz')
  );

  const likedPuzzle = computed(() => 
    likes.value.filter(like => like.contentType === 'puzzle')
  );

  // myLikes 별칭 추가 (LikesContentView 호환성을 위해)
  const myLikes = computed(() => {
    return likes.value.map(like => {
      // 기본 제목 설정 (contentStore 없이)
      let contentTitle = '';
      
      switch (like.contentType) {
        case 'word':
          contentTitle = `단어 ${like.contentId}`;
          break;
        case 'book':
          contentTitle = `책 ${like.contentId}`;
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
        ...like,
        content_title: contentTitle,
        content_name: contentTitle,
        content_type: like.contentType,
        created_at: like.createdAt
      };
    });
  });

  return {
    // State
    likes,
    myLikes, // 추가
    ranking,
    statistics,
    isLoading,
    error,
    
    // Computed
    likedWords,
    likedBooks,
    likedQuiz,
    likedPuzzle,
    
    // Actions
    loadLikes,
    addLike,
    removeLike,
    toggleLike,
    isLikedByUser,
    loadRanking,
    loadStatistics,
    getContentLikeCount
  };
}

// 하위 호환성을 위한 별칭
export const useFavorites = useLikes;