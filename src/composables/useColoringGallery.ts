import { ref, computed } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useSupabase } from './useSupabase';
import type { ColoringArtwork, ColoringStats } from '@/types';

export function useColoringGallery() {
  const { supabase } = useSupabase();
  const authStore = useAuthStore();
  
  // 상태 관리
  const artworks = ref<ColoringArtwork[]>([]);
  const isLoading = ref(false);
  const error = ref<string>('');
  const totalCount = ref(0);
  const currentPage = ref(1);
  const itemsPerPage = 12;
  
  // 통계 데이터
  const stats = ref<ColoringStats | null>(null);
  
  // Computed
  const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage));
  const hasNextPage = computed(() => currentPage.value < totalPages.value);
  const hasPrevPage = computed(() => currentPage.value > 1);
  const isEmpty = computed(() => artworks.value.length === 0 && !isLoading.value);
  
  // 인증 상태 확인
  const isAuthenticated = computed(() => authStore.isAuthenticated);
  const canSave = computed(() => isAuthenticated.value && stats.value && stats.value.totalArtworks < 10);
  const remainingSlots = computed(() => {
    if (!stats.value) return 10;
    return Math.max(0, 10 - stats.value.totalArtworks);
  });

  /**
   * 데이터 변환 함수: DB → 프론트엔드
   */
  const transformArtworkFromDB = (dbArtwork: any): ColoringArtwork => ({
    id: dbArtwork.id,
    userId: dbArtwork.user_id,
    wordId: dbArtwork.word_id,
    wordName: dbArtwork.word_name,
    artworkData: dbArtwork.artwork_data,
    completionPercentage: dbArtwork.completion_percentage,
    colorsUsed: Array.isArray(dbArtwork.colors_used) ? dbArtwork.colors_used : [],
    brushStrokes: dbArtwork.brush_strokes,
    timeSpentSeconds: dbArtwork.time_spent_seconds,
    createdAt: dbArtwork.created_at,
    updatedAt: dbArtwork.updated_at
  });

  /**
   * 작품 저장
   */
  const saveArtwork = async (artworkData: {
    wordId: string;
    wordName: string;
    artworkData: string;
    completionPercentage: number;
    colorsUsed: string[];
    brushStrokes: number;
    timeSpentSeconds: number;
  }): Promise<boolean> => {
    if (!authStore.isAuthenticated || !authStore.user) {
      error.value = '로그인이 필요합니다.';
      return false;
    }

    try {
      isLoading.value = true;
      error.value = '';

      console.log('💾 Saving coloring artwork:', {
        wordName: artworkData.wordName,
        completion: artworkData.completionPercentage,
        colorsCount: artworkData.colorsUsed.length,
        strokes: artworkData.brushStrokes,
        dataSize: artworkData.artworkData.length
      });

      const { data, error: saveError } = await supabase
        .from('coloring_artworks')
        .insert({
          user_id: authStore.user.id,
          word_id: artworkData.wordId,
          word_name: artworkData.wordName,
          artwork_data: artworkData.artworkData,
          completion_percentage: artworkData.completionPercentage,
          colors_used: artworkData.colorsUsed,
          brush_strokes: artworkData.brushStrokes,
          time_spent_seconds: artworkData.timeSpentSeconds
        })
        .select()
        .single();

      if (saveError) {
        console.error('❌ Error saving artwork:', saveError);
        
        // 특정 에러 메시지 처리
        if (saveError.message.includes('작품 저장 한도를 초과')) {
          error.value = '작품 저장 한도를 초과했습니다. 기존 작품을 삭제한 후 다시 시도하세요.';
        } else {
          error.value = '작품 저장 중 오류가 발생했습니다.';
        }
        return false;
      }

      if (data) {
        const newArtwork = transformArtworkFromDB(data);
        // 목록 맨 앞에 추가
        artworks.value.unshift(newArtwork);
        totalCount.value += 1;
        
        // 통계 업데이트
        await loadStats();
        
        console.log('✅ Artwork saved successfully:', newArtwork.id);
      }

      return true;
    } catch (err: any) {
      console.error('💥 Save artwork error:', err);
      error.value = err.message || '작품 저장 중 오류가 발생했습니다.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 작품 목록 로드
   */
  const loadArtworks = async (page: number = 1): Promise<void> => {
    if (!authStore.isAuthenticated || !authStore.user) {
      error.value = '로그인이 필요합니다.';
      return;
    }

    try {
      isLoading.value = true;
      error.value = '';
      currentPage.value = page;

      const offset = (page - 1) * itemsPerPage;

      console.log('📚 Loading artworks:', { page, itemsPerPage, offset });

      const { data, error: loadError } = await supabase
        .rpc('get_user_artworks', {
          p_user_id: authStore.user.id,
          p_limit: itemsPerPage,
          p_offset: offset
        });

      if (loadError) {
        console.error('❌ Error loading artworks:', loadError);
        error.value = '작품 목록을 불러오는 중 오류가 발생했습니다.';
        return;
      }

      if (data && data.length > 0) {
        artworks.value = data.map(transformArtworkFromDB);
        totalCount.value = data[0].total_count || 0;
        
        console.log('✅ Artworks loaded:', {
          count: artworks.value.length,
          total: totalCount.value,
          page: currentPage.value
        });
      } else {
        artworks.value = [];
        totalCount.value = 0;
        console.log('📚 No artworks found');
      }
    } catch (err: any) {
      console.error('💥 Load artworks error:', err);
      error.value = err.message || '작품 목록을 불러오는 중 오류가 발생했습니다.';
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 통계 로드
   */
  const loadStats = async (): Promise<void> => {
    if (!authStore.isAuthenticated || !authStore.user) {
      return;
    }

    try {
      console.log('📊 Loading coloring stats...');

      const { data, error: statsError } = await supabase
        .from('user_coloring_stats')
        .select('*')
        .eq('user_id', authStore.user.id)
        .single();

      if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Error loading stats:', statsError);
        return;
      }

      if (data) {
        stats.value = {
          totalArtworks: data.total_artworks || 0,
          avgCompletionRate: Math.round(data.avg_completion_rate || 0),
          totalTimeSpent: data.total_time_spent || 0,
          uniqueWordsColored: data.unique_words_colored || 0,
          lastArtworkDate: data.last_artwork_date || '',
          favoriteColor: data.favorite_color || ''
        };
        
        console.log('✅ Stats loaded:', stats.value);
      } else {
        // 통계 데이터가 없으면 기본값 설정
        stats.value = {
          totalArtworks: 0,
          avgCompletionRate: 0,
          totalTimeSpent: 0,
          uniqueWordsColored: 0,
          lastArtworkDate: '',
          favoriteColor: ''
        };
      }
    } catch (err: any) {
      console.error('💥 Load stats error:', err);
    }
  };

  /**
   * 작품 삭제
   */
  const deleteArtwork = async (artworkId: string): Promise<boolean> => {
    if (!authStore.isAuthenticated || !authStore.user) {
      error.value = '로그인이 필요합니다.';
      return false;
    }

    try {
      isLoading.value = true;
      error.value = '';

      console.log('🗑️ Deleting artwork:', artworkId);

      const { error: deleteError } = await supabase
        .from('coloring_artworks')
        .delete()
        .eq('id', artworkId)
        .eq('user_id', authStore.user.id); // 보안: 본인 작품만 삭제 가능

      if (deleteError) {
        console.error('❌ Error deleting artwork:', deleteError);
        error.value = '작품 삭제 중 오류가 발생했습니다.';
        return false;
      }

      // 로컬 상태에서 제거
      artworks.value = artworks.value.filter(artwork => artwork.id !== artworkId);
      totalCount.value = Math.max(0, totalCount.value - 1);
      
      // 통계 업데이트
      await loadStats();
      
      console.log('✅ Artwork deleted successfully');
      return true;
    } catch (err: any) {
      console.error('💥 Delete artwork error:', err);
      error.value = err.message || '작품 삭제 중 오류가 발생했습니다.';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * 가장 오래된 작품 삭제 (저장 한도 초과 시)
   */
  const deleteOldestArtwork = async (): Promise<boolean> => {
    if (!authStore.isAuthenticated || !authStore.user) {
      error.value = '로그인이 필요합니다.';
      return false;
    }

    try {
      console.log('🗑️ Deleting oldest artwork to make space...');

      const { error: deleteError } = await supabase
        .rpc('delete_oldest_artwork', {
          p_user_id: authStore.user.id
        });

      if (deleteError) {
        console.error('❌ Error deleting oldest artwork:', deleteError);
        error.value = '오래된 작품 삭제 중 오류가 발생했습니다.';
        return false;
      }

      // 현재 페이지 새로고침
      await loadArtworks(currentPage.value);
      await loadStats();
      
      console.log('✅ Oldest artwork deleted successfully');
      return true;
    } catch (err: any) {
      console.error('💥 Delete oldest artwork error:', err);
      error.value = err.message || '오래된 작품 삭제 중 오류가 발생했습니다.';
      return false;
    }
  };

  /**
   * 페이지 이동
   */
  const goToPage = async (page: number): Promise<void> => {
    if (page < 1 || page > totalPages.value) return;
    await loadArtworks(page);
  };

  const nextPage = async (): Promise<void> => {
    if (hasNextPage.value) {
      await goToPage(currentPage.value + 1);
    }
  };

  const prevPage = async (): Promise<void> => {
    if (hasPrevPage.value) {
      await goToPage(currentPage.value - 1);
    }
  };

  /**
   * 초기화
   */
  const initialize = async (): Promise<void> => {
    if (!authStore.isAuthenticated) {
      console.log('⚠️ User not authenticated, skipping gallery initialization');
      return;
    }

    await Promise.all([
      loadStats(),
      loadArtworks(1)
    ]);
  };

  /**
   * 새로고침
   */
  const refresh = async (): Promise<void> => {
    await initialize();
  };

  return {
    // 상태
    artworks,
    isLoading,
    error,
    totalCount,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isEmpty,
    stats,
    
    // 인증 관련
    isAuthenticated,
    canSave,
    remainingSlots,
    
    // 액션
    saveArtwork,
    loadArtworks,
    loadStats,
    deleteArtwork,
    deleteOldestArtwork,
    goToPage,
    nextPage,
    prevPage,
    initialize,
    refresh
  };
}