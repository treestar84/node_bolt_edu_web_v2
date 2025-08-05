import { supabase } from './useSupabaseClient';

export function useSupabaseBooks() {
  // Books helpers
  async function getBooks(userId: string, childAge: number) {
    console.log('📖 Getting books for user:', userId, 'age:', childAge);
    const { data, error } = await supabase
      .from('books')
      .select(`
        *,
        book_pages (*)
      `)
      .or(`owner_type.eq.global,owner_id.eq.${userId}`)
      .lte('min_age', childAge)
      .gte('max_age', childAge)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Get books error:', error);
      throw error;
    }
    console.log('✅ Books retrieved:', data?.length);
    return data || [];
  }

  return {
    getBooks
  };
}