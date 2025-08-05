import { supabase } from './useSupabaseClient';

export function useSupabaseProgress() {
  // Progress helpers - FIXED: 올바른 필드명 사용
  async function getUserProgress(userId: string) {
    console.log('📊 Getting user progress for:', userId);
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('❌ Get progress error:', error);
      throw error;
    }
    console.log('✅ Progress retrieved:', data);
    return data;
  }

  async function updateUserProgress(userId: string, updates: Partial<any>) {
    console.log('📈 Updating user progress for:', userId, updates);
    const { data, error } = await supabase
      .from('user_progress')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Update progress error:', error);
      throw error;
    }
    console.log('✅ Progress updated:', data);
    return data;
  }

  return {
    getUserProgress,
    updateUserProgress
  };
}