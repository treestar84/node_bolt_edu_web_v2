import { ref } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useAuthStore } from '@/stores/auth';
import type { Like, ContentType } from '@/types';

export function useLikesCore() {
  const { supabase } = useSupabase();
  const authStore = useAuthStore();
  
  const likes = ref<Like[]>([]);
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

  return {
    likes,
    isLoading,
    error,
    loadLikes,
    addLike,
    removeLike,
    toggleLike,
    isLikedByUser
  };
}