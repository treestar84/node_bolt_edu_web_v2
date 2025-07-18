import { ref, computed } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useAuthStore } from '@/stores/auth';
import type { ContentType } from '@/types';

export interface Favorite {
  id: string;
  userId: string;
  contentType: ContentType;
  contentId: string;
  createdAt: string;
}

export function useFavorites() {
  const { supabase } = useSupabase();
  const authStore = useAuthStore();
  
  const favorites = ref<Favorite[]>([]);
  const isLoading = ref(false);
  const error = ref<string>('');

  // 즐겨찾기 목록 로드
  const loadFavorites = async () => {
    if (!authStore.user) {
      console.log('⚠️ No authenticated user for favorites');
      return;
    }

    try {
      isLoading.value = true;
      error.value = '';

      console.log('🔄 Loading favorites for user:', authStore.user.id);

      const { data, error: fetchError } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', authStore.user.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('❌ Error loading favorites:', fetchError);
        error.value = fetchError.message;
        return;
      }

      favorites.value = (data || []).map(item => ({
        id: item.id,
        userId: item.user_id,
        contentType: item.content_type,
        contentId: item.content_id,
        createdAt: item.created_at
      }));

      console.log('✅ Favorites loaded:', favorites.value.length);
    } catch (err: any) {
      console.error('💥 Error in loadFavorites:', err);
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  };

  // 즐겨찾기 추가
  const addToFavorites = async (contentType: ContentType, contentId: string) => {
    if (!authStore.user) {
      console.log('⚠️ No authenticated user for adding favorite');
      return false;
    }

    try {
      console.log('➕ Adding to favorites:', { contentType, contentId });

      const { data, error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: authStore.user.id,
          content_type: contentType,
          content_id: contentId
        })
        .select()
        .single();

      if (insertError) {
        // 중복 에러는 무시 (이미 즐겨찾기에 있음)
        if (insertError.code === '23505') {
          console.log('ℹ️ Item already in favorites');
          return true;
        }
        console.error('❌ Error adding to favorites:', insertError);
        error.value = insertError.message;
        return false;
      }

      // 로컬 상태 업데이트
      const newFavorite: Favorite = {
        id: data.id,
        userId: data.user_id,
        contentType: data.content_type,
        contentId: data.content_id,
        createdAt: data.created_at
      };

      favorites.value.unshift(newFavorite);
      console.log('✅ Added to favorites successfully');
      return true;
    } catch (err: any) {
      console.error('💥 Error in addToFavorites:', err);
      error.value = err.message;
      return false;
    }
  };

  // 즐겨찾기 제거
  const removeFromFavorites = async (contentType: ContentType, contentId: string) => {
    if (!authStore.user) {
      console.log('⚠️ No authenticated user for removing favorite');
      return false;
    }

    try {
      console.log('➖ Removing from favorites:', { contentType, contentId });

      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', authStore.user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId);

      if (deleteError) {
        console.error('❌ Error removing from favorites:', deleteError);
        error.value = deleteError.message;
        return false;
      }

      // 로컬 상태 업데이트
      favorites.value = favorites.value.filter(
        fav => !(fav.contentType === contentType && fav.contentId === contentId)
      );

      console.log('✅ Removed from favorites successfully');
      return true;
    } catch (err: any) {
      console.error('💥 Error in removeFromFavorites:', err);
      error.value = err.message;
      return false;
    }
  };

  // 즐겨찾기 토글
  const toggleFavorite = async (contentType: ContentType, contentId: string) => {
    const isFavorited = isFavorite(contentType, contentId);
    
    if (isFavorited) {
      return await removeFromFavorites(contentType, contentId);
    } else {
      return await addToFavorites(contentType, contentId);
    }
  };

  // 즐겨찾기 여부 확인
  const isFavorite = (contentType: ContentType, contentId: string): boolean => {
    return favorites.value.some(
      fav => fav.contentType === contentType && fav.contentId === contentId
    );
  };

  // 타입별 즐겨찾기 목록
  const favoriteWords = computed(() => 
    favorites.value.filter(fav => fav.contentType === 'word')
  );

  const favoriteBooks = computed(() => 
    favorites.value.filter(fav => fav.contentType === 'book')
  );

  return {
    // State
    favorites,
    isLoading,
    error,
    
    // Computed
    favoriteWords,
    favoriteBooks,
    
    // Actions
    loadFavorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite
  };
}