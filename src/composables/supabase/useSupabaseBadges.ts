import { supabase } from './useSupabaseClient';

export function useSupabaseBadges() {
  // Badges helpers - FIXED: 올바른 필드명 사용
  async function getBadges() {
    console.log('🏆 Getting badges...');
    const { data, error } = await supabase
      .from('badges')
      .select('*')
      .order('required_score'); // FIXED: 올바른 필드명

    if (error) {
      console.error('❌ Get badges error:', error);
      throw error;
    }
    console.log('✅ Badges retrieved:', data?.length);
    return data || [];
  }

  async function getUserBadges(userId: string) {
    console.log('🎖️ Getting user badges for:', userId);
    const { data, error } = await supabase
      .from('user_badges')
      .select(`
        *,
        badges (*)
      `)
      .eq('user_id', userId)
      .order('unlocked_at', { ascending: false });

    if (error) {
      console.error('❌ Get user badges error:', error);
      throw error;
    }
    console.log('✅ User badges retrieved:', data?.length);
    return data || [];
  }

  async function unlockBadge(userId: string, badgeId: string) {
    console.log('🔓 Unlocking badge for user:', userId, 'badge:', badgeId);
    const { data, error } = await supabase
      .from('user_badges')
      .insert({
        user_id: userId,
        badge_id: badgeId
      })
      .select(`
        *,
        badges (*)
      `)
      .single();

    if (error && error.code !== '23505') {
      console.error('❌ Unlock badge error:', error);
      throw error; // Ignore duplicate key error
    }
    console.log('✅ Badge unlocked:', data);
    return data;
  }

  return {
    getBadges,
    getUserBadges,
    unlockBadge
  };
}