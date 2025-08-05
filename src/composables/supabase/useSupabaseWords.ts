import { supabase } from './useSupabaseClient';

export function useSupabaseWords() {
  // Words helpers
  async function getWords(userId: string, childAge: number) {
    console.log('📚 Getting words for user:', userId, 'age:', childAge);
    const { data, error } = await supabase
      .from('words')
      .select('*')
      .or(`owner_type.eq.global,owner_id.eq.${userId}`)
      .lte('min_age', childAge)
      .gte('max_age', childAge)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get words error:', error);
      throw error;
    }
    console.log('✅ Words retrieved:', data?.length);
    return data || [];
  }

  async function addWord(wordData: any, userId: string) {
    console.log('➕ Adding word for user:', userId);
    const { data, error } = await supabase
      .from('words')
      .insert({
        ...wordData,
        owner_type: 'user',
        owner_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Add word error:', error);
      throw error;
    }
    console.log('✅ Word added:', data);
    return data;
  }

  return {
    getWords,
    addWord
  };
}